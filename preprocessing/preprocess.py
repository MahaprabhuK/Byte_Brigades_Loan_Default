"""
Byte Brigades - Loan Default Preprocessing Pipeline
--------------------------------------------------
Handles inspection, missing values, duplicate removal, train/test splitting,
encoding, scaling without data leakage, and outputs summary statistics & visualizations.
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer

from loader import get_loan_data

PROCESSED_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed")
RESULTS_DIR = os.path.join(os.path.dirname(__file__), "..", "results", "preprocessing")
SAVED_MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "prediction", "saved_models")

def run_preprocessing_pipeline():
    os.makedirs(PROCESSED_DATA_DIR, exist_ok=True)
    os.makedirs(RESULTS_DIR, exist_ok=True)
    os.makedirs(SAVED_MODELS_DIR, exist_ok=True)
    
    print("[PREPROCESSING] Step 1: Loading Raw Dataset...")
    df = get_loan_data()
    
    # 1. Dataset Inspection
    num_rows, num_cols = df.shape
    missing_vals = df.isnull().sum().to_dict()
    total_missing = sum(missing_vals.values())
    duplicate_rows = int(df.duplicated().sum())
    class_dist = df["Default"].value_counts().to_dict()
    class_dist_pct = df["Default"].value_counts(normalize=True).to_dict()
    
    cat_cols = ["Education", "EmploymentType", "MaritalStatus", "HasMortgage", "HasDependents", "LoanPurpose", "HasCoSigner"]
    num_cols_list = ["Age", "Income", "LoanAmount", "CreditScore", "MonthsEmployed", "NumCreditLines", "InterestRate", "LoanTerm", "DTIRatio"]
    
    inspection_summary = {
        "num_rows": num_rows,
        "num_cols": num_cols,
        "column_names": list(df.columns),
        "data_types": {col: str(dtype) for col, dtype in df.dtypes.items()},
        "total_missing_values": total_missing,
        "missing_values_per_column": missing_vals,
        "duplicate_rows": duplicate_rows,
        "class_distribution_counts": {str(k): int(v) for k, v in class_dist.items()},
        "class_distribution_percentages": {str(k): round(float(v) * 100, 2) for k, v in class_dist_pct.items()},
        "categorical_variables": cat_cols,
        "numerical_variables": num_cols_list
    }
    
    with open(os.path.join(RESULTS_DIR, "inspection_summary.json"), "w") as f:
        json.dump(inspection_summary, f, indent=4)
        
    print(f"[PREPROCESSING] Dataset Inspected: {num_rows} rows, {num_cols} columns. Missing: {total_missing}, Duplicates: {duplicate_rows}")
    
    # 2. Visualizations
    plt.style.use("ggplot")
    
    # Class Distribution Plot
    fig, ax = plt.subplots(figsize=(6, 4))
    sns.countplot(data=df, x="Default", hue="Default", palette=["#2ecc71", "#e74c3c"], legend=False, ax=ax)
    ax.set_title("Target Class Distribution (Default vs No Default)", fontsize=12, fontweight="bold")
    ax.set_xticks([0, 1])
    ax.set_xticklabels(["0: No Default", "1: Default"])
    ax.set_ylabel("Count")
    for p in ax.patches:
        ax.annotate(f"{int(p.get_height())}\n({p.get_height()/len(df)*100:.1f}%)",
                    (p.get_x() + p.get_width() / 2., p.get_height() / 2),
                    ha='center', va='center', fontsize=10, color='white', fontweight='bold')
    plt.tight_layout()
    plt.savefig(os.path.join(RESULTS_DIR, "class_distribution.png"), dpi=300)
    plt.close()
    
    # Missing Values Summary Plot
    fig, ax = plt.subplots(figsize=(8, 4))
    missing_df = pd.Series(missing_vals)
    missing_df.plot(kind="bar", color="#3498db", ax=ax)
    ax.set_title("Missing Values per Feature Column", fontsize=12, fontweight="bold")
    ax.set_ylabel("Missing Count")
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plt.savefig(os.path.join(RESULTS_DIR, "missing_values.png"), dpi=300)
    plt.close()
    
    # Correlation Matrix Plot (Numerical Features + Target)
    fig, ax = plt.subplots(figsize=(10, 8))
    corr_df = df[num_cols_list + ["Default"]].corr()
    sns.heatmap(corr_df, annot=True, fmt=".2f", cmap="coolwarm", cbar=True, ax=ax)
    ax.set_title("Numerical Features & Target Correlation Heatmap", fontsize=12, fontweight="bold")
    plt.tight_layout()
    plt.savefig(os.path.join(RESULTS_DIR, "correlation_matrix.png"), dpi=300)
    plt.close()
    
    # Numerical Distributions Plot
    fig, axes = plt.subplots(3, 3, figsize=(14, 10))
    axes = axes.flatten()
    for idx, col in enumerate(num_cols_list):
        sns.histplot(df[col], kde=True, ax=axes[idx], color="#8e44ad", bins=25)
        axes[idx].set_title(f"Distribution of {col}", fontsize=10)
    plt.tight_layout()
    plt.savefig(os.path.join(RESULTS_DIR, "numerical_distributions.png"), dpi=300)
    plt.close()
    
    print("[PREPROCESSING] Preprocessing Plots generated and saved in results/preprocessing/")
    
    # 3. Data Cleaning & Preprocessing Pipeline (Avoiding Data Leakage)
    df_clean = df.drop_duplicates().copy()
    
    # Drop LoanID for ML modeling
    X = df_clean.drop(columns=["LoanID", "Default"])
    y = df_clean["Default"]
    
    # Train/Test Split (80/20 Stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    
    print(f"[PREPROCESSING] Train set shape: {X_train.shape}, Test set shape: {X_test.shape}")
    
    # Define Pipeline Transformer
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), num_cols_list),
            ("cat", OneHotEncoder(drop="first", sparse_output=False), cat_cols)
        ]
    )
    
    # Fit ONLY on X_train to avoid data leakage
    X_train_trans = preprocessor.fit_transform(X_train)
    X_test_trans = preprocessor.transform(X_test)
    
    # Get feature names after one-hot encoding
    cat_feature_names = preprocessor.named_transformers_["cat"].get_feature_names_out(cat_cols).tolist()
    feature_names = num_cols_list + cat_feature_names
    
    # Convert to DataFrames
    df_train_proc = pd.DataFrame(X_train_trans, columns=feature_names)
    df_train_proc["Default"] = y_train.values
    
    df_test_proc = pd.DataFrame(X_test_trans, columns=feature_names)
    df_test_proc["Default"] = y_test.values
    
    # Full Processed DataFrame
    X_all_trans = preprocessor.transform(X)
    df_all_proc = pd.DataFrame(X_all_trans, columns=feature_names)
    df_all_proc["Default"] = y.values
    df_all_proc["LoanID"] = df_clean["LoanID"].values
    
    # Save Processed Datasets
    df_all_proc.to_csv(os.path.join(PROCESSED_DATA_DIR, "loan_processed.csv"), index=False)
    df_train_proc.to_csv(os.path.join(PROCESSED_DATA_DIR, "train.csv"), index=False)
    df_test_proc.to_csv(os.path.join(PROCESSED_DATA_DIR, "test.csv"), index=False)
    
    # Save Preprocessor Pipeline object
    joblib.dump(preprocessor, os.path.join(SAVED_MODELS_DIR, "preprocessor.joblib"))
    
    # Save metadata for prediction pipeline
    meta_info = {
        "num_cols": num_cols_list,
        "cat_cols": cat_cols,
        "feature_names": feature_names
    }
    with open(os.path.join(SAVED_MODELS_DIR, "preprocessor_meta.json"), "w") as f:
        json.dump(meta_info, f, indent=4)
        
    print("[PREPROCESSING] Pipeline completed successfully. Processed data & fitted transformers saved.")
    return df, df_train_proc, df_test_proc

if __name__ == "__main__":
    run_preprocessing_pipeline()
