"""Overview + preprocessing playground."""
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

from data import DF, X_ALL, Y_ALL, NUM_COLS, CAT_COLS, RANDOM_STATE, make_preprocessor, feature_names, clean


def overview():
    n = len(DF)
    d = int(DF["Default"].sum())
    return clean({
        "rows": n,
        "columns": DF.shape[1],
        "attributes": DF.shape[1],
        "defaults": d,
        "non_defaults": n - d,
        "default_rate": d / n,
        "imbalance_ratio": (n - d) / d,
        "missing": int(DF.isnull().sum().sum()),
        "duplicates": int(DF.duplicated().sum()),
        "portfolio_value": float(DF["LoanAmount"].sum()),
        "avg_income": float(DF["Income"].mean()),
        "avg_credit": float(DF["CreditScore"].mean()),
        "avg_loan": float(DF["LoanAmount"].mean()),
        "num_cols": NUM_COLS,
        "cat_cols": CAT_COLS,
        "dtypes": {c: str(t) for c, t in DF.dtypes.items()},
    })


def samples(n: int = 8, seed: int = 7):
    s = DF.sample(n=n, random_state=seed)
    return clean({"columns": list(DF.columns), "rows": s.to_dict(orient="records")})


def _hist(values, bins=24, rng=None):
    counts, edges = np.histogram(values, bins=bins, range=rng)
    return [{"x": float((edges[i] + edges[i + 1]) / 2), "count": int(counts[i])} for i in range(len(counts))]


def preprocess(scaler="standard", test_size=0.2, focus="Income", n_rows=6, seed=7):
    test_size = float(min(max(test_size, 0.1), 0.4))
    if focus not in NUM_COLS:
        focus = "Income"
    Xtr, Xte, ytr, yte = train_test_split(X_ALL, Y_ALL, test_size=test_size,
                                          random_state=RANDOM_STATE, stratify=Y_ALL)
    pre = make_preprocessor(scaler).fit(Xtr)
    names = feature_names(pre)

    sample = DF.sample(n=n_rows, random_state=seed)
    before = sample.to_dict(orient="records")
    after_mat = pre.transform(sample.drop(columns=["LoanID", "Default"]))
    after = []
    for i, (_, r) in enumerate(sample.iterrows()):
        row = {"LoanID": r["LoanID"]}
        row.update({names[j]: round(float(after_mat[i, j]), 3) for j in range(len(names))})
        row["Default"] = int(r["Default"])
        after.append(row)

    tr_t = pre.transform(Xtr)
    col_idx = names.index(focus)
    raw_vals = Xtr[focus].values
    sc_vals = tr_t[:, col_idx]

    scale_stats = []
    for j, c in enumerate(NUM_COLS):
        scale_stats.append({
            "feature": c,
            "raw_mean": float(Xtr[c].mean()), "raw_std": float(Xtr[c].std()),
            "raw_min": float(Xtr[c].min()), "raw_max": float(Xtr[c].max()),
            "new_mean": float(tr_t[:, j].mean()), "new_std": float(tr_t[:, j].std()),
            "new_min": float(tr_t[:, j].min()), "new_max": float(tr_t[:, j].max()),
        })

    onehot = []
    for c in CAT_COLS:
        levels = sorted(DF[c].unique().tolist())
        onehot.append({"column": c, "levels": levels, "dropped": levels[0],
                       "new_columns": [f"{c}_{l}" for l in levels[1:]]})

    corr = DF[NUM_COLS + ["Default"]].corr().round(3)

    return clean({
        "scaler": scaler,
        "test_size": test_size,
        "quality": {"rows": len(DF), "missing": int(DF.isnull().sum().sum()),
                    "duplicates": int(DF.duplicated().sum()),
                    "missing_per_col": {k: int(v) for k, v in DF.isnull().sum().items()}},
        "split": {
            "train": int(len(Xtr)), "test": int(len(Xte)),
            "train_default_rate": float(ytr.mean()), "test_default_rate": float(yte.mean()),
            "train_defaults": int(ytr.sum()), "test_defaults": int(yte.sum()),
        },
        "features_before": len(NUM_COLS) + len(CAT_COLS),
        "features_after": len(names),
        "feature_names": names,
        "before": before,
        "after": after,
        "focus": focus,
        "hist_before": _hist(raw_vals),
        "hist_after": _hist(sc_vals),
        "scale_stats": scale_stats,
        "onehot": onehot,
        "corr": {"labels": list(corr.columns), "matrix": corr.values.tolist()},
    })
