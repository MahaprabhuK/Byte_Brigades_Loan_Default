"""
Builds studio/public/snapshot.json: precomputed API responses for the defaults,
the OLAP presets and common settings. The dashboard uses it when the Python
backend is unreachable (server stopped mid-demo, or the static preview build).

Keys are  "<path>"  for GET requests and  "<path>|<canonical JSON body>"  for POST,
where canonical JSON sorts object keys. studio/src/lib/api.ts builds the same key.
"""
import itertools
import json
import math
import os

import mining
import olap
import prep


def _norm(v):
    """Integer-valued floats become ints so keys match JavaScript's JSON."""
    if isinstance(v, float) and math.isfinite(v) and v.is_integer():
        return int(v)
    if isinstance(v, dict):
        return {k: _norm(x) for k, x in v.items()}
    if isinstance(v, (list, tuple)):
        return [_norm(x) for x in v]
    return v


def canonical(v):
    return json.dumps(_norm(v), sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _slim(v):
    """Round floats to keep the file small."""
    if isinstance(v, float):
        if not math.isfinite(v):
            return None
        return round(v, 6) if abs(v) < 1e5 else round(v, 1)
    if isinstance(v, dict):
        return {k: _slim(x) for k, x in v.items()}
    if isinstance(v, list):
        return [_slim(x) for x in v]
    return v


CLS_DEFAULTS = {
    "lr": {"C": 1, "penalty": "l2", "class_weight": "balanced"},
    "dt": {"max_depth": 8, "min_samples_split": 2, "criterion": "gini", "class_weight": "balanced"},
    "rf": {"n_estimators": 100, "max_depth": 12, "max_features": "sqrt", "class_weight": "balanced"},
    "gb": {"n_estimators": 100, "learning_rate": 0.1, "max_depth": 5, "subsample": 1.0},
    "mlp": {"hidden": "64,32", "alpha": 0.0001, "learning_rate_init": 0.001, "activation": "relu"},
}
CLS_VARIANTS = [
    ("dt", {"max_depth": d}) for d in (3, 4, 5, 6, 10, 12)
] + [
    ("dt", {"criterion": "entropy"}), ("dt", {"class_weight": None}),
    ("lr", {"penalty": "l1"}), ("lr", {"class_weight": None}),
    ("rf", {"n_estimators": 50}), ("rf", {"n_estimators": 200}), ("rf", {"class_weight": None}),
    ("gb", {"n_estimators": 50}), ("gb", {"n_estimators": 200}), ("gb", {"learning_rate": 0.05}),
    ("gb", {"learning_rate": 0.3}), ("gb", {"max_depth": 3}),
    ("mlp", {"hidden": "32,16"}), ("mlp", {"hidden": "128,64,32"}), ("mlp", {"activation": "tanh"}),
]

CLUSTER_BASE = {"algo": "kmeans", "k": 3, "features": mining.CLUSTER_DEFAULT_FEATURES, "n_init": 10,
                "linkage": "ward", "covariance": "full", "eps": 0.8, "min_samples": 15}
ASSOC_BASE = {"algo": "apriori", "min_support": 0.03, "min_confidence": 0.3, "min_lift": 1,
              "bins": 3, "max_len": 4, "target": "default"}


def build(path):
    snap = {}

    def put(p, body, resp):
        snap[p if body is None else p + "|" + canonical(body)] = _slim(resp)

    put("/api/overview", None, prep.overview())
    put("/api/samples?n=8", None, prep.samples(8, 7))
    put("/api/warehouse/schema", None, olap.schema())
    put("/api/olap/meta", None, olap.meta())
    put("/api/predict/schema", None, mining.form_schema())

    # preprocessing: scaler x split, plus every inspect feature at the default
    for sc in ("standard", "minmax", "robust"):
        for ts in (0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4):
            b = {"scaler": sc, "test_size": ts, "focus": "Income"}
            put("/api/preprocess", b, prep.preprocess(sc, ts, "Income"))
    for f in ["Age", "LoanAmount", "CreditScore", "MonthsEmployed", "NumCreditLines", "InterestRate", "LoanTerm", "DTIRatio"]:
        for sc in ("standard", "minmax", "robust"):
            put("/api/preprocess", {"scaler": sc, "test_size": 0.2, "focus": f}, prep.preprocess(sc, 0.2, f))

    # OLAP
    def cube(axes, measure="default_rate", filters=None, credit_min=None, filtered=False):
        body = {"axes": axes, "measure": measure}
        if filtered:
            body.update({"filters": filters or {}, "credit_min": credit_min})
        put("/api/olap/cube", body, olap.cube(axes, measure, filters, credit_min))

    for m in olap.MEASURES:
        cube(["Education", "EmploymentType", "LoanPurpose"], m)
    base_sets = [
        ["AgeBand", "Education", "ALL"], ["AgeGroup", "Education", "ALL"], ["ALL", "Education", "ALL"],
        ["AgeBand", "ALL", "ALL"], ["AgeGroup", "ALL", "ALL"],
        ["EmploymentType", "ALL", "ALL"], ["EmploymentType", "LoanPurpose", "ALL"], ["EmploymentType", "ALL", "LoanPurpose"],
        ["LoanPurpose", "ALL", "ALL"], ["ALL", "LoanPurpose", "ALL"],
        ["AgeGroup", "CreditScoreGroup", "LoanPurpose"], ["AgeBand", "CreditScoreGroup", "LoanPurpose"],
        ["AgeGroup", "CreditTier", "LoanPurpose"], ["AgeGroup", "CreditBand", "LoanPurpose"],
        ["AgeGroup", "ALL", "LoanPurpose"], ["ALL", "CreditScoreGroup", "LoanPurpose"], ["AgeGroup", "CreditScoreGroup", "ALL"],
        ["Education", "EmploymentType", "ALL"], ["Education", "EmploymentType", "LoanPurpose"],
        ["CreditScoreGroup", "EmploymentType", "LoanPurpose"], ["IncomeLevel", "CreditTier", "EmploymentType"],
        ["IncomeBand", "CreditTier", "EmploymentType"],
    ]
    for a in base_sets:
        cube(a)
    for p in itertools.permutations(["Education", "EmploymentType", "ALL"]):
        cube(list(p))
    for p in itertools.permutations(["Education", "EmploymentType", "LoanPurpose"]):
        cube(list(p))
    for p in itertools.permutations(["AgeGroup", "CreditScoreGroup", "LoanPurpose"]):
        cube(list(p))
    # slice preset on every axis value
    sl_axes = ["AgeGroup", "CreditScoreGroup", "LoanPurpose"]
    for d in sl_axes:
        for v in olap.DIMS[d][1]:
            cube(sl_axes, filters={d: [v]}, filtered=True)
    for v in olap.DIMS["LoanPurpose"][1]:
        cube(["Education", "EmploymentType", "LoanPurpose"], filters={"LoanPurpose": [v]}, filtered=True)
    for v in olap.DIMS["EmploymentType"][1]:
        cube(["Education", "EmploymentType", "LoanPurpose"], filters={"EmploymentType": [v]}, filtered=True)
    # dice preset and a few nearby selections
    dx = ["Education", "EmploymentType", "LoanPurpose"]
    dice_sets = [
        {"Education": ["Bachelor's", "Master's"], "EmploymentType": ["Full-time"]},
        {"Education": ["Bachelor's", "Master's"]},
        {"EmploymentType": ["Full-time"]},
        {"Education": ["Bachelor's", "Master's"], "EmploymentType": ["Full-time", "Self-employed"]},
        {},
    ]
    for f in dice_sets:
        for cm in (None, 650, 600, 700):
            cube(dx, filters={k: sorted(v) for k, v in f.items()}, credit_min=cm, filtered=True)

    # classification
    put("/api/classify/compare", None, mining.compare())
    for m, p in CLS_DEFAULTS.items():
        put("/api/classify", {"model": m, "params": p}, mining.classify(m, p))
    for m, change in CLS_VARIANTS:
        p = dict(CLS_DEFAULTS[m]); p.update(change)
        put("/api/classify", {"model": m, "params": p}, mining.classify(m, p))

    # clustering
    def clu(**kw):
        b = dict(CLUSTER_BASE); b.update(kw)
        put("/api/cluster", b, mining.cluster(b["algo"], b["k"], b["features"], b["n_init"], b["linkage"],
                                              b["eps"], b["min_samples"], b["covariance"]))
    for k in range(2, 9):
        clu(k=k)
    for k in range(2, 7):
        clu(algo="gmm", k=k)
        clu(algo="agglomerative", k=k)
    for lk in ("complete", "average"):
        clu(algo="agglomerative", linkage=lk)
    clu(algo="dbscan")
    clu(algo="dbscan", eps=0.5, min_samples=5)
    clu(algo="dbscan", eps=0.6, min_samples=10)
    for a in ("kmeans", "gmm", "agglomerative"):
        put("/api/cluster/elbow", {"algo": a, "features": mining.CLUSTER_DEFAULT_FEATURES},
            mining.elbow(a, mining.CLUSTER_DEFAULT_FEATURES))

    # association rules
    def assoc(**kw):
        b = dict(ASSOC_BASE); b.update(kw)
        put("/api/associate", b, mining.associate(b["algo"], b["min_support"], b["min_confidence"], b["min_lift"],
                                                  b["bins"], b["max_len"], b["target"]))
    for a in ("apriori", "fpgrowth", "eclat"):
        for s in (0.02, 0.025, 0.03, 0.035, 0.04, 0.05):
            assoc(algo=a, min_support=s)
        assoc(algo=a, target="any")
    for c in (0.4, 0.5, 0.6):
        assoc(min_confidence=c)
    for l in (2, 3, 4):
        assoc(min_lift=l)
    for bn in (4, 5):
        assoc(bins=bn)
    for ml in (2, 3, 5):
        assoc(max_len=ml)
    put("/api/associate/benchmark", {"min_support": 0.03, "bins": 3, "max_len": 4}, mining.assoc_benchmark(0.03, 3, 4))

    # prediction: every preset with every model
    presets = mining.form_schema()["presets"]
    for name, b in presets.items():
        for m in ("gb", "rf", "lr", "dt", "mlp"):
            put("/api/predict", {"borrower": b, "model": m, "zones": [0.2, 0.45, 0.7]}, mining.predict(b, m, (0.2, 0.45, 0.7)))

    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(snap, f, separators=(",", ":"))
    print(f"[snapshot] {len(snap)} responses -> {path} ({os.path.getsize(path) / 1e6:.1f} MB)")
