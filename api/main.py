"""
Byte Brigades — Loan Default Studio API
---------------------------------------
FastAPI backend that serves the interactive dashboard (studio/) with live results
computed from the project's own data, star-schema warehouse and models.

Run from the project root:
    python api/main.py            -> http://localhost:8000  (API + built dashboard)
    python api/main.py --snapshot -> writes studio/public/snapshot.json (offline fallback)
"""
import json
import os
import sys
import threading
import warnings
from typing import Any, Dict, List, Optional

sys.path.insert(0, os.path.dirname(__file__))
warnings.filterwarnings("ignore")

from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.responses import FileResponse  # noqa: E402
from fastapi.staticfiles import StaticFiles  # noqa: E402
from pydantic import BaseModel  # noqa: E402

import mining  # noqa: E402
import olap  # noqa: E402
import prep  # noqa: E402
from data import ROOT  # noqa: E402

app = FastAPI(title="Byte Brigades Loan Default Studio API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

STATE = {"warm": False}


def _warm():
    mining.warmup()
    STATE["warm"] = True


# WARMUP=0 skips background training (useful on hosts with a fraction of a CPU)
if os.environ.get("WARMUP", "1") != "0":
    threading.Thread(target=_warm, daemon=True).start()
else:
    STATE["warm"] = True

# Precomputed responses (studio/public/snapshot.json) answer default/preset requests
# instantly; anything else is computed live.
from fastapi import Request  # noqa: E402
from fastapi.responses import Response  # noqa: E402

_SNAP = {}
for _p in (os.path.join(ROOT, "studio", "public", "snapshot.json"), os.path.join(ROOT, "studio", "dist", "snapshot.json")):
    if os.path.exists(_p):
        try:
            with open(_p) as _f:
                _SNAP = json.load(_f)
            break
        except Exception:  # noqa
            pass


@app.middleware("http")
async def _snapshot_cache(request: Request, call_next):
    path = request.url.path
    if _SNAP and path.startswith("/api/") and path != "/api/health":
        key = path + (("?" + request.url.query) if request.url.query else "")
        if request.method == "POST":
            body = await request.body()
            try:
                import snapshot as _snapmod
                key = path + "|" + _snapmod.canonical(json.loads(body or b"{}"))
            except Exception:  # noqa
                key = None

            async def _receive():
                return {"type": "http.request", "body": body, "more_body": False}
            request = Request(request.scope, _receive)
        if key and key in _SNAP:
            return Response(json.dumps(_SNAP[key]), media_type="application/json", headers={"x-cache": "snapshot"})
    return await call_next(request)


# ------------------------------------------------------------------ models
class PrepReq(BaseModel):
    scaler: str = "standard"
    test_size: float = 0.2
    focus: str = "Income"


class CubeReq(BaseModel):
    axes: List[str] = ["Education", "EmploymentType", "LoanPurpose"]
    measure: str = "default_rate"
    filters: Dict[str, List[str]] = {}
    credit_min: Optional[int] = None
    credit_max: Optional[int] = None


class SqlReq(BaseModel):
    query: str


class ClassReq(BaseModel):
    model: str = "gb"
    params: Dict[str, Any] = {}


class ClusterReq(BaseModel):
    algo: str = "kmeans"
    k: int = 3
    features: List[str] = mining.CLUSTER_DEFAULT_FEATURES
    n_init: int = 10
    linkage: str = "ward"
    eps: float = 0.8
    min_samples: int = 10
    covariance: str = "full"


class ElbowReq(BaseModel):
    algo: str = "kmeans"
    features: List[str] = mining.CLUSTER_DEFAULT_FEATURES


class AssocReq(BaseModel):
    algo: str = "apriori"
    min_support: float = 0.03
    min_confidence: float = 0.3
    min_lift: float = 1.0
    bins: int = 3
    max_len: int = 4
    target: str = "default"


class PredReq(BaseModel):
    borrower: Dict[str, Any] = {}
    model: str = "gb"
    zones: List[float] = [0.2, 0.45, 0.7]


# ------------------------------------------------------------------ routes
@app.get("/api/health")
def health():
    return {"ok": True, "warm": STATE["warm"]}


@app.get("/api/overview")
def overview():
    return prep.overview()


@app.get("/api/samples")
def samples(n: int = 8, seed: int = 7):
    return prep.samples(max(1, min(n, 30)), seed)


@app.post("/api/preprocess")
def preprocess(r: PrepReq):
    return prep.preprocess(r.scaler, r.test_size, r.focus)


@app.get("/api/warehouse/schema")
def schema():
    return olap.schema()


@app.get("/api/olap/meta")
def olap_meta():
    return olap.meta()


@app.post("/api/olap/cube")
def olap_cube(r: CubeReq):
    return olap.cube(r.axes, r.measure, r.filters, r.credit_min, r.credit_max)


@app.post("/api/sql")
def sql(r: SqlReq):
    return olap.run_sql(r.query)


@app.post("/api/classify")
def classify(r: ClassReq):
    return mining.classify(r.model, r.params)


@app.get("/api/classify/compare")
def classify_compare():
    return mining.compare()


@app.post("/api/cluster")
def cluster(r: ClusterReq):
    return mining.cluster(r.algo, r.k, r.features, r.n_init, r.linkage, r.eps, r.min_samples, r.covariance)


@app.post("/api/cluster/elbow")
def cluster_elbow(r: ElbowReq):
    return mining.elbow(r.algo, r.features)


@app.post("/api/associate")
def associate(r: AssocReq):
    return mining.associate(r.algo, r.min_support, r.min_confidence, r.min_lift, r.bins, r.max_len, r.target)


@app.post("/api/associate/benchmark")
def associate_bench(r: AssocReq):
    return mining.assoc_benchmark(r.min_support, r.bins, r.max_len)


@app.get("/api/predict/schema")
def predict_schema():
    return mining.form_schema()


@app.post("/api/predict")
def predict(r: PredReq):
    return mining.predict(r.borrower, r.model, r.zones)


# ------------------------------------------------------------------ static dashboard
DIST = os.path.join(ROOT, "studio", "dist")
if os.path.isdir(DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST, "assets")), name="assets")

    @app.get("/{path:path}")
    def spa(path: str):
        f = os.path.join(DIST, path)
        if path and os.path.isfile(f):
            return FileResponse(f)
        return FileResponse(os.path.join(DIST, "index.html"))


if __name__ == "__main__":
    if "--snapshot" in sys.argv:
        import snapshot
        snapshot.build(os.path.join(ROOT, "studio", "public", "snapshot.json"))
        sys.exit(0)
    import uvicorn
    port = int(os.environ.get("PORT", "8000"))
    print(f"\n  Loan Default Studio  ->  http://localhost:{port}\n")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="warning")
