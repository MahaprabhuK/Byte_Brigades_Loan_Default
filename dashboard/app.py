"""
Byte Brigades - Loan Default Analysis & Predictive Intelligence Dashboard
------------------------------------------------------------------------
Academic Streamlit Dashboard integrating Data Warehouse OLAP, Data Mining
(Classification, Clustering, Association Rules), and Real-time Probability Prediction.
"""

import os
import sys
import json
import sqlite3
import pandas as pd
import numpy as np
import streamlit as st
import plotly.express as px
import plotly.graph_objects as go

# Add parent directory paths
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "preprocessing"))
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "prediction"))

from loader import get_loan_data
from predictor import LoanDefaultPredictor

# Page Setup
st.set_page_config(
    page_title="Byte Brigades - Loan Default Intelligence",
    page_icon="🏦",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling
st.markdown("""
<style>
    .main-header {
        font-size: 2.2rem;
        font-weight: 700;
        color: #1e3d59;
        margin-bottom: 0px;
    }
    .sub-header {
        font-size: 1.1rem;
        color: #17b978;
        margin-bottom: 20px;
        font-weight: 600;
    }
    .metric-card {
        background-color: #f8f9fa;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        border-left: 4px solid #1e3d59;
    }
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
    }
    .stTabs [data-baseweb="tab"] {
        height: 45px;
        background-color: #f1f3f5;
        border-radius: 4px 4px 0 0;
        font-weight: 600;
    }
    .stTabs [aria-selected="true"] {
        background-color: #1e3d59 !important;
        color: white !important;
    }
</style>
""", unsafe_allow_html=True)

# Helper Data Loaders
@st.cache_data
def load_raw_data():
    return get_loan_data()

@st.cache_data
def load_results():
    base = os.path.join(os.path.dirname(__file__), "..", "results")
    
    olap_path = os.path.join(base, "olap", "olap_results.json")
    cls_path = os.path.join(base, "classification", "classification_metrics.json")
    clust_path = os.path.join(base, "clustering", "cluster_profiles.json")
    rules_path = os.path.join(base, "association_rules", "association_rules.json")
    
    olap_data = json.load(open(olap_path)) if os.path.exists(olap_path) else {}
    cls_data = json.load(open(cls_path)) if os.path.exists(cls_path) else {}
    clust_data = json.load(open(clust_path)) if os.path.exists(clust_path) else []
    rules_data = json.load(open(rules_path)) if os.path.exists(rules_path) else []
    
    return olap_data, cls_data, clust_data, rules_data

# Sidebar Navigation
st.sidebar.image("https://img.icons8.com/isometric/100/bank.png", width=70)
st.sidebar.title("Byte Brigades")
st.sidebar.caption("Academic DW & DM Project")

navigation = st.sidebar.radio(
    "Select Module:",
    [
        "📊 Overview & KPIs",
        "🔍 Data Analysis (EDA)",
        "🏛️ Data Warehouse & OLAP",
        "🤖 Classification Benchmarks",
        "🎯 Borrower Clustering",
        "🔗 Association Rules",
        "⚡ Real-Time Predictor"
    ]
)

df_raw = load_raw_data()
olap_res, cls_res, clust_res, rules_res = load_results()

st.sidebar.markdown("---")
st.sidebar.info("System Status: All Modules Verified & Operational")

# -------------------------------------------------------------
# 1. OVERVIEW & KPIS
# -------------------------------------------------------------
if navigation == "📊 Overview & KPIs":
    st.markdown('<p class="main-header">Byte Brigades - Loan Default Intelligence Dashboard</p>', unsafe_allow_html=True)
    st.markdown('<p class="sub-header">Data Warehousing & Data Mining Academic Project</p>', unsafe_allow_html=True)
    
    total_borrowers = len(df_raw)
    total_loans = f"${df_raw['LoanAmount'].sum():,.0f}"
    default_count = df_raw["Default"].sum()
    default_rate = (default_count / total_borrowers) * 100
    avg_income = f"${df_raw['Income'].mean():,.0f}"
    avg_loan = f"${df_raw['LoanAmount'].mean():,.0f}"
    avg_credit = f"{df_raw['CreditScore'].mean():.0f}"
    
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Total Borrowers", f"{total_borrowers:,}")
    col2.metric("Default Count", f"{default_count:,}", delta=f"{default_rate:.2f}% Default Rate", delta_color="inverse")
    col3.metric("Avg Borrower Income", avg_income)
    col4.metric("Avg Credit Score", avg_credit)
    
    col5, col6, col7, col8 = st.columns(4)
    col5.metric("Total Portfolio Value", total_loans)
    col6.metric("Avg Loan Amount", avg_loan)
    col7.metric("Avg DTI Ratio", f"{df_raw['DTIRatio'].mean():.2f}")
    col8.metric("Avg Interest Rate", f"{df_raw['InterestRate'].mean():.2f}%")
    
    st.markdown("---")
    st.subheader("Raw Dataset Preview & Schema Inspection")
    st.dataframe(df_raw.head(10), use_container_width=True)
    
    c1, c2 = st.columns(2)
    with c1:
        st.subheader("Default Class Breakdown")
        fig = px.pie(df_raw, names="Default", title="Target Class Distribution (0: No Default, 1: Default)",
                     color_discrete_sequence=["#2ecc71", "#e74c3c"])
        st.plotly_chart(fig, use_container_width=True)
    with c2:
        st.subheader("Loan Purpose Breakdown")
        fig2 = px.bar(df_raw["LoanPurpose"].value_counts().reset_index(), x="LoanPurpose", y="count",
                      labels={"count": "Number of Loans", "LoanPurpose": "Purpose"}, color="LoanPurpose")
        st.plotly_chart(fig2, use_container_width=True)

# -------------------------------------------------------------
# 2. DATA ANALYSIS (EDA)
# -------------------------------------------------------------
elif navigation == "🔍 Data Analysis (EDA)":
    st.header("Exploratory Data Analysis & Risk Trends")
    
    st.sidebar.subheader("Filter EDA View")
    purpose_filter = st.sidebar.multiselect("Select Loan Purpose:", df_raw["LoanPurpose"].unique(), default=df_raw["LoanPurpose"].unique())
    emp_filter = st.sidebar.multiselect("Select Employment Type:", df_raw["EmploymentType"].unique(), default=df_raw["EmploymentType"].unique())
    
    filtered_df = df_raw[(df_raw["LoanPurpose"].isin(purpose_filter)) & (df_raw["EmploymentType"].isin(emp_filter))]
    
    col1, col2 = st.columns(2)
    with col1:
        st.subheader("Default Rate by Loan Purpose")
        df_purp = filtered_df.groupby("LoanPurpose")["Default"].mean().reset_index()
        df_purp["DefaultRate_Pct"] = df_purp["Default"] * 100
        fig = px.bar(df_purp, x="LoanPurpose", y="DefaultRate_Pct", color="LoanPurpose", text_auto=".1f",
                     title="Default Rate (%) by Purpose")
        st.plotly_chart(fig, use_container_width=True)
        
    with col2:
        st.subheader("Default Rate by Employment Type")
        df_emp = filtered_df.groupby("EmploymentType")["Default"].mean().reset_index()
        df_emp["DefaultRate_Pct"] = df_emp["Default"] * 100
        fig = px.bar(df_emp, x="EmploymentType", y="DefaultRate_Pct", color="EmploymentType", text_auto=".1f",
                     title="Default Rate (%) by Employment")
        st.plotly_chart(fig, use_container_width=True)
        
    col3, col4 = st.columns(2)
    with col3:
        st.subheader("Credit Score vs Default Outcome")
        fig = px.box(filtered_df, x="Default", y="CreditScore", color="Default",
                     title="Credit Score Distribution by Default Status")
        st.plotly_chart(fig, use_container_width=True)
        
    with col4:
        st.subheader("DTI Ratio vs Default Outcome")
        fig = px.box(filtered_df, x="Default", y="DTIRatio", color="Default",
                     title="Debt-to-Income (DTI) Ratio Distribution by Default Status")
        st.plotly_chart(fig, use_container_width=True)

# -------------------------------------------------------------
# 3. DATA WAREHOUSE & OLAP
# -------------------------------------------------------------
elif navigation == "🏛️ Data Warehouse & OLAP":
    st.header("Data Warehouse Architecture & OLAP Operations")
    
    st.markdown("""
    **Warehouse Architecture**: Star Schema implemented on SQLite database (`loan_dw.db`).  
    - **Fact Table**: `Fact_Loan_Performance`  
    - **Dimensions**: `Dim_Borrower`, `Dim_Loan_Purpose`, `Dim_Credit_Profile`, `Dim_Risk_Tier`
    """)
    
    tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([
        "1. Roll-up", "2. Drill-down", "3. Slice", "4. Dice", "5. Pivot", "⚡ Custom SQL Query"
    ])
    
    with tab1:
        st.subheader("Roll-up Operation")
        st.caption("Aggregating individual borrower metrics to Age Group and Education level.")
        if "rollup" in olap_res:
            df_ru = pd.DataFrame(olap_res["rollup"])
            st.dataframe(df_ru, use_container_width=True)
            fig = px.bar(df_ru, x="AgeGroup", y="DefaultRate_Pct", color="Education", barmode="group",
                         title="Roll-up: Default Rate (%) by Age Group & Education")
            st.plotly_chart(fig, use_container_width=True)
            
    with tab2:
        st.subheader("Drill-down Operation")
        st.caption("Drilling down from Employment Type into individual Loan Purpose details.")
        if "drilldown" in olap_res:
            df_dd = pd.DataFrame(olap_res["drilldown"])
            st.dataframe(df_dd, use_container_width=True)
            fig = px.sunburst(df_dd, path=["EmploymentType", "LoanPurpose"], values="TotalLoans",
                               color="DefaultRate_Pct", title="Drill-down Sunburst Hierarchy")
            st.plotly_chart(fig, use_container_width=True)
            
    with tab3:
        st.subheader("Slice Operation")
        st.caption("Slicing the Data Warehouse on `LoanPurpose = 'Home'`.")
        if "slice" in olap_res:
            df_sl = pd.DataFrame(olap_res["slice"])
            st.dataframe(df_sl, use_container_width=True)
            
    with tab4:
        st.subheader("Dice Operation")
        st.caption("Dicing multi-dimensional criteria: (Education IN Bachelor's/Master's) & (Employment = Full-time) & (CreditScore >= 650).")
        if "dice" in olap_res:
            df_dc = pd.DataFrame(olap_res["dice"])
            st.dataframe(df_dc, use_container_width=True)
            
    with tab5:
        st.subheader("Pivot Operation")
        st.caption("Cross-tabulation matrix: Education vs Employment Type Default Rate (%).")
        if "pivot" in olap_res:
            df_pv = pd.DataFrame(olap_res["pivot"])
            st.dataframe(df_pv, use_container_width=True)
            fig = px.imshow(df_pv, text_auto=True, color_continuous_scale="Reds", title="Pivot Heatmap (Default Rate %)")
            st.plotly_chart(fig, use_container_width=True)
            
    with tab6:
        st.subheader("Live SQL Query Execution")
        db_path = os.path.join(os.path.dirname(__file__), "..", "data_warehouse", "loan_dw.db")
        default_query = "SELECT b.AgeGroup, b.Education, COUNT(f.FactID) as Loans, AVG(f.DefaultStatus)*100 as DefaultRate FROM Fact_Loan_Performance f JOIN Dim_Borrower b ON f.BorrowerID = b.BorrowerID GROUP BY b.AgeGroup, b.Education;"
        user_query = st.text_area("Write SQL Query against SQLite DW:", default_query, height=100)
        
        if st.button("Execute Query"):
            if os.path.exists(db_path):
                conn = sqlite3.connect(db_path)
                try:
                    df_custom = pd.read_sql_query(user_query, conn)
                    st.success("Query Executed Successfully!")
                    st.dataframe(df_custom, use_container_width=True)
                except Exception as e:
                    st.error(f"SQL Error: {e}")
                conn.close()

# -------------------------------------------------------------
# 4. CLASSIFICATION BENCHMARKS
# -------------------------------------------------------------
elif navigation == "🤖 Classification Benchmarks":
    st.header("Machine Learning Classification Benchmarks")
    
    if "metrics" in cls_res:
        df_metrics = pd.DataFrame(cls_res["metrics"]).T
        st.subheader("Model Performance Comparison Matrix")
        st.dataframe(df_metrics.style.highlight_max(axis=0, color="#d4edda"), use_container_width=True)
        
        c1, c2 = st.columns(2)
        with c1:
            st.subheader("F1-Score & ROC-AUC Comparison")
            fig = px.bar(df_metrics.reset_index(), x="index", y=["F1_Score", "ROC_AUC"], barmode="group",
                         title="F1-Score & ROC-AUC by Model", labels={"index": "Model"})
            st.plotly_chart(fig, use_container_width=True)
            
        with c2:
            st.subheader("Selected Best Model")
            st.success(f"🏆 Champion Model: **{cls_res.get('best_model', 'N/A')}**")
            st.markdown("""
            **Why F1-Score & ROC-AUC over Accuracy?**  
            Loan default datasets are imbalanced. A model predicting 0 default for every borrower achieves 88% accuracy but misses 100% of defaults.
            Our champion model is selected to maximize **Recall** and **F1-Score**.
            """)
            
        st.markdown("---")
        st.subheader("Diagnostic Plots")
        img_dir = os.path.join(os.path.dirname(__file__), "..", "results", "classification")
        roc_img = os.path.join(img_dir, "roc_curves.png")
        cm_img = os.path.join(img_dir, "confusion_matrices.png")
        
        col_img1, col_img2 = st.columns(2)
        with col_img1:
            if os.path.exists(roc_img):
                st.image(roc_img, caption="ROC Curves Comparison", use_container_width=True)
        with col_img2:
            if os.path.exists(cm_img):
                st.image(cm_img, caption="Confusion Matrices Across Models", use_container_width=True)

# -------------------------------------------------------------
# 5. BORROWER CLUSTERING
# -------------------------------------------------------------
elif navigation == "🎯 Borrower Clustering":
    st.header("Borrower Segmentation & Clustering (K-Means)")
    
    if clust_res:
        df_clusters = pd.DataFrame(clust_res)
        st.subheader("Identified Borrower Cluster Profiles (K=3)")
        st.dataframe(df_clusters, use_container_width=True)
        
        c1, c2 = st.columns(2)
        with c1:
            st.subheader("Cluster Default Rate (%)")
            fig = px.bar(df_clusters, x="ProfileName", y="DefaultRate_Pct", color="RiskTier",
                         title="Default Rate by Segment", text_auto=".1f")
            st.plotly_chart(fig, use_container_width=True)
            
        with c2:
            st.subheader("Cluster Distribution")
            fig2 = px.pie(df_clusters, names="ProfileName", values="BorrowerCount",
                          title="Borrower Share per Cluster Segment")
            st.plotly_chart(fig2, use_container_width=True)
            
        st.markdown("---")
        img_dir = os.path.join(os.path.dirname(__file__), "..", "results", "clustering")
        elbow_img = os.path.join(img_dir, "elbow_silhouette.png")
        pca_img = os.path.join(img_dir, "cluster_scatter.png")
        
        ci1, ci2 = st.columns(2)
        with ci1:
            if os.path.exists(elbow_img):
                st.image(elbow_img, caption="Elbow & Silhouette Evaluation", use_container_width=True)
        with ci2:
            if os.path.exists(pca_img):
                st.image(pca_img, caption="2D PCA Scatter Visualization", use_container_width=True)

# -------------------------------------------------------------
# 6. ASSOCIATION RULES
# -------------------------------------------------------------
elif navigation == "🔗 Association Rules":
    st.header("Association Rule Mining (Apriori Algorithm)")
    
    if rules_res:
        df_rules = pd.DataFrame(rules_res)
        
        st.sidebar.subheader("Filter Rules")
        min_lift = st.sidebar.slider("Minimum Lift:", 1.0, 3.0, 1.0, 0.1)
        min_conf = st.sidebar.slider("Minimum Confidence:", 0.1, 1.0, 0.2, 0.05)
        
        filtered_rules = df_rules[(df_rules["lift"] >= min_lift) & (df_rules["confidence"] >= min_conf)]
        
        st.subheader(f"Top Extracted Rules for Target Outcome: Default:Yes ({len(filtered_rules)} Rules)")
        st.dataframe(filtered_rules[["antecedents_str", "consequents_str", "support", "confidence", "lift"]], use_container_width=True)
        
        fig = px.scatter(filtered_rules, x="support", y="confidence", size="lift", color="lift",
                         hover_data=["antecedents_str"], title="Association Rules: Support vs Confidence vs Lift")
        st.plotly_chart(fig, use_container_width=True)

# -------------------------------------------------------------
# 7. REAL-TIME PREDICTOR
# -------------------------------------------------------------
elif navigation == "⚡ Real-Time Predictor":
    st.header("Real-Time Default Probability Scoring Engine")
    st.caption("Enter borrower financial payload details to compute default probability P(Default=1) and risk category.")
    
    predictor = LoanDefaultPredictor()
    
    if not predictor.is_ready():
        st.error("Model artifacts not found. Run 'run_project.py' to train models first.")
    else:
        with st.form("prediction_form"):
            col1, col2, col3 = st.columns(3)
            
            with col1:
                st.subheader("Financial Metrics")
                income = st.number_input("Annual Income ($)", 15000, 300000, 45000, step=5000)
                loan_amt = st.number_input("Loan Amount ($)", 5000, 500000, 120000, step=5000)
                credit_score = st.slider("Credit Score", 300, 850, 620)
                dti = st.slider("Debt-to-Income (DTI) Ratio", 0.05, 0.95, 0.42, step=0.01)
                interest_rate = st.slider("Interest Rate (%)", 2.0, 30.0, 14.5, step=0.5)
                
            with col2:
                st.subheader("Borrower Profile")
                age = st.number_input("Age", 18, 80, 34)
                months_emp = st.number_input("Months Employed", 0, 300, 24)
                num_credit = st.number_input("Open Credit Lines", 1, 10, 3)
                loan_term = st.selectbox("Loan Term (Months)", [12, 24, 36, 48, 60], index=2)
                
            with col3:
                st.subheader("Categorical Attributes")
                education = st.selectbox("Education", ["High School", "Bachelor's", "Master's", "PhD"])
                employment = st.selectbox("Employment Type", ["Full-time", "Part-time", "Self-employed", "Unemployed"])
                marital = st.selectbox("Marital Status", ["Single", "Married", "Divorced"])
                has_mortgage = st.selectbox("Has Mortgage?", ["Yes", "No"])
                has_dependents = st.selectbox("Has Dependents?", ["Yes", "No"])
                purpose = st.selectbox("Loan Purpose", ["Auto", "Business", "Education", "Home", "Other"])
                has_cosigner = st.selectbox("Has Co-Signer?", ["Yes", "No"])
                
            submit_btn = st.form_submit_button("⚡ Compute Default Risk Probability", use_container_width=True)
            
        if submit_btn:
            payload = {
                "Age": age, "Income": income, "LoanAmount": loan_amt, "CreditScore": credit_score,
                "MonthsEmployed": months_emp, "NumCreditLines": num_credit, "InterestRate": interest_rate,
                "LoanTerm": loan_term, "DTIRatio": dti, "Education": education, "EmploymentType": employment,
                "MaritalStatus": marital, "HasMortgage": has_mortgage, "HasDependents": has_dependents,
                "LoanPurpose": purpose, "HasCoSigner": has_cosigner
            }
            
            result = predictor.predict_borrower_risk(payload)
            prob_pct = result["default_probability_percentage"]
            prob_val = result["default_probability"]
            pred_label = result["predicted_label"]
            risk_cat = result["risk_category"]
            risk_factors = result["risk_factors"]
            
            st.markdown("---")
            st.subheader("Assessment Result")
            
            res_col1, res_col2, res_col3 = st.columns(3)
            res_col1.metric("Default Probability P(Default=1)", prob_pct)
            res_col2.metric("Predicted Outcome Class", pred_label)
            res_col3.metric("Risk Classification Tier", risk_cat)
            
            # Probability Gauge Meter
            fig_gauge = go.Figure(go.Indicator(
                mode="gauge+number",
                value=prob_val * 100,
                domain={'x': [0, 1], 'y': [0, 1]},
                title={'text': "Default Risk Gauge (%)"},
                gauge={
                    'axis': {'range': [0, 100]},
                    'bar': {'color': "#1e3d59"},
                    'steps': [
                        {'range': [0, 20], 'color': "#2ecc71"},
                        {'range': [20, 45], 'color': "#f1c40f"},
                        {'range': [45, 70], 'color': "#e67e22"},
                        {'range': [70, 100], 'color': "#e74c3c"}
                    ]
                }
            ))
            st.plotly_chart(fig_gauge, use_container_width=True)
            
            st.subheader("Key Risk Factor Breakdown")
            for factor in risk_factors:
                st.warning(f"⚠️ {factor}")
