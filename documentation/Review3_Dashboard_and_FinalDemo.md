# Academic Review 3: Dashboard, Integration & Final Viva Demo Guide

**Team**: Byte Brigades  
**Domain**: Loan Default Interactive Dashboard & End-to-End System Demonstration  

---

## 1. Streamlit Dashboard Architecture
The interactive dashboard (`dashboard/app.py`) integrates all Data Warehousing & Data Mining components into a unified web dashboard:

1. **📊 Overview & KPIs**: Executive KPI cards (Total Borrowers, Portfolio Value, Default Count, Default Rate %, Avg Income, Avg Credit Score).
2. **🔍 Data Analysis (EDA)**: Interactive filtered visual charts examining default distributions against borrower demographics.
3. **🏛️ Data Warehouse & OLAP**: Visual tabs presenting Roll-up, Drill-down, Slice, Dice, and Pivot query outputs, plus an interactive SQL query terminal connected to `loan_dw.db`.
4. **🤖 Classification Benchmarks**: Interactive model performance matrices, ROC curves, and confusion matrix comparisons.
5. **🎯 Borrower Clustering**: Segment profiling, PCA 2D scatter plots, and risk tier distribution pie charts.
6. **🔗 Association Rules**: Interactive slider filtering rules by Support, Confidence, and Lift metrics.
7. **⚡ Real-Time Predictor**: Borrower input form calculating instant probability scores $P(\text{Default}=1)$, risk tier badges, and risk factor warnings.

---

## 2. Launching & Testing Instructions
Run the master automation pipeline:
```bash
python run_project.py
```
Launch the interactive Streamlit dashboard:
```bash
streamlit run dashboard/app.py
```

---

## 3. Final Viva Q&A Cheat Sheet
- **Q1: Why did you choose SQLite for the Data Warehouse?**  
  *A*: SQLite provides zero-configuration, serverless, single-file database execution perfect for academic reproducibility while fully supporting standard SQL Star Schema DDL and OLAP queries.
- **Q2: What is the difference between classification output and probability prediction?**  
  *A*: Classification outputs a hard binary decision (0 or 1), whereas probability prediction calculates a continuous risk score $P(\text{Default}=1)$ enabling financial institutions to assign risk tiers and custom risk thresholds.
- **Q3: How did you avoid data leakage during scaling and encoding?**  
  *A*: Preprocessing transformers (`StandardScaler` and `OneHotEncoder`) were fitted exclusively on the 80% training split (`X_train`) and subsequently applied to transform the test set (`X_test`).
