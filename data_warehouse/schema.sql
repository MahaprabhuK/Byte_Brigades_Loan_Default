-- Star Schema DDL for Loan Default Data Warehouse (SQLite)
-- Team: Byte Brigades

DROP TABLE IF EXISTS Fact_Loan_Performance;
DROP TABLE IF EXISTS Dim_Borrower;
DROP TABLE IF EXISTS Dim_Loan_Purpose;
DROP TABLE IF EXISTS Dim_Credit_Profile;
DROP TABLE IF EXISTS Dim_Risk_Tier;

-- Dimension 1: Borrower Information
CREATE TABLE Dim_Borrower (
    BorrowerID INTEGER PRIMARY KEY AUTOINCREMENT,
    Age INTEGER,
    AgeGroup TEXT,
    Education TEXT,
    EmploymentType TEXT,
    MaritalStatus TEXT,
    HasDependents TEXT
);

-- Dimension 2: Loan Purpose Details
CREATE TABLE Dim_Loan_Purpose (
    PurposeID INTEGER PRIMARY KEY AUTOINCREMENT,
    LoanPurpose TEXT UNIQUE,
    CategoryDescription TEXT
);

-- Dimension 3: Credit Profile Information
CREATE TABLE Dim_Credit_Profile (
    CreditProfileID INTEGER PRIMARY KEY AUTOINCREMENT,
    CreditScoreGroup TEXT,
    NumCreditLines INTEGER,
    HasMortgage TEXT,
    HasCoSigner TEXT
);

-- Dimension 4: Risk Tier Classification
CREATE TABLE Dim_Risk_Tier (
    RiskTierID INTEGER PRIMARY KEY AUTOINCREMENT,
    RiskCategory TEXT UNIQUE,
    RiskRange TEXT
);

-- Fact Table: Loan Performance & Default Outcomes
CREATE TABLE Fact_Loan_Performance (
    FactID INTEGER PRIMARY KEY AUTOINCREMENT,
    LoanID TEXT UNIQUE,
    BorrowerID INTEGER,
    PurposeID INTEGER,
    CreditProfileID INTEGER,
    RiskTierID INTEGER,
    
    -- Numerical Measures
    LoanAmount REAL,
    Income REAL,
    CreditScore INTEGER,
    InterestRate REAL,
    LoanTerm INTEGER,
    DTIRatio REAL,
    MonthsEmployed INTEGER,
    
    -- Target / Performance Measures
    DefaultStatus INTEGER, -- 0 = No Default, 1 = Default
    DefaultRiskScore REAL,
    
    FOREIGN KEY (BorrowerID) REFERENCES Dim_Borrower(BorrowerID),
    FOREIGN KEY (PurposeID) REFERENCES Dim_Loan_Purpose(PurposeID),
    FOREIGN KEY (CreditProfileID) REFERENCES Dim_Credit_Profile(CreditProfileID),
    FOREIGN KEY (RiskTierID) REFERENCES Dim_Risk_Tier(RiskTierID)
);
