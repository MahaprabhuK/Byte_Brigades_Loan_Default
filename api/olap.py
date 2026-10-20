"""ROLAP engine over the SQLite star schema (data_warehouse/loan_dw.db)."""
import sqlite3
import time

from data import DB_PATH, clean

FROM = """FROM Fact_Loan_Performance f
JOIN Dim_Borrower b ON f.BorrowerID = b.BorrowerID
JOIN Dim_Loan_Purpose p ON f.PurposeID = p.PurposeID
JOIN Dim_Credit_Profile c ON f.CreditProfileID = c.CreditProfileID
JOIN Dim_Risk_Tier r ON f.RiskTierID = r.RiskTierID"""

# dimension -> (SQL expression, fixed level order or None, label, hierarchy)
DIMS = {
    "AgeBand": ("printf('%d-%d', (b.Age/5)*5, (b.Age/5)*5+4)", None, "Age (5-yr band)", "Age"),
    "AgeGroup": ("b.AgeGroup", ["18-24", "25-34", "35-49", "50-64", "65+"], "Age Group", "Age"),
    "CreditBand": ("printf('%d-%d', (f.CreditScore/50)*50, (f.CreditScore/50)*50+49)", None, "Credit Score (50-pt band)", "Credit"),
    "CreditScoreGroup": ("c.CreditScoreGroup", ["Poor (<580)", "Fair (580-669)", "Good (670-739)", "Very Good (740-799)", "Excellent (800+)"], "Credit Score Group", "Credit"),
    "CreditTier": ("CASE WHEN f.CreditScore < 580 THEN 'Subprime' WHEN f.CreditScore < 670 THEN 'Near-prime' ELSE 'Prime' END",
                   ["Subprime", "Near-prime", "Prime"], "Credit Tier", "Credit"),
    "IncomeBand": ("printf('%dk-%dk', (CAST(f.Income AS INT)/15000)*15, (CAST(f.Income AS INT)/15000)*15+15)", None, "Income (15k band)", "Income"),
    "IncomeLevel": ("CASE WHEN f.Income < 60000 THEN 'Low' WHEN f.Income < 105000 THEN 'Middle' ELSE 'High' END",
                    ["Low", "Middle", "High"], "Income Level", "Income"),
    "Education": ("b.Education", ["High School", "Bachelor's", "Master's", "PhD"], "Education", None),
    "EmploymentType": ("b.EmploymentType", ["Full-time", "Part-time", "Self-employed", "Unemployed"], "Employment Type", None),
    "MaritalStatus": ("b.MaritalStatus", ["Single", "Married", "Divorced"], "Marital Status", None),
    "HasDependents": ("b.HasDependents", ["No", "Yes"], "Has Dependents", None),
    "LoanPurpose": ("p.LoanPurpose", ["Auto", "Business", "Education", "Home", "Other"], "Loan Purpose", None),
    "HasCoSigner": ("c.HasCoSigner", ["No", "Yes"], "Has Co-Signer", None),
    "HasMortgage": ("c.HasMortgage", ["No", "Yes"], "Has Mortgage", None),
    "LoanTerm": ("CAST(f.LoanTerm AS TEXT)", ["12", "24", "36", "48", "60"], "Loan Term (months)", None),
    "RiskCategory": ("r.RiskCategory", ["Low Risk", "Moderate Risk", "High Risk", "Critical Risk"], "Risk Tier", None),
}

HIERARCHIES = {
    "Age": ["AgeBand", "AgeGroup"],
    "Credit": ["CreditBand", "CreditScoreGroup", "CreditTier"],
    "Income": ["IncomeBand", "IncomeLevel"],
}

MEASURES = {
    "default_rate": ("ROUND(AVG(f.DefaultStatus) * 100, 2)", "Default Rate (%)"),
    "count": ("COUNT(*)", "Loan Count"),
    "defaults": ("SUM(f.DefaultStatus)", "Default Count"),
    "avg_loan": ("ROUND(AVG(f.LoanAmount), 0)", "Avg Loan Amount"),
    "total_loan": ("ROUND(SUM(f.LoanAmount) / 1e6, 2)", "Total Loan Value ($M)"),
    "avg_income": ("ROUND(AVG(f.Income), 0)", "Avg Income"),
    "avg_interest": ("ROUND(AVG(f.InterestRate), 2)", "Avg Interest Rate (%)"),
    "avg_dti": ("ROUND(AVG(f.DTIRatio), 3)", "Avg DTI Ratio"),
    "avg_credit": ("ROUND(AVG(f.CreditScore), 1)", "Avg Credit Score"),
}


def _conn(ro=True):
    if ro:
        return sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True, check_same_thread=False)
    return sqlite3.connect(DB_PATH, check_same_thread=False)


def meta():
    return {
        "dims": {k: {"label": v[2], "levels": v[1], "hierarchy": v[3]} for k, v in DIMS.items()},
        "hierarchies": HIERARCHIES,
        "measures": {k: v[1] for k, v in MEASURES.items()},
    }


def _q(v):
    return "'" + str(v).replace("'", "''") + "'"


def cube(axes, measure="default_rate", filters=None, credit_min=None, credit_max=None):
    """axes: list of 3 dim names or 'ALL'. filters: {dim: [values]}"""
    filters = filters or {}
    axes = list(axes)[:3] + ["ALL"] * (3 - len(axes))
    exprs = []
    for a in axes:
        if a == "ALL" or a not in DIMS:
            exprs.append("'All'")
        else:
            exprs.append(DIMS[a][0])
    m_expr, m_label = MEASURES.get(measure, MEASURES["default_rate"])

    where, params, shown = [], [], []
    for d, vals in filters.items():
        if d in DIMS and vals:
            ph = ",".join("?" * len(vals))
            where.append(f"{DIMS[d][0]} IN ({ph})")
            params += [str(v) for v in vals]
            shown.append(f"{DIMS[d][0]} IN ({', '.join(_q(v) for v in vals)})")
    if credit_min is not None:
        where.append("f.CreditScore >= ?"); params.append(int(credit_min)); shown.append(f"f.CreditScore >= {int(credit_min)}")
    if credit_max is not None:
        where.append("f.CreditScore <= ?"); params.append(int(credit_max)); shown.append(f"f.CreditScore <= {int(credit_max)}")

    w = ("\nWHERE " + "\n  AND ".join(where)) if where else ""
    w_show = ("\nWHERE " + "\n  AND ".join(shown)) if shown else ""
    sel = f"SELECT {exprs[0]} AS x, {exprs[1]} AS y, {exprs[2]} AS z,\n       COUNT(*) AS n, {m_expr} AS v\n{FROM}"
    grp = "\nGROUP BY x, y, z"
    sql = sel + w + grp
    sql_show = sel + w_show + grp + ";"

    t = time.time()
    con = _conn()
    rows = con.execute(sql, params).fetchall()
    con.close()
    ms = (time.time() - t) * 1000

    def levels(i, a):
        present = sorted({r[i] for r in rows}, key=_natural)
        if a in DIMS and DIMS[a][1]:
            order = [l for l in DIMS[a][1] if l in present]
            return order + [l for l in present if l not in order]
        return present

    lv = [levels(i, a) for i, a in enumerate(axes)]
    cells = [{"x": r[0], "y": r[1], "z": r[2], "n": r[3], "v": r[4]} for r in rows]
    vals = [c["v"] for c in cells if c["v"] is not None]
    total = sum(c["n"] for c in cells)
    return clean({
        "axes": axes,
        "axis_labels": [DIMS[a][2] if a in DIMS else "All" for a in axes],
        "levels": lv,
        "measure": measure,
        "measure_label": m_label,
        "cells": cells,
        "min": min(vals) if vals else 0,
        "max": max(vals) if vals else 0,
        "rows_covered": total,
        "sql": sql_show,
        "ms": round(ms, 1),
    })


def _natural(s):
    import re
    s = str(s)
    m = re.match(r"^(\d+)", s)
    return (0, int(m.group(1)), s) if m else (1, 0, s)


def schema():
    con = _conn()
    tables = ["Fact_Loan_Performance", "Dim_Borrower", "Dim_Loan_Purpose", "Dim_Credit_Profile", "Dim_Risk_Tier"]
    out = []
    for t in tables:
        cols = con.execute(f"PRAGMA table_info({t})").fetchall()
        fks = con.execute(f"PRAGMA foreign_key_list({t})").fetchall()
        fkcols = {fk[3]: fk[2] for fk in fks}
        cnt = con.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
        cur = con.execute(f"SELECT * FROM {t} LIMIT 4")
        names = [d[0] for d in cur.description]
        sample = [dict(zip(names, r)) for r in cur.fetchall()]
        out.append({
            "name": t,
            "kind": "fact" if t.startswith("Fact") else "dimension",
            "rows": cnt,
            "columns": [{"name": c[1], "type": c[2], "pk": bool(c[5]), "fk": fkcols.get(c[1])} for c in cols],
            "sample": sample,
        })
    con.close()
    return clean({"tables": out})


ALLOWED = ("select", "with", "pragma")


def run_sql(query: str, limit: int = 500):
    q = (query or "").strip().rstrip(";").strip()
    if not q:
        return {"error": "Empty query"}
    if not q.lower().startswith(ALLOWED):
        return {"error": "Read-only console: only SELECT / WITH / PRAGMA statements are allowed."}
    if ";" in q:
        return {"error": "One statement at a time, please."}
    con = _conn(ro=True)
    start = time.time()
    con.set_progress_handler(lambda: 1 if time.time() - start > 5 else 0, 10000)
    try:
        cur = con.execute(q)
        cols = [d[0] for d in cur.description] if cur.description else []
        rows = cur.fetchmany(limit)
        ms = (time.time() - start) * 1000
        return clean({"columns": cols, "rows": [list(r) for r in rows], "ms": round(ms, 1),
                      "truncated": len(rows) == limit})
    except Exception as e:  # noqa
        return {"error": str(e)}
    finally:
        con.close()
