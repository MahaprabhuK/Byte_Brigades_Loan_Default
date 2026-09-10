"""
Byte Brigades - Loan Default Data Warehouse Builder (SQLite)
------------------------------------------------------------
Executes schema DDL, builds Star Schema tables, populates Dim and Fact tables
from raw/processed loan data, and verifies integrity.
"""

import os
import sqlite3
import pandas as pd
import numpy as np

import sys
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "preprocessing"))
from loader import get_loan_data

DW_DIR = os.path.dirname(__file__)
DB_PATH = os.path.join(DW_DIR, "loan_dw.db")
SQL_PATH = os.path.join(DW_DIR, "schema.sql")
RESULTS_DIR = os.path.join(os.path.dirname(__file__), "..", "results", "warehouse")

def get_age_group(age):
    if age < 25:
        return "18-24"
    elif age < 35:
        return "25-34"
    elif age < 50:
        return "35-49"
    elif age < 65:
        return "50-64"
    else:
        return "65+"

def get_credit_group(score):
    if score < 580:
        return "Poor (<580)"
    elif score < 670:
        return "Fair (580-669)"
    elif score < 740:
        return "Good (670-739)"
    elif score < 800:
        return "Very Good (740-799)"
    else:
        return "Excellent (800+)"

def get_risk_tier(dti, credit_score, default_val):
    if default_val == 1:
        return "Critical Risk"
    elif dti > 0.5 or credit_score < 580:
        return "High Risk"
    elif dti > 0.3 or credit_score < 670:
        return "Moderate Risk"
    else:
        return "Low Risk"

def build_data_warehouse():
    os.makedirs(RESULTS_DIR, exist_ok=True)
    print(f"[DATA WAREHOUSE] Initializing SQLite database at: {DB_PATH}")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Run Schema DDL
    with open(SQL_PATH, "r") as f:
        sql_script = f.read()
    cursor.executescript(sql_script)
    conn.commit()
    print("[DATA WAREHOUSE] Star Schema tables created successfully.")
    
    # Load Source Data
    df = get_loan_data()
    print(f"[DATA WAREHOUSE] Populating dimensions & fact table from {len(df)} records...")
    
    # 1. Populate Dim_Loan_Purpose
    loan_purposes = df["LoanPurpose"].unique()
    purpose_map = {}
    for purp in loan_purposes:
        desc = f"Loans allocated for {purp} related expenses"
        cursor.execute("INSERT INTO Dim_Loan_Purpose (LoanPurpose, CategoryDescription) VALUES (?, ?)", (purp, desc))
        purpose_map[purp] = cursor.lastrowid
    conn.commit()
    
    # 2. Populate Dim_Risk_Tier
    risk_tiers = [
        ("Low Risk", "DTI <= 0.3 & Credit Score >= 670"),
        ("Moderate Risk", "DTI <= 0.5 & Credit Score >= 580"),
        ("High Risk", "DTI > 0.5 or Credit Score < 580"),
        ("Critical Risk", "Historical Default Record")
    ]
    risk_map = {}
    for tier, r_range in risk_tiers:
        cursor.execute("INSERT INTO Dim_Risk_Tier (RiskCategory, RiskRange) VALUES (?, ?)", (tier, r_range))
        risk_map[tier] = cursor.lastrowid
    conn.commit()
    
    # 3. Populate Dim_Borrower & Dim_Credit_Profile & Fact_Loan_Performance in batches
    fact_rows = []
    borrower_rows = []
    credit_rows = []
    
    for idx, row in df.iterrows():
        age_grp = get_age_group(row["Age"])
        cred_grp = get_credit_group(row["CreditScore"])
        risk_cat = get_risk_tier(row["DTIRatio"], row["CreditScore"], row["Default"])
        
        # Borrower Dim Record
        cursor.execute("""
            INSERT INTO Dim_Borrower (Age, AgeGroup, Education, EmploymentType, MaritalStatus, HasDependents)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (row["Age"], age_grp, row["Education"], row["EmploymentType"], row["MaritalStatus"], row["HasDependents"]))
        borrower_id = cursor.lastrowid
        
        # Credit Profile Dim Record
        cursor.execute("""
            INSERT INTO Dim_Credit_Profile (CreditScoreGroup, NumCreditLines, HasMortgage, HasCoSigner)
            VALUES (?, ?, ?, ?)
        """, (cred_grp, row["NumCreditLines"], row["HasMortgage"], row["HasCoSigner"]))
        credit_id = cursor.lastrowid
        
        purpose_id = purpose_map[row["LoanPurpose"]]
        risk_id = risk_map[risk_cat]
        
        # Compute baseline default risk score for DW metric
        risk_score = round(float(row["DTIRatio"] * 40 + (850 - row["CreditScore"]) / 10 + row["InterestRate"] * 2), 2)
        
        fact_rows.append((
            row["LoanID"], borrower_id, purpose_id, credit_id, risk_id,
            float(row["LoanAmount"]), float(row["Income"]), int(row["CreditScore"]),
            float(row["InterestRate"]), int(row["LoanTerm"]), float(row["DTIRatio"]),
            int(row["MonthsEmployed"]), int(row["Default"]), risk_score
        ))
        
    cursor.executemany("""
        INSERT INTO Fact_Loan_Performance (
            LoanID, BorrowerID, PurposeID, CreditProfileID, RiskTierID,
            LoanAmount, Income, CreditScore, InterestRate, LoanTerm, DTIRatio,
            MonthsEmployed, DefaultStatus, DefaultRiskScore
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, fact_rows)
    
    conn.commit()
    print("[DATA WAREHOUSE] Population completed.")
    
    # Table record counts summary
    tables = ["Dim_Borrower", "Dim_Loan_Purpose", "Dim_Credit_Profile", "Dim_Risk_Tier", "Fact_Loan_Performance"]
    counts = {}
    for tbl in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {tbl}")
        counts[tbl] = cursor.fetchone()[0]
        print(f"   -> Table {tbl}: {counts[tbl]} rows")
        
    # Generate Schema Documentation
    doc_md = f"""# Star Schema Data Warehouse Documentation

**Database System**: SQLite  
**Database File**: `loan_dw.db`  

## Table Summaries
- **Fact Table**: `Fact_Loan_Performance` ({counts['Fact_Loan_Performance']} rows)
- **Dimension 1**: `Dim_Borrower` ({counts['Dim_Borrower']} rows)
- **Dimension 2**: `Dim_Loan_Purpose` ({counts['Dim_Loan_Purpose']} rows)
- **Dimension 3**: `Dim_Credit_Profile` ({counts['Dim_Credit_Profile']} rows)
- **Dimension 4**: `Dim_Risk_Tier` ({counts['Dim_Risk_Tier']} rows)

## Star Schema Architecture
```
        +-------------------+
        |   Dim_Borrower    |
        +-------------------+
        | BorrowerID (PK)   |
        | Age, AgeGroup     |
        | Education         |
        | EmploymentType    |
        | MaritalStatus     |
        +---------+---------+
                  |
                  | 1:N
                  v
+-----------------+------------------+       +---------------------+
|      Fact_Loan_Performance         | ----> |  Dim_Loan_Purpose   |
+------------------------------------+ 1:N   +---------------------+
| FactID (PK)                        |       | PurposeID (PK)      |
| BorrowerID (FK)                    |       | LoanPurpose         |
| PurposeID (FK)                     |       +---------------------+
| CreditProfileID (FK)               |
| RiskTierID (FK)                    |       +---------------------+
| LoanAmount, Income, CreditScore    | ----> | Dim_Credit_Profile  |
| InterestRate, LoanTerm, DTIRatio   | 1:N   +---------------------+
| DefaultStatus, DefaultRiskScore    |       | CreditProfileID (PK)|
+-----------------+------------------+       | CreditScoreGroup    |
                  |                          +---------------------+
                  | 1:N
                  v
        +-------------------+
        |   Dim_Risk_Tier   |
        +-------------------+
        | RiskTierID (PK)   |
        | RiskCategory      |
        +-------------------+
```
"""
    with open(os.path.join(RESULTS_DIR, "schema_documentation.md"), "w") as f:
        f.write(doc_md)
        
    conn.close()
    return counts

if __name__ == "__main__":
    build_data_warehouse()
