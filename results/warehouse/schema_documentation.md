# Star Schema Data Warehouse Documentation

**Database System**: SQLite  
**Database File**: `loan_dw.db`  

## Table Summaries
- **Fact Table**: `Fact_Loan_Performance` (50000 rows)
- **Dimension 1**: `Dim_Borrower` (50000 rows)
- **Dimension 2**: `Dim_Loan_Purpose` (5 rows)
- **Dimension 3**: `Dim_Credit_Profile` (50000 rows)
- **Dimension 4**: `Dim_Risk_Tier` (4 rows)

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
