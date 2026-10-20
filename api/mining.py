"""Data-mining playground: classification, clustering, association rules, prediction."""
import json
import os
import threading
import time
from collections import OrderedDict
from itertools import combinations

import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN
from sklearn.decomposition import PCA
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.inspection import permutation_importance
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (average_precision_score, calinski_harabasz_score, davies_bouldin_score,
                             log_loss, precision_recall_curve, roc_auc_score, roc_curve, silhouette_score,
                             brier_score_loss)
from sklearn.mixture import GaussianMixture
from sklearn.neighbors import NearestNeighbors
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier

from data import (CAT_COLS, CATEGORY_LEVELS, DF, FEATURES, MODEL_DIR, NUM_COLS, PRE, X_TRAIN, XT_TEST,
                  XT_TRAIN, Y_TRAIN, YT_TEST, YT_TRAIN, clean)

_LOCK = threading.Lock()


class LRU(OrderedDict):
    def __init__(self, cap=24):
        super().__init__()
        self.cap = cap
        self._inflight = {}

    def get_or(self, key, fn):
        with _LOCK:
            if key in self:
                self.move_to_end(key)
                return self[key]
            lk = self._inflight.setdefault(key, threading.Lock())
        # one computation per key; concurrent callers wait for it instead of retraining
        with lk:
            with _LOCK:
                if key in self:
                    return self[key]
            val = fn()
            with _LOCK:
                self[key] = val
                self._inflight.pop(key, None)
                if len(self) > self.cap:
                    self.popitem(last=False)
        return val


def _clamp(v, lo, hi, default, cast=float):
    try:
        v = cast(v)
    except Exception:  # noqa
        return default
    return max(lo, min(hi, v))


# ---------------------------------------------------------------- classification
MODEL_LABELS = {"lr": "Logistic Regression", "dt": "Decision Tree", "rf": "Random Forest",
                "gb": "Gradient Boosting", "mlp": "Neural Network (MLP)"}

DEFAULT_PARAMS = {
    "lr": {"C": 1.0, "penalty": "l2", "class_weight": "balanced"},
    "dt": {"max_depth": 8, "min_samples_split": 2, "criterion": "gini", "class_weight": "balanced"},
    "rf": {"n_estimators": 100, "max_depth": 12, "max_features": "sqrt", "class_weight": "balanced"},
    "gb": {"n_estimators": 100, "learning_rate": 0.1, "max_depth": 5, "subsample": 1.0},
    "mlp": {"hidden": "64,32", "alpha": 0.0001, "learning_rate_init": 0.001, "activation": "relu"},
}


def _norm_params(model, p):
    d = dict(DEFAULT_PARAMS[model])
    d.update({k: v for k, v in (p or {}).items() if k in d})
    cw = lambda v: "balanced" if v in ("balanced", True, "true") else None  # noqa
    if model == "lr":
        d["C"] = _clamp(d["C"], 0.001, 100, 1.0)
        d["penalty"] = d["penalty"] if d["penalty"] in ("l1", "l2") else "l2"
        d["class_weight"] = cw(d["class_weight"])
    elif model == "dt":
        d["max_depth"] = int(_clamp(d["max_depth"], 1, 30, 8, int))
        d["min_samples_split"] = int(_clamp(d["min_samples_split"], 2, 500, 2, int))
        d["criterion"] = d["criterion"] if d["criterion"] in ("gini", "entropy") else "gini"
        d["class_weight"] = cw(d["class_weight"])
    elif model == "rf":
        d["n_estimators"] = int(_clamp(d["n_estimators"], 10, 400, 100, int))
        d["max_depth"] = int(_clamp(d["max_depth"], 2, 30, 12, int))
        d["max_features"] = d["max_features"] if d["max_features"] in ("sqrt", "log2") else "sqrt"
        d["class_weight"] = cw(d["class_weight"])
    elif model == "gb":
        d["n_estimators"] = int(_clamp(d["n_estimators"], 10, 300, 100, int))
        d["learning_rate"] = _clamp(d["learning_rate"], 0.01, 1.0, 0.1)
        d["max_depth"] = int(_clamp(d["max_depth"], 1, 8, 5, int))
        d["subsample"] = _clamp(d["subsample"], 0.3, 1.0, 1.0)
    elif model == "mlp":
        try:
            h = tuple(int(x) for x in str(d["hidden"]).split(",") if x.strip())
            h = tuple(max(2, min(256, x)) for x in h)[:4] or (64, 32)
        except Exception:  # noqa
            h = (64, 32)
        d["hidden"] = ",".join(map(str, h))
        d["alpha"] = _clamp(d["alpha"], 1e-6, 1.0, 1e-4)
        d["learning_rate_init"] = _clamp(d["learning_rate_init"], 1e-4, 0.1, 1e-3)
        d["activation"] = d["activation"] if d["activation"] in ("relu", "tanh", "logistic") else "relu"
    return d


def _build(model, d):
    if model == "lr":
        solver = "liblinear" if d["penalty"] == "l1" else "lbfgs"
        return LogisticRegression(C=d["C"], penalty=d["penalty"], solver=solver, max_iter=1000,
                                  class_weight=d["class_weight"])
    if model == "dt":
        return DecisionTreeClassifier(max_depth=d["max_depth"], min_samples_split=d["min_samples_split"],
                                      criterion=d["criterion"], class_weight=d["class_weight"], random_state=42)
    if model == "rf":
        return RandomForestClassifier(n_estimators=d["n_estimators"], max_depth=d["max_depth"],
                                      max_features=d["max_features"], class_weight=d["class_weight"],
                                      n_jobs=-1, random_state=42)
    if model == "gb":
        return GradientBoostingClassifier(n_estimators=d["n_estimators"], learning_rate=d["learning_rate"],
                                          max_depth=d["max_depth"], subsample=d["subsample"], random_state=42)
    if model == "mlp":
        h = tuple(int(x) for x in d["hidden"].split(","))
        return MLPClassifier(hidden_layer_sizes=h, alpha=d["alpha"], learning_rate_init=d["learning_rate_init"],
                             activation=d["activation"], max_iter=200, early_stopping=True, random_state=42)
    raise ValueError(model)


_FITTED = LRU(cap=16)  # key -> (model_obj, train_time)
_RESULTS = LRU(cap=16)


def _key(model, d):
    return model + "|" + json.dumps(d, sort_keys=True)


def fit_model(model, params=None):
    d = _norm_params(model, params)
    key = _key(model, d)

    def _do():
        m = _build(model, d)
        t = time.time()
        m.fit(XT_TRAIN, YT_TRAIN)
        return m, time.time() - t
    m, tt = _FITTED.get_or(key, _do)
    return m, tt, d, key


def _down(xs, ys, n=150):
    xs, ys = np.asarray(xs), np.asarray(ys)
    if len(xs) <= n:
        idx = np.arange(len(xs))
    else:
        idx = np.unique(np.linspace(0, len(xs) - 1, n).astype(int))
    return [{"x": float(xs[i]), "y": float(ys[i])} for i in idx]


_NUM_MEAN = PRE.named_transformers_["num"].mean_ if hasattr(PRE.named_transformers_["num"], "mean_") else None
_NUM_SCALE = PRE.named_transformers_["num"].scale_ if hasattr(PRE.named_transformers_["num"], "scale_") else None


def _readable_split(feat_idx, thr):
    name = FEATURES[feat_idx]
    if feat_idx < len(NUM_COLS) and _NUM_MEAN is not None:
        raw = thr * _NUM_SCALE[feat_idx] + _NUM_MEAN[feat_idx]
        if name in ("DTIRatio",):
            txt = f"{raw:.2f}"
        elif name == "InterestRate":
            txt = f"{raw:.1f}%"
        else:
            txt = f"{raw:,.0f}"
        return name, f"{name} ≤ {txt}", float(raw)
    col, lvl = name.split("_", 1)
    return name, f"{col} ≠ {lvl}", None


def _tree_struct(tree, max_depth=4):
    t = tree.tree_
    nodes = []
    # actual (unweighted) default rate per node, measured on the training rows
    ind = tree.decision_path(XT_TRAIN)
    cnt = np.asarray(ind.sum(axis=0)).ravel()
    dft = np.asarray(ind.T @ YT_TRAIN).ravel()
    rates = np.divide(dft, np.maximum(cnt, 1))

    def rec(i, depth):
        rate = float(rates[i])
        leaf = t.children_left[i] == -1 or depth >= max_depth
        node = {"id": int(i), "depth": depth, "samples": int(t.n_node_samples[i]), "rate": rate,
                "impurity": float(t.impurity[i]), "leaf": bool(leaf)}
        if not leaf:
            fname, label, raw = _readable_split(t.feature[i], t.threshold[i])
            node.update({"feature": fname, "label": label,
                         "left": int(t.children_left[i]), "right": int(t.children_right[i])})
            nodes.append(node)
            rec(t.children_left[i], depth + 1)
            rec(t.children_right[i], depth + 1)
        else:
            nodes.append(node)
    rec(0, 0)
    return nodes


def _importance(model, m):
    if hasattr(m, "feature_importances_"):
        imp = m.feature_importances_
        items = [{"feature": f, "value": float(v)} for f, v in zip(FEATURES, imp)]
        kind = "Gini / impurity importance"
    elif hasattr(m, "coef_"):
        items = [{"feature": f, "value": float(v)} for f, v in zip(FEATURES, m.coef_[0])]
        kind = "Coefficient (log-odds per 1 std)"
    else:
        rng = np.random.RandomState(0)
        idx = rng.choice(len(XT_TEST), 3000, replace=False)
        r = permutation_importance(m, XT_TEST[idx], YT_TEST[idx], n_repeats=3, random_state=0,
                                   scoring="roc_auc", n_jobs=1)
        items = [{"feature": f, "value": float(v)} for f, v in zip(FEATURES, r.importances_mean)]
        kind = "Permutation importance (drop in ROC-AUC)"
    items.sort(key=lambda x: abs(x["value"]), reverse=True)
    return {"kind": kind, "items": items[:14]}


def classify(model="gb", params=None):
    if model not in MODEL_LABELS:
        model = "gb"
    m, tt, d, key = fit_model(model, params)

    def _do():
        p = m.predict_proba(XT_TEST)[:, 1]
        y = YT_TEST
        fpr, tpr, _ = roc_curve(y, p)
        prec, rec, _ = precision_recall_curve(y, p)
        sweep = []
        for th in np.round(np.arange(0.01, 1.0, 0.01), 2):
            pred = p >= th
            tp = int(((pred == 1) & (y == 1)).sum()); fp = int(((pred == 1) & (y == 0)).sum())
            fn = int(((pred == 0) & (y == 1)).sum()); tn = int(((pred == 0) & (y == 0)).sum())
            pr = tp / (tp + fp) if tp + fp else 0.0
            rc = tp / (tp + fn) if tp + fn else 0.0
            f1 = 2 * pr * rc / (pr + rc) if pr + rc else 0.0
            sweep.append({"t": float(th), "tp": tp, "fp": fp, "fn": fn, "tn": tn, "precision": pr,
                          "recall": rc, "f1": f1, "accuracy": (tp + tn) / len(y)})
        bins = np.linspace(0, 1, 26)
        h0, _ = np.histogram(p[y == 0], bins=bins)
        h1, _ = np.histogram(p[y == 1], bins=bins)
        hist = [{"x": float((bins[i] + bins[i + 1]) / 2), "neg": int(h0[i]), "pos": int(h1[i])} for i in range(25)]

        viz = {}
        if model == "lr":
            rng = np.random.RandomState(1)
            idx = rng.choice(len(XT_TEST), 500, replace=False)
            z = m.decision_function(XT_TEST[idx])
            viz["sigmoid"] = [{"z": float(z[i]), "p": float(p[idx][i]), "y": int(y[idx][i])} for i in range(len(idx))]
            viz["intercept"] = float(m.intercept_[0])
        elif model == "dt":
            viz["tree"] = _tree_struct(m, max_depth=4)
            viz["depth"] = int(m.get_depth()); viz["leaves"] = int(m.get_n_leaves())
        elif model == "rf":
            accs = []
            for i, est in enumerate(m.estimators_[:40]):
                pp = est.predict_proba(XT_TEST)[:, 1]
                accs.append({"tree": i + 1, "auc": float(roc_auc_score(y, pp)),
                             "depth": int(est.get_depth()), "leaves": int(est.get_n_leaves())})
            viz["trees"] = accs
            # forest AUC as trees are added
            cum, curve = None, []
            n = len(m.estimators_)
            step = max(1, n // 40)
            for i, est in enumerate(m.estimators_):
                pp = est.predict_proba(XT_TEST)[:, 1]
                cum = pp if cum is None else cum + pp
                if (i + 1) % step == 0 or i == n - 1:
                    curve.append({"trees": i + 1, "auc": float(roc_auc_score(y, cum / (i + 1)))})
            viz["growth"] = curve
        elif model == "gb":
            rng = np.random.RandomState(2)
            itr = rng.choice(len(XT_TRAIN), 8000, replace=False)
            tr_loss, te_loss, te_auc = [], [], []
            n = m.n_estimators_
            step = max(1, n // 60)
            stages_tr = m.staged_predict_proba(XT_TRAIN[itr])
            stages_te = m.staged_predict_proba(XT_TEST)
            for i, (a, b) in enumerate(zip(stages_tr, stages_te)):
                if (i + 1) % step == 0 or i == n - 1:
                    tr_loss.append(float(log_loss(YT_TRAIN[itr], a[:, 1], labels=[0, 1])))
                    te_loss.append(float(log_loss(y, b[:, 1], labels=[0, 1])))
                    te_auc.append({"stage": i + 1, "auc": float(roc_auc_score(y, b[:, 1]))})
            viz["stages"] = [{"stage": a["stage"], "train": tr_loss[k], "test": te_loss[k], "auc": a["auc"]}
                             for k, a in enumerate(te_auc)]
        elif model == "mlp":
            viz["loss"] = [{"epoch": i + 1, "loss": float(v)} for i, v in enumerate(m.loss_curve_)]
            if getattr(m, "validation_scores_", None):
                viz["val"] = [{"epoch": i + 1, "acc": float(v)} for i, v in enumerate(m.validation_scores_)]
            viz["layers"] = [XT_TRAIN.shape[1]] + [int(x) for x in d["hidden"].split(",")] + [1]
            viz["epochs"] = int(m.n_iter_)

        pred5 = p >= 0.5
        res = {
            "model": model, "label": MODEL_LABELS[model], "params": d, "train_time": round(tt, 2),
            "n_train": int(len(YT_TRAIN)), "n_test": int(len(y)), "n_features": int(XT_TRAIN.shape[1]),
            "auc": float(roc_auc_score(y, p)), "ap": float(average_precision_score(y, p)),
            "log_loss": float(log_loss(y, p)), "brier": float(brier_score_loss(y, p)),
            "base_rate": float(y.mean()),
            "accuracy@0.5": float((pred5 == y).mean()),
            "roc": _down(fpr, tpr), "pr": _down(rec[::-1], prec[::-1]),
            "sweep": sweep, "hist": hist, "importance": _importance(model, m), "viz": viz,
        }
        return clean(res)

    return _RESULTS.get_or(key, _do)


def compare():
    out = []
    for k in ["lr", "dt", "rf", "gb", "mlp"]:
        r = classify(k, None)
        s = next(x for x in r["sweep"] if abs(x["t"] - 0.5) < 1e-9)
        out.append({"model": k, "label": r["label"], "auc": r["auc"], "ap": r["ap"], "f1": s["f1"],
                    "precision": s["precision"], "recall": s["recall"], "accuracy": s["accuracy"],
                    "brier": r["brier"], "train_time": r["train_time"], "roc": r["roc"]})
    return clean({"models": out})


# ---------------------------------------------------------------- clustering
CLUSTER_DEFAULT_FEATURES = ["Income", "CreditScore", "LoanAmount", "DTIRatio", "MonthsEmployed"]
SEGMENT_NAMES = {
    2: ["Prime", "Subprime"],
    3: ["Prime", "Standard", "Subprime"],
    4: ["Prime", "Near-Prime", "Standard", "Subprime"],
    5: ["Super-Prime", "Prime", "Standard", "Near-Subprime", "Subprime"],
}
_CLU = LRU(cap=24)
_ELBOW = LRU(cap=12)


def _seg_names(k):
    if k in SEGMENT_NAMES:
        return SEGMENT_NAMES[k]
    return [f"Tier {i + 1}" + (" (lowest risk)" if i == 0 else " (highest risk)" if i == k - 1 else "") for i in range(k)]


def _feat_matrix(features):
    feats = [f for f in features if f in NUM_COLS] or CLUSTER_DEFAULT_FEATURES
    sc = StandardScaler().fit(DF[feats].values)
    return feats, sc.transform(DF[feats].values), sc


def _lloyd(X, k, n_init=10, max_iter=300, seed=42):
    from sklearn.cluster import kmeans_plusplus
    best = None
    for run in range(n_init):
        c, _ = kmeans_plusplus(X, k, random_state=seed + run)
        hist = [c.copy()]
        for it in range(max_iter):
            d = ((X[:, None, :] - c[None, :, :]) ** 2).sum(-1)
            lab = d.argmin(1)
            newc = np.array([X[lab == j].mean(0) if (lab == j).any() else c[j] for j in range(k)])
            shift = np.abs(newc - c).max()
            c = newc
            hist.append(c.copy())
            if shift < 1e-4:
                break
        d = ((X[:, None, :] - c[None, :, :]) ** 2).sum(-1)
        lab = d.argmin(1)
        inertia = float(d[np.arange(len(X)), lab].sum())
        if best is None or inertia < best[2]:
            best = (lab, c, inertia, hist)
    return best


def _sample_idx(n, size, seed=0):
    if n <= size:
        return np.arange(n)
    return np.random.RandomState(seed).choice(n, size, replace=False)


def cluster(algo="kmeans", k=3, features=None, n_init=10, linkage="ward", eps=0.8, min_samples=15,
            covariance="full"):
    algo = algo if algo in ("kmeans", "gmm", "agglomerative", "dbscan") else "kmeans"
    k = int(_clamp(k, 2, 10, 3, int))
    n_init = int(_clamp(n_init, 1, 20, 10, int))
    eps = _clamp(eps, 0.05, 5.0, 0.6)
    min_samples = int(_clamp(min_samples, 2, 200, 10, int))
    linkage = linkage if linkage in ("ward", "complete", "average", "single") else "ward"
    covariance = covariance if covariance in ("full", "tied", "diag", "spherical") else "full"
    feats, X, sc = _feat_matrix(features or CLUSTER_DEFAULT_FEATURES)
    key = json.dumps([algo, k, feats, n_init, linkage, eps, min_samples, covariance])

    def _do():
        t = time.time()
        pca = PCA(n_components=min(3, len(feats))).fit(X)
        notes = []
        extra = {}
        idx_all = np.arange(len(X))
        history = None
        if algo == "kmeans":
            lab, cent, inertia, hist = _lloyd(X, k, n_init=n_init)
            idx = idx_all
            extra["inertia"] = inertia
            extra["iterations"] = len(hist) - 1
            step = max(1, len(hist) // 25)
            snaps = hist[::step] + ([hist[-1]] if (len(hist) - 1) % step else [])
            history = [pca.transform(s).tolist() for s in snaps]
        elif algo == "gmm":
            gm = GaussianMixture(n_components=k, covariance_type=covariance, random_state=42, n_init=2).fit(X)
            lab = gm.predict(X)
            idx = idx_all
            extra["bic"] = float(gm.bic(X)); extra["aic"] = float(gm.aic(X))
            probs = gm.predict_proba(X).max(1)
            extra["avg_confidence"] = float(probs.mean())
            extra["uncertain_share"] = float((probs < 0.6).mean())
        elif algo == "agglomerative":
            from scipy.cluster.hierarchy import dendrogram, fcluster
            from scipy.cluster.hierarchy import linkage as sp_link
            idx = _sample_idx(len(X), 3000, 1)
            Z = sp_link(X[idx], method=linkage)
            lab = fcluster(Z, k, criterion="maxclust") - 1
            dn = dendrogram(Z, truncate_mode="lastp", p=30, no_plot=True)
            extra["dendrogram"] = {"icoord": dn["icoord"], "dcoord": dn["dcoord"]}
            extra["cut_height"] = float(Z[-(k - 1), 2] + Z[-k, 2]) / 2 if k > 1 else float(Z[-1, 2])
            notes.append(f"Hierarchical clustering is O(n²) in memory, so it runs on a stratified sample of {len(idx):,} borrowers.")
        else:  # dbscan
            idx = _sample_idx(len(X), 8000, 2)
            db = DBSCAN(eps=eps, min_samples=min_samples).fit(X[idx])
            lab = db.labels_
            nn = NearestNeighbors(n_neighbors=min_samples).fit(X[idx][:2000])
            dist, _ = nn.kneighbors(X[idx][:2000])
            kd = np.sort(dist[:, -1])
            extra["kdist"] = _down(np.arange(len(kd)), kd, 120)
            extra["noise"] = int((lab == -1).sum())
            notes.append(f"DBSCAN runs on a {len(idx):,}-borrower sample. Noise points are labelled -1.")

        Xs = X[idx]
        labs = np.asarray(lab)
        ids = sorted(set(labs.tolist()) - {-1})
        n_clusters = len(ids)

        # quality (on a sample, excluding noise)
        m_idx = _sample_idx(len(Xs), 4000, 3)
        mask = labs[m_idx] != -1
        q = {"silhouette": None, "davies_bouldin": None, "calinski": None}
        if n_clusters >= 2 and mask.sum() > n_clusters:
            xs, ls = Xs[m_idx][mask], labs[m_idx][mask]
            if len(set(ls.tolist())) >= 2:
                q["silhouette"] = float(silhouette_score(xs, ls))
                q["davies_bouldin"] = float(davies_bouldin_score(xs, ls))
                q["calinski"] = float(calinski_harabasz_score(xs, ls))
        else:
            notes.append("Fewer than 2 clusters were found, so silhouette is undefined. Try a smaller eps or min_samples.")

        sub = DF.iloc[idx].copy()
        sub["_c"] = labs
        prof = []
        for c in ids:
            g = sub[sub["_c"] == c]
            row = {"cluster": int(c), "size": int(len(g)), "share": float(len(g) / len(sub)),
                   "default_rate": float(g["Default"].mean())}
            for f in NUM_COLS:
                row[f] = float(g[f].mean())
            prof.append(row)
        prof.sort(key=lambda r: r["default_rate"])
        names = _seg_names(len(prof)) if prof else []
        for i, r in enumerate(prof):
            r["name"] = names[i]
            r["rank"] = i
        rank_of = {r["cluster"]: r["rank"] for r in prof}
        noise = sub[sub["_c"] == -1]
        noise_prof = {"size": int(len(noise)), "default_rate": float(noise["Default"].mean())} if len(noise) else None

        P = pca.transform(Xs)
        d_idx = _sample_idx(len(Xs), 2500, 4)
        pts = [{"x": float(P[i, 0]), "y": float(P[i, 1]), "z": float(P[i, 2]) if P.shape[1] > 2 else 0.0,
                "c": int(rank_of.get(int(labs[i]), -1)), "d": int(sub["Default"].values[i])} for i in d_idx]
        centroids = []
        for r in prof:
            mpts = P[labs == r["cluster"]]
            centroids.append({"rank": r["rank"], "x": float(mpts[:, 0].mean()), "y": float(mpts[:, 1].mean()),
                              "z": float(mpts[:, 2].mean()) if P.shape[1] > 2 else 0.0})
        if history is not None:
            # relabel history order to rank order
            order = [r["cluster"] for r in prof]
            history = [[snap[o] for o in order] for snap in history]

        loadings = [{"feature": f, "pc1": float(pca.components_[0][j]),
                     "pc2": float(pca.components_[1][j]) if len(pca.components_) > 1 else 0.0}
                    for j, f in enumerate(feats)]
        return clean({
            "algo": algo, "k": k, "n_clusters": n_clusters, "features": feats, "n_points": int(len(idx)),
            "params": {"n_init": n_init, "linkage": linkage, "eps": eps, "min_samples": min_samples,
                       "covariance": covariance},
            "quality": q, "profiles": prof, "noise": noise_prof, "points": pts, "centroids": centroids,
            "history": history, "explained": [float(v) for v in pca.explained_variance_ratio_],
            "loadings": loadings, "extra": extra, "notes": notes, "time": round(time.time() - t, 2),
        })

    return _CLU.get_or(key, _do)


def elbow(algo="kmeans", features=None):
    feats, X, _ = _feat_matrix(features or CLUSTER_DEFAULT_FEATURES)
    algo = "gmm" if algo == "gmm" else "agglomerative" if algo == "agglomerative" else "kmeans"
    key = json.dumps([algo, feats])

    def _do():
        from sklearn.cluster import KMeans
        idx = _sample_idx(len(X), 15000, 5)
        Xs = X[idx]
        s_idx = _sample_idx(len(Xs), 3000, 6)
        out = []
        Z = None
        if algo == "agglomerative":
            from scipy.cluster.hierarchy import fcluster
            from scipy.cluster.hierarchy import linkage as sp_link
            a_idx = _sample_idx(len(X), 3000, 1)
            Z = sp_link(X[a_idx], method="ward")
        for k in range(2, 11):
            row = {"k": k}
            if algo == "kmeans":
                km = KMeans(n_clusters=k, n_init=3, random_state=42).fit(Xs)
                row["inertia"] = float(km.inertia_ * len(X) / len(Xs))
                row["silhouette"] = float(silhouette_score(Xs[s_idx], km.labels_[s_idx]))
            elif algo == "gmm":
                gm = GaussianMixture(n_components=k, random_state=42).fit(Xs)
                row["bic"] = float(gm.bic(Xs))
                row["silhouette"] = float(silhouette_score(Xs[s_idx], gm.predict(Xs[s_idx])))
            else:
                lab = fcluster(Z, k, criterion="maxclust")
                row["height"] = float(Z[-(k - 1), 2])
                row["silhouette"] = float(silhouette_score(X[a_idx], lab)) if len(set(lab)) > 1 else None
            out.append(row)
        return clean({"algo": algo, "features": feats, "curve": out})

    return _ELBOW.get_or(key, _do)


# ---------------------------------------------------------------- association rules
_ASSOC = LRU(cap=24)
BIN_LABELS = {3: ["Low", "Mid", "High"], 4: ["Low", "Mid-Low", "Mid-High", "High"],
              5: ["Very Low", "Low", "Mid", "High", "Very High"]}
LOAN_LABELS = {3: ["Small", "Medium", "Large"], 4: ["Small", "Medium", "Large", "Very Large"],
               5: ["Tiny", "Small", "Medium", "Large", "Very Large"]}


def _transactions(bins):
    tr = DF.loc[X_TRAIN.index]
    items = pd.DataFrame(index=tr.index)
    for col, lab in [("Income", BIN_LABELS), ("LoanAmount", LOAN_LABELS), ("DTIRatio", BIN_LABELS),
                     ("InterestRate", BIN_LABELS)]:
        q = pd.qcut(tr[col], bins, labels=lab[bins])
        for l in lab[bins]:
            items[f"{col}={l}"] = (q == l).values
    cs = pd.cut(tr["CreditScore"], [0, 579, 669, 739, 900], labels=["Poor", "Fair", "Good", "Excellent"])
    for l in ["Poor", "Fair", "Good", "Excellent"]:
        items[f"CreditScore={l}"] = (cs == l).values
    for l in CATEGORY_LEVELS["EmploymentType"]:
        items[f"Employment={l}"] = (tr["EmploymentType"] == l).values
    items["CoSigner=Yes"] = (tr["HasCoSigner"] == "Yes").values
    items["CoSigner=No"] = (tr["HasCoSigner"] == "No").values
    items["Default=Yes"] = (tr["Default"] == 1).values
    items["Default=No"] = (tr["Default"] == 0).values
    return items.astype(bool)


def _eclat(T, min_support, max_len):
    cols = list(T.columns)
    M = T.values
    n = len(M)
    out = {}
    single = [(frozenset([cols[j]]), M[:, j]) for j in range(len(cols))]
    single = [(s, v) for s, v in single if v.sum() / n >= min_support]

    def dfs(prefix, tids, cands, depth):
        for i, (s, v) in enumerate(cands):
            new = v if tids is None else (tids & v)
            sup = new.sum() / n
            if sup < min_support:
                continue
            items = prefix | s
            out[items] = sup
            if depth < max_len:
                rest = [(s2, v2) for s2, v2 in cands[i + 1:]]
                dfs(items, new, rest, depth + 1)
    dfs(frozenset(), None, single, 1)
    return out


def _mine(T, algo, min_support, max_len):
    if algo == "eclat":
        return _eclat(T, min_support, max_len)
    from mlxtend.frequent_patterns import apriori, fpgrowth
    fn = apriori if algo == "apriori" else fpgrowth
    fi = fn(T, min_support=min_support, use_colnames=True, max_len=max_len)
    return {frozenset(s): float(v) for s, v in zip(fi["itemsets"], fi["support"])}


def associate(algo="apriori", min_support=0.03, min_confidence=0.3, min_lift=1.0, bins=3, max_len=4,
              target="default"):
    algo = algo if algo in ("apriori", "fpgrowth", "eclat") else "apriori"
    min_support = _clamp(min_support, 0.01, 0.5, 0.03)
    min_confidence = _clamp(min_confidence, 0.05, 1.0, 0.3)
    min_lift = _clamp(min_lift, 0.0, 20.0, 1.0)
    bins = int(_clamp(bins, 3, 5, 3, int))
    max_len = int(_clamp(max_len, 2, 5, 4, int))
    target = target if target in ("default", "any") else "default"
    key = json.dumps([algo, round(min_support, 4), bins, max_len])

    def _mine_cached():
        T = _transactions(bins)
        t = time.time()
        sup = _mine(T, algo, min_support, max_len)
        return T, sup, time.time() - t
    T, sup, mine_time = _ASSOC.get_or(key, _mine_cached)

    rules = []
    for S, s in sup.items():
        if len(S) < 2:
            continue
        for r in range(1, min(2, len(S) - 1) + 1):
            for Y in combinations(S, r):
                Y = frozenset(Y)
                if target == "default" and "Default=Yes" not in Y:
                    continue
                X = S - Y
                if X not in sup or Y not in sup:
                    continue
                conf = s / sup[X]
                if conf < min_confidence:
                    continue
                lift = conf / sup[Y]
                if lift < min_lift:
                    continue
                lev = s - sup[X] * sup[Y]
                conv = (1 - sup[Y]) / (1 - conf) if conf < 1 else None
                rules.append({"antecedent": sorted(X), "consequent": sorted(Y), "support": s,
                              "confidence": conf, "lift": lift, "leverage": lev, "conviction": conv})
    rules.sort(key=lambda r: (-r["lift"], -r["confidence"]))
    levels = {}
    for S in sup:
        levels[len(S)] = levels.get(len(S), 0) + 1
    item_support = {c: float(T[c].mean()) for c in T.columns}
    return clean({
        "algo": algo, "params": {"min_support": min_support, "min_confidence": min_confidence,
                                 "min_lift": min_lift, "bins": bins, "max_len": max_len, "target": target},
        "n_transactions": int(len(T)), "n_items": int(T.shape[1]), "n_itemsets": len(sup),
        "levels": [{"k": k, "count": v} for k, v in sorted(levels.items())],
        "n_rules": len(rules), "rules": rules[:80], "mine_time": round(mine_time, 3),
        "item_support": item_support, "baseline_default": item_support.get("Default=Yes"),
    })


def assoc_benchmark(min_support=0.03, bins=3, max_len=4):
    out = []
    for a in ["apriori", "fpgrowth", "eclat"]:
        T = _transactions(int(bins))
        t = time.time()
        s = _mine(T, a, float(min_support), int(max_len))
        out.append({"algo": a, "time": time.time() - t, "itemsets": len(s)})
    return clean({"results": out})


# ---------------------------------------------------------------- prediction
WARN_RULES = [
    ("DTIRatio", lambda b: b["DTIRatio"] > 0.5, "Debt-to-income above 0.50"),
    ("CreditScore", lambda b: b["CreditScore"] < 580, "Credit score in the Poor band (< 580)"),
    ("InterestRate", lambda b: b["InterestRate"] > 18, "Interest rate above 18%"),
    ("EmploymentType", lambda b: b["EmploymentType"] == "Unemployed", "Currently unemployed"),
    ("MonthsEmployed", lambda b: b["MonthsEmployed"] < 12, "Under 12 months in current job"),
    ("LoanAmount", lambda b: b["LoanAmount"] / max(b["Income"], 1) > 2.5, "Loan is more than 2.5x annual income"),
    ("HasCoSigner", lambda b: b["HasCoSigner"] == "No" and b["LoanAmount"] / max(b["Income"], 1) > 1.5,
     "Large loan with no co-signer"),
]

_CHAMPION = {"model": None, "source": None}


def _champion():
    if _CHAMPION["model"] is not None:
        return _CHAMPION["model"]
    path = os.path.join(MODEL_DIR, "best_classifier.joblib")
    try:
        import warnings
        import joblib
        with warnings.catch_warnings():
            warnings.simplefilter("error")
            m = joblib.load(path)
        auc = roc_auc_score(YT_TEST, m.predict_proba(XT_TEST)[:, 1])
        if auc > 0.95:
            _CHAMPION.update(model=m, source="prediction/saved_models/best_classifier.joblib")
            return m
    except Exception:  # noqa
        pass
    m, _, _, _ = fit_model("gb", None)
    _CHAMPION.update(model=m, source="retrained Gradient Boosting (same params, random_state=42)")
    return m


def _model_for(model):
    if model == "gb":
        return _champion()
    m, _, _, _ = fit_model(model, None)
    return m


def default_borrower():
    b = {c: float(DF[c].median()) for c in NUM_COLS}
    for c in ["Age", "Income", "LoanAmount", "CreditScore", "MonthsEmployed", "NumCreditLines", "LoanTerm"]:
        b[c] = int(round(b[c]))
    for c in CAT_COLS:
        b[c] = DF[c].mode()[0]
    return b


def _frame(rows):
    return PRE.transform(pd.DataFrame(rows)[NUM_COLS + CAT_COLS])


def predict(borrower, model="gb", zones=(0.2, 0.45, 0.7)):
    model = model if model in MODEL_LABELS else "gb"
    b = default_borrower()
    for k, v in (borrower or {}).items():
        if k in NUM_COLS:
            try:
                b[k] = float(v)
            except Exception:  # noqa
                pass
        elif k in CAT_COLS and v in CATEGORY_LEVELS[k]:
            b[k] = v
    z = sorted(float(x) for x in zones)[:3] if zones and len(zones) >= 3 else [0.2, 0.45, 0.7]
    m = _model_for(model)
    p = float(m.predict_proba(_frame([b]))[0, 1])
    zone = "Low" if p < z[0] else "Moderate" if p < z[1] else "High" if p < z[2] else "Critical"
    action = {"Low": "Auto-approve", "Moderate": "Standard manual underwriting",
              "High": "Require collateral or co-signer", "Critical": "Reject / escalate"}[zone]

    typical = default_borrower()
    rows = []
    feats = NUM_COLS + CAT_COLS
    for f in feats:
        r = dict(b)
        r[f] = typical[f]
        rows.append(r)
    ps = m.predict_proba(_frame(rows))[:, 1]
    contrib = [{"feature": f, "value": b[f], "typical": typical[f], "delta": float(p - ps[i])}
               for i, f in enumerate(feats)]
    contrib.sort(key=lambda x: abs(x["delta"]), reverse=True)

    whatif = {}
    sweep_rows, meta = [], []
    for f in NUM_COLS:
        lo, hi = float(DF[f].min()), float(DF[f].max())
        vals = np.linspace(lo, hi, 30)
        for v in vals:
            r = dict(b); r[f] = float(v); sweep_rows.append(r); meta.append((f, float(v)))
    sp = m.predict_proba(_frame(sweep_rows))[:, 1]
    for (f, v), pp in zip(meta, sp):
        whatif.setdefault(f, []).append({"x": v, "p": float(pp)})

    others = {}
    fb = _frame([b])
    for k in MODEL_LABELS:
        try:
            others[k] = float(_model_for(k).predict_proba(fb)[0, 1])
        except Exception:  # noqa
            pass

    warnings_ = [msg for f, fn, msg in WARN_RULES if fn(b)]
    return clean({
        "borrower": b, "model": model, "label": MODEL_LABELS[model], "probability": p, "zone": zone,
        "action": action, "zones": z, "contributions": contrib, "warnings": warnings_, "whatif": whatif,
        "all_models": others, "champion_source": _CHAMPION["source"] if model == "gb" else None,
    })


def form_schema():
    return clean({
        "numeric": {c: {"min": float(DF[c].min()), "max": float(DF[c].max()), "median": float(DF[c].median())}
                    for c in NUM_COLS},
        "categorical": CATEGORY_LEVELS,
        "default": default_borrower(),
        "presets": {
            "Prime borrower": {"Age": 45, "Income": 135000, "LoanAmount": 40000, "CreditScore": 790,
                               "MonthsEmployed": 110, "NumCreditLines": 2, "InterestRate": 5.5, "LoanTerm": 36,
                               "DTIRatio": 0.18, "Education": "Master's", "EmploymentType": "Full-time",
                               "MaritalStatus": "Married", "HasMortgage": "Yes", "HasDependents": "Yes",
                               "LoanPurpose": "Home", "HasCoSigner": "Yes"},
            "Borderline": {"Age": 31, "Income": 32000, "LoanAmount": 190000, "CreditScore": 610,
                           "MonthsEmployed": 30, "NumCreditLines": 3, "InterestRate": 14.5, "LoanTerm": 48,
                           "DTIRatio": 0.48, "Education": "Bachelor's", "EmploymentType": "Part-time",
                           "MaritalStatus": "Single", "HasMortgage": "No", "HasDependents": "No",
                           "LoanPurpose": "Business", "HasCoSigner": "No"},
            "High risk": {"Age": 24, "Income": 22000, "LoanAmount": 210000, "CreditScore": 410,
                          "MonthsEmployed": 4, "NumCreditLines": 4, "InterestRate": 23.0, "LoanTerm": 60,
                          "DTIRatio": 0.82, "Education": "High School", "EmploymentType": "Unemployed",
                          "MaritalStatus": "Single", "HasMortgage": "No", "HasDependents": "Yes",
                          "LoanPurpose": "Other", "HasCoSigner": "No"},
        },
    })


def warmup():
    """Train default models in the background so the demo is instant."""
    for k in ["lr", "dt", "rf", "mlp", "gb"]:
        try:
            classify(k, None)
        except Exception as e:  # noqa
            print("[warmup]", k, e)
    _champion()
    try:
        cluster("kmeans", 3)
        elbow("kmeans")
        associate("apriori")
    except Exception as e:  # noqa
        print("[warmup]", e)
    print("[warmup] default models ready")
