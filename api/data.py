"""
Shared data layer for the Byte Brigades dashboard API.
Loads the raw loan CSV once, keeps the same stratified 80/20 split used in
preprocessing/preprocess.py (random_state=42), and builds preprocessors on demand.
"""
import os
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
RAW_CANDIDATES = [
    os.path.join(ROOT, "data", "raw", "Loan_default.csv"),
    os.path.join(ROOT, "data", "raw", "loan_default.csv"),
]
DB_PATH = os.path.join(ROOT, "data_warehouse", "loan_dw.db")
MODEL_DIR = os.path.join(ROOT, "prediction", "saved_models")

NUM_COLS = ["Age", "Income", "LoanAmount", "CreditScore", "MonthsEmployed",
            "NumCreditLines", "InterestRate", "LoanTerm", "DTIRatio"]
CAT_COLS = ["Education", "EmploymentType", "MaritalStatus", "HasMortgage",
            "HasDependents", "LoanPurpose", "HasCoSigner"]
RANDOM_STATE = 42


def _load_raw() -> pd.DataFrame:
    for p in RAW_CANDIDATES:
        if os.path.exists(p):
            return pd.read_csv(p)
    # fall back to the project's own generator so the dashboard never breaks
    import sys
    sys.path.append(os.path.join(ROOT, "preprocessing"))
    from loader import get_loan_data  # type: ignore
    return get_loan_data()


DF = _load_raw()
X_ALL = DF.drop(columns=["LoanID", "Default"])
Y_ALL = DF["Default"].astype(int)


def split(test_size: float = 0.2):
    return train_test_split(X_ALL, Y_ALL, test_size=test_size,
                            random_state=RANDOM_STATE, stratify=Y_ALL)


X_TRAIN, X_TEST, Y_TRAIN, Y_TEST = split(0.2)

SCALERS = {"standard": StandardScaler, "minmax": MinMaxScaler, "robust": RobustScaler}


def make_preprocessor(scaler: str = "standard") -> ColumnTransformer:
    sc = SCALERS.get(scaler, StandardScaler)()
    return ColumnTransformer([
        ("num", sc, NUM_COLS),
        ("cat", OneHotEncoder(drop="first", sparse_output=False, handle_unknown="ignore"), CAT_COLS),
    ])


def feature_names(pre: ColumnTransformer):
    cat = pre.named_transformers_["cat"].get_feature_names_out(CAT_COLS).tolist()
    return NUM_COLS + cat


# Default preprocessor (identical to the project's preprocess.py)
PRE = make_preprocessor("standard").fit(X_TRAIN)
FEATURES = feature_names(PRE)
XT_TRAIN = PRE.transform(X_TRAIN)
XT_TEST = PRE.transform(X_TEST)
YT_TRAIN = Y_TRAIN.values
YT_TEST = Y_TEST.values

CATEGORY_LEVELS = {c: sorted(DF[c].unique().tolist()) for c in CAT_COLS}
NUM_RANGES = {c: [float(DF[c].min()), float(DF[c].max()), float(DF[c].median())] for c in NUM_COLS}


def clean(v):
    """Make numpy / pandas values JSON-safe."""
    if isinstance(v, (np.integer,)):
        return int(v)
    if isinstance(v, (np.floating,)):
        f = float(v)
        return None if (np.isnan(f) or np.isinf(f)) else f
    if isinstance(v, np.ndarray):
        return [clean(x) for x in v.tolist()]
    if isinstance(v, dict):
        return {str(k): clean(x) for k, x in v.items()}
    if isinstance(v, (list, tuple)):
        return [clean(x) for x in v]
    if isinstance(v, float) and (np.isnan(v) or np.isinf(v)):
        return None
    return v
