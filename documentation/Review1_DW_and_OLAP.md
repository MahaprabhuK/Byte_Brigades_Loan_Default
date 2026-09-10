# Academic Review 1: Dataset, Data Warehouse & OLAP Operations

**Team**: Byte Brigades  
**Domain**: Loan Default Risk Analysis & Data Warehousing  

---

## 1. Dataset Overview & Preprocessing Summary
- **Source**: Kaggle Loan Default Prediction Dataset (`nikhil1e9/loan-default`).
- **Dimensions**: 50,000 Records | 18 Features (9 Numerical, 7 Categorical, 1 Identifier, 1 Binary Target `Default`).
- **Target Class**: `Default` (0 = No Default, 1 = Default). Imbalanced distribution (~11.7% Default).
- **Inspection & Data Leakage Prevention**:
  - Evaluated zero missing values and zero duplicate rows.
  - Stratified 80/20 train/test split before fitting `StandardScaler` on numerical features and `OneHotEncoder` on categorical features.

---

## 2. Data Warehouse Design (Star Schema)
To optimize multidimensional analytics on loan performance metrics, a **Star Schema Data Warehouse** was designed and implemented on **SQLite** (`data_warehouse/loan_dw.db`).

### Schema Architecture
- **Fact Table**: `Fact_Loan_Performance`
  - Measures: `LoanAmount`, `Income`, `CreditScore`, `InterestRate`, `LoanTerm`, `DTIRatio`, `MonthsEmployed`, `DefaultStatus`, `DefaultRiskScore`
  - Foreign Keys: `BorrowerID`, `PurposeID`, `CreditProfileID`, `RiskTierID`
- **Dimension Tables**:
  - `Dim_Borrower`: `Age`, `AgeGroup`, `Education`, `EmploymentType`, `MaritalStatus`, `HasDependents`
  - `Dim_Loan_Purpose`: `LoanPurpose`, `CategoryDescription`
  - `Dim_Credit_Profile`: `CreditScoreGroup`, `NumCreditLines`, `HasMortgage`, `HasCoSigner`
  - `Dim_Risk_Tier`: `RiskCategory`, `RiskRange`

---

## 3. OLAP Operations Implementation & Results

### A. Roll-up
- **Concept**: Aggregating from low-level borrower detail to high-level dimension hierarchy (`AgeGroup` & `Education`).
- **SQL Execution**:
  ```sql
  SELECT b.AgeGroup, b.Education, COUNT(f.FactID) AS TotalLoans, 
         ROUND(AVG(f.DefaultStatus)*100, 2) AS DefaultRate_Pct
  FROM Fact_Loan_Performance f
  JOIN Dim_Borrower b ON f.BorrowerID = b.BorrowerID
  GROUP BY b.AgeGroup, b.Education;
  ```
- **Key Finding**: Borrowers in the 18-24 age group holding High School education exhibit the highest aggregate default rate.

### B. Drill-down
- **Concept**: Navigating from summary employment levels down into specific loan purpose categories.
- **Key Finding**: Unemployed borrowers seeking 'Business' or 'Other' loans represent elevated portfolio risk.

### C. Slice
- **Concept**: Filtering the warehouse cube across a single dimension predicate (`LoanPurpose = 'Home'`).

### D. Dice
- **Concept**: Multi-dimensional filtering across multiple condition predicates simultaneously (`Education IN (Bachelor's, Master's)`, `Employment = Full-time`, `CreditScore >= 650`).

### E. Pivot
- **Concept**: Cross-tabulating `Education` (rows) against `EmploymentType` (columns) showing matrix of default rates %.

---

## Viva Verification Checklist (Review 1)
1. Show SQLite DB connection (`data_warehouse/loan_dw.db`).
2. Show Star Schema DDL (`data_warehouse/schema.sql`).
3. Demonstrate SQL execution of all 5 OLAP operations (`olap/olap_queries.py`).
