"""
Byte Brigades - OLAP Engine for Loan Default Analysis
------------------------------------------------------
Executes Roll-up, Drill-down, Slice, Dice, and Pivot operations
on the SQLite Star Schema Data Warehouse and exports results.
"""

import os
import sqlite3
import json
import pandas as pd

DW_PATH = os.path.join(os.path.dirname(__file__), "..", "data_warehouse", "loan_dw.db")
RESULTS_DIR = os.path.join(os.path.dirname(__file__), "..", "results", "olap")

def run_olap_operations():
    os.makedirs(RESULTS_DIR, exist_ok=True)
    print(f"[OLAP ENGINE] Connecting to Data Warehouse at {DW_PATH}...")
    conn = sqlite3.connect(DW_PATH)
    
    olap_results = {}
    
    # -------------------------------------------------------------
    # 1. ROLL-UP: Aggregate from Borrower Age/Education level
    # -------------------------------------------------------------
    rollup_sql = """
        SELECT 
            b.AgeGroup,
            b.Education,
            COUNT(f.FactID) AS TotalLoans,
            SUM(f.DefaultStatus) AS DefaultCount,
            ROUND(AVG(f.DefaultStatus) * 100, 2) AS DefaultRate_Pct,
            ROUND(AVG(f.LoanAmount), 2) AS AvgLoanAmount,
            ROUND(AVG(f.Income), 2) AS AvgIncome,
            ROUND(AVG(f.CreditScore), 2) AS AvgCreditScore
        FROM Fact_Loan_Performance f
        JOIN Dim_Borrower b ON f.BorrowerID = b.BorrowerID
        GROUP BY b.AgeGroup, b.Education
        ORDER BY b.AgeGroup, b.Education;
    """
    df_rollup = pd.read_sql_query(rollup_sql, conn)
    olap_results["rollup"] = df_rollup.to_dict(orient="records")
    
    # -------------------------------------------------------------
    # 2. DRILL-DOWN: Overall -> Employment Type -> Loan Purpose
    # -------------------------------------------------------------
    drilldown_sql = """
        SELECT 
            b.EmploymentType,
            p.LoanPurpose,
            COUNT(f.FactID) AS TotalLoans,
            SUM(f.DefaultStatus) AS DefaultCount,
            ROUND(AVG(f.DefaultStatus) * 100, 2) AS DefaultRate_Pct,
            ROUND(AVG(f.DTIRatio), 3) AS AvgDTI,
            ROUND(AVG(f.InterestRate), 2) AS AvgInterestRate
        FROM Fact_Loan_Performance f
        JOIN Dim_Borrower b ON f.BorrowerID = b.BorrowerID
        JOIN Dim_Loan_Purpose p ON f.PurposeID = p.PurposeID
        GROUP BY b.EmploymentType, p.LoanPurpose
        ORDER BY b.EmploymentType, DefaultRate_Pct DESC;
    """
    df_drilldown = pd.read_sql_query(drilldown_sql, conn)
    olap_results["drilldown"] = df_drilldown.to_dict(orient="records")
    
    # -------------------------------------------------------------
    # 3. SLICE: Slice by single dimension (LoanPurpose = 'Home')
    # -------------------------------------------------------------
    slice_sql = """
        SELECT 
            b.AgeGroup,
            c.CreditScoreGroup,
            COUNT(f.FactID) AS TotalLoans,
            SUM(f.DefaultStatus) AS DefaultCount,
            ROUND(AVG(f.DefaultStatus) * 100, 2) AS DefaultRate_Pct,
            ROUND(AVG(f.LoanAmount), 2) AS AvgLoanAmount
        FROM Fact_Loan_Performance f
        JOIN Dim_Borrower b ON f.BorrowerID = b.BorrowerID
        JOIN Dim_Credit_Profile c ON f.CreditProfileID = c.CreditProfileID
        JOIN Dim_Loan_Purpose p ON f.PurposeID = p.PurposeID
        WHERE p.LoanPurpose = 'Home'
        GROUP BY b.AgeGroup, c.CreditScoreGroup
        ORDER BY b.AgeGroup, c.CreditScoreGroup;
    """
    df_slice = pd.read_sql_query(slice_sql, conn)
    olap_results["slice"] = df_slice.to_dict(orient="records")
    
    # -------------------------------------------------------------
    # 4. DICE: Multi-dimensional filtering simultaneously
    # (Education = "Bachelor's" OR "Master's") AND (EmploymentType = 'Full-time') AND (CreditScore >= 650)
    # -------------------------------------------------------------
    dice_sql = """
        SELECT 
            b.AgeGroup,
            b.Education,
            p.LoanPurpose,
            r.RiskCategory,
            COUNT(f.FactID) AS TotalLoans,
            SUM(f.DefaultStatus) AS DefaultCount,
            ROUND(AVG(f.DefaultStatus) * 100, 2) AS DefaultRate_Pct
        FROM Fact_Loan_Performance f
        JOIN Dim_Borrower b ON f.BorrowerID = b.BorrowerID
        JOIN Dim_Loan_Purpose p ON f.PurposeID = p.PurposeID
        JOIN Dim_Risk_Tier r ON f.RiskTierID = r.RiskTierID
        WHERE b.Education IN ("Bachelor's", "Master's")
          AND b.EmploymentType = 'Full-time'
          AND f.CreditScore >= 650
        GROUP BY b.AgeGroup, b.Education, p.LoanPurpose, r.RiskCategory
        ORDER BY DefaultRate_Pct DESC;
    """
    df_dice = pd.read_sql_query(dice_sql, conn)
    olap_results["dice"] = df_dice.to_dict(orient="records")
    
    # -------------------------------------------------------------
    # 5. PIVOT: Education (rows) vs EmploymentType (cols) Default Rate %
    # -------------------------------------------------------------
    pivot_sql = """
        SELECT 
            b.Education,
            b.EmploymentType,
            ROUND(AVG(f.DefaultStatus) * 100, 2) AS DefaultRate_Pct
        FROM Fact_Loan_Performance f
        JOIN Dim_Borrower b ON f.BorrowerID = b.BorrowerID
        GROUP BY b.Education, b.EmploymentType;
    """
    df_pivot_raw = pd.read_sql_query(pivot_sql, conn)
    df_pivot = df_pivot_raw.pivot(index="Education", columns="EmploymentType", values="DefaultRate_Pct")
    olap_results["pivot"] = df_pivot.to_dict()
    
    # Save Results to JSON & Markdown
    with open(os.path.join(RESULTS_DIR, "olap_results.json"), "w") as f:
        json.dump(olap_results, f, indent=4)
        
    md_output = f"""# OLAP Operations Execution Summary - Byte Brigades

## 1. Roll-up Operation (Borrower Level -> Age Group & Education Aggregation)
{df_rollup.to_markdown(index=False)}

## 2. Drill-down Operation (Employment Type -> Loan Purpose Detailed View)
{df_drilldown.head(15).to_markdown(index=False)}

## 3. Slice Operation (Slicing DW on `LoanPurpose = 'Home'`)
{df_slice.to_markdown(index=False)}

## 4. Dice Operation (Slicing on Education IN (Bachelor's, Master's) & Employment = Full-time & CreditScore >= 650)
{df_dice.head(15).to_markdown(index=False)}

## 5. Pivot Operation (Cross-Tabulation: Education vs Employment Type Default Rate %)
{df_pivot.to_markdown()}
"""
    with open(os.path.join(RESULTS_DIR, "olap_report.md"), "w") as f:
        f.write(md_output)
        
    conn.close()
    print("[OLAP ENGINE] All 5 OLAP operations executed successfully. Results exported to results/olap/")
    return olap_results

if __name__ == "__main__":
    run_olap_operations()
