"""
Assembles the Hugging Face Space bundle in ./space_build:
Dockerfile + requirements + api/ + the data, warehouse and model files + studio/dist.
Used by .github/workflows/deploy-space.yml; also handy for a local check:

    python deploy/build_space.py
    cd space_build && python api/main.py      # http://localhost:7860
"""
import os
import shutil

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(ROOT, "space_build")

COPY = [
    "api",
    "studio/dist",
    "data/raw/Loan_default.csv",
    "data_warehouse/loan_dw.db",
    "prediction/saved_models",
    "preprocessing/loader.py",
]

shutil.rmtree(OUT, ignore_errors=True)
os.makedirs(OUT)
for f in os.listdir(os.path.join(ROOT, "deploy", "space")):
    shutil.copy(os.path.join(ROOT, "deploy", "space", f), OUT)
for rel in COPY:
    src, dst = os.path.join(ROOT, rel), os.path.join(OUT, rel)
    if os.path.isdir(src):
        shutil.copytree(src, dst, ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
    elif os.path.exists(src):
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy(src, dst)
    else:
        print("missing (skipped):", rel)
print("Space bundle ready in", OUT)
