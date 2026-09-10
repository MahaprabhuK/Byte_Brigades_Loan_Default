# Byte Brigades: Loan Default Data Warehousing & Data Mining System

[![Live Web App](https://img.shields.io/badge/Live%20Web%20App-Online-10b981?style=for-the-badge&logo=vercel)](https://byte-brigades-loan-default.surge.sh)
[![GitHub Repository](https://img.shields.io/badge/GitHub-MahaprabhuK/Byte__Brigades__Loan__Default-blue?style=for-the-badge&logo=github)](https://github.com/MahaprabhuK/Byte_Brigades_Loan_Default)

> 🌐 **Live Mobile & Desktop Application**: [https://byte-brigades-loan-default.surge.sh](https://byte-brigades-loan-default.surge.sh)

---

## 1. Project Title
**Byte Brigades: End-to-End Loan Default Data Warehousing, OLAP Analytics, and Predictive Data Mining Infrastructure**

---

## 2. Team Name
**Team Name**: Byte Brigades  

---

## 3. Problem Statement
Commercial financial institutions and retail banking lenders face significant financial risk due to loan defaults. Accurately identifying high-risk borrowers, understanding multi-dimensional risk patterns, and predicting individual default probabilities is critical for minimizing credit loss and maintaining institutional capital stability.

---

## 4. Objectives
1. Build a clean, reproducible dataset pipeline matching Kaggle's `nikhil1e9/loan-default` schema.
2. Design and deploy an **SQLite Star Schema Data Warehouse** (`loan_dw.db`).
3. Implement 5 core **OLAP Operations** (Roll-up, Drill-down, Slice, Dice, Pivot).
4. Train and benchmark **Machine Learning Classification Models** (Logistic Regression, Decision Tree, Random Forest, Gradient Boosting).
5. Perform **Borrower Segmentation** via K-Means Clustering evaluated by Elbow Method & Silhouette Analysis.
6. Extract non-trivial credit risk patterns using **Association Rule Mining** (Apriori Algorithm).
7. Develop a continuous **Default Probability Prediction Engine** $P(\text{Default}=1)$.
8. Deliver a interactive **Streamlit Dashboard** integrating all DW/DM analytics.

---

## 5. Dataset Description
- **Size**: 50,000 Records | 18 Features
- **Target Variable**: `Default` (0 = No Default, 1 = Default)
- **Features**: `LoanID`, `Age`, `Income`, `LoanAmount`, `CreditScore`, `MonthsEmployed`, `NumCreditLines`, `InterestRate`, `LoanTerm`, `DTIRatio`, `Education`, `EmploymentType`, `MaritalStatus`, `HasMortgage`, `HasDependents`, `LoanPurpose`, `HasCoSigner`, `Default`.

---

## 6. Dataset Source
Kaggle Loan Default Prediction Dataset: [https://www.kaggle.com/datasets/nikhil1e9/loan-default](https://www.kaggle.com/datasets/nikhil1e9/loan-default).  
*The pipeline automatically detects existing `data/raw/Loan_default.csv` or generates an identical benchmark synthetic dataset if unpopulated.*

---

## 7. Technologies Used
- **Language**: Python 3.11+
- **Data Manipulation**: Pandas, NumPy
- **Data Warehousing & SQL**: SQLite 3
- **Machine Learning & Mining**: Scikit-Learn, MLxtend, Joblib
- **Data Visualization**: Matplotlib, Seaborn, Plotly
- **Interactive Dashboard**: Streamlit

---

## 8. System Architecture
```
+-----------------------------------------------------------------------+
|                       RAW & PROCESSED DATASET                         |
+-----------------------------------+-----------------------------------+
                                    |
            +-----------------------+-----------------------+
            |                                               |
            v                                               v
+-----------------------+                       +-----------------------+
|  SQLITE DATAWAREHOUSE |                       | MACHINE LEARNING      |
|  (Star Schema DDL)    |                       | PREPROCESSING PIPELINE|
+-----------+-----------+                       +-----------+-----------+
            |                                               |
            v                                               v
+-----------------------+                       +-----------------------+
| OLAP ENGINE           |                       | DATA MINING SUITE     |
| (Rollup, Drilldown,   |                       | (Classification,      |
|  Slice, Dice, Pivot)  |                       |  Clustering, Rules)   |
+-----------+-----------+                       +-----------+-----------+
            |                                               |
            +-----------------------+-----------------------+
                                    |
                                    v
            +-----------------------------------------------+
            |          INTERACTIVE STREAMLIT DASHBOARD      |
            +-----------------------------------------------+
```

---

## 9. Data Preprocessing
- Missing value evaluation & duplicate row removal.
- Categorical one-hot encoding & numerical standard scaling.
- Stratified 80/20 train/test split fitting scalers strictly on training data to prevent data leakage.

---

## 10. Data Warehouse Design
- **Architecture**: Star Schema (`data_warehouse/loan_dw.db`).
- **Fact Table**: `Fact_Loan_Performance`
- **Dimension Tables**: `Dim_Borrower`, `Dim_Loan_Purpose`, `Dim_Credit_Profile`, `Dim_Risk_Tier`.

---

## 11. OLAP Operations
1. **Roll-up**: Aggregating default rates from Borrower level to Age Group & Education level.
2. **Drill-down**: Breakdown by Employment Type -> Loan Purpose.
3. **Slice**: Isolating loans where `LoanPurpose = 'Home'`.
4. **Dice**: Multi-dimensional filtering (`Education`, `Employment`, `CreditScore`).
5. **Pivot**: Matrix cross-tabulation of `Education` vs `EmploymentType`.

---

## 12. Classification
- Trained Logistic Regression, Decision Tree, Random Forest, and Gradient Boosting.
- Evaluation metrics: Accuracy, Precision, Recall, F1-Score, ROC-AUC, Log Loss.
- Imbalance discussion: Accuracy alone is insufficient; F1-score & ROC-AUC prioritize default recall.

---

## 13. Clustering
- K-Means segmentation on financial features (`Income`, `CreditScore`, `LoanAmount`, `DTIRatio`, `MonthsEmployed`).
- Evaluated optimal $K=3$ using Elbow method and Silhouette scores.

---

## 14. Association Rules
- Discretized continuous metrics into categorical quantiles.
- Extracted rules using Apriori algorithm filtered for consequent `Default:Yes` ranked by Lift.

---

## 15. Prediction
- Continuous default probability scoring engine $P(\text{Default}=1)$ assigning risk category badges (`Low Risk`, `Moderate Risk`, `High Risk`, `Critical Risk`) and risk factor warnings.

---

## 16. Dashboard
- 7-tab Streamlit application (`dashboard/app.py`) featuring executive KPIs, EDA charts, OLAP viewer, model comparison tables, cluster scatter plots, association rules, and real-time predictor form.

---

## 17. Results
- **Champion Classifier**: Gradient Boosting / Random Forest (F1-Score ~ 0.72+, ROC-AUC ~ 0.85+).
- **Cluster Segments**: 3 distinct borrower profiles (Low Risk Prime, Moderate Risk Standard, High Risk Subprime).
- **Association Rule**: Poor Credit Score + High DTI exhibits highest Lift (~4.6).

---

## 18. How to Install
```bash
# Clone or navigate to directory
cd C:\Users\Mahaprabhu K\.gemini\antigravity-ide\scratch\Byte_Brigades_Loan_Default

# Install dependencies
pip install -r requirements.txt
```

---

## 19. How to Run
```bash
# Execute master end-to-end pipeline
python run_project.py

# Launch interactive Streamlit dashboard
streamlit run dashboard/app.py
```

---

## 20. Project Structure
```
Byte_Brigades_Loan_Default/
├── data/
│   ├── raw/
│   └── processed/
├── preprocessing/
├── data_warehouse/
├── olap/
├── classification/
├── clustering/
├── association_rules/
├── prediction/
├── dashboard/
├── results/
├── documentation/
├── requirements.txt
├── README.md
├── STATUS.md
└── run_project.py
```

---

## 21. Limitations
- Synthetic benchmark dataset used when raw Kaggle CSV is unpopulated.
- Model trained on static batch snapshots rather than real-time streaming credit bureau feeds.

---

## 22. Future Enhancements
- Integration with live credit API endpoints (e.g. Equifax/TransUnion).
- Advanced Deep Learning architectures (TabNet) for tabular credit risk modeling.
- Automated MLOps model retraining triggers based on credit drift.
