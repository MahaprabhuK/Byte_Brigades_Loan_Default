"""
Byte Brigades - Loan Default Classification Engine
--------------------------------------------------
Trains Logistic Regression, Decision Tree, Random Forest, and Gradient Boosting.
Evaluates models using Accuracy, Precision, Recall, F1-score, ROC-AUC, Log Loss,
and Confusion Matrices. Saves best model and diagnostic plots without data leakage.
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, log_loss, confusion_matrix, roc_curve
)

PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed")
RESULTS_DIR = os.path.join(os.path.dirname(__file__), "..", "results", "classification")
SAVED_MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "prediction", "saved_models")

def train_and_evaluate_classifiers():
    os.makedirs(RESULTS_DIR, exist_ok=True)
    os.makedirs(SAVED_MODELS_DIR, exist_ok=True)
    
    print("[CLASSIFICATION] Loading train and test sets...")
    df_train = pd.read_csv(os.path.join(PROCESSED_DIR, "train.csv"))
    df_test = pd.read_csv(os.path.join(PROCESSED_DIR, "test.csv"))
    
    X_train = df_train.drop(columns=["Default"])
    y_train = df_train["Default"]
    
    X_test = df_test.drop(columns=["Default"])
    y_test = df_test["Default"]
    
    print(f"[CLASSIFICATION] Training samples: {len(X_train)}, Testing samples: {len(X_test)}")
    
    models = {
        "Logistic Regression": LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42),
        "Decision Tree": DecisionTreeClassifier(max_depth=8, class_weight="balanced", random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=100, max_depth=12, class_weight="balanced", random_state=42, n_jobs=-1),
        "Gradient Boosting": GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=42)
    }
    
    results = {}
    fitted_models = {}
    roc_curves_data = {}
    conf_matrices = {}
    
    plt.style.use("ggplot")
    fig_cm, axes_cm = plt.subplots(2, 2, figsize=(10, 8))
    axes_cm = axes_cm.flatten()
    
    fig_roc, ax_roc = plt.subplots(figsize=(8, 6))
    
    best_f1 = -1.0
    best_model_name = ""
    
    for idx, (name, model) in enumerate(models.items()):
        print(f"   -> Training {name}...")
        model.fit(X_train, y_train)
        
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1] if hasattr(model, "predict_proba") else y_pred
        
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        auc = roc_auc_score(y_test, y_prob)
        loss = log_loss(y_test, y_prob)
        cm = confusion_matrix(y_test, y_pred)
        
        results[name] = {
            "Accuracy": round(float(acc), 4),
            "Precision": round(float(prec), 4),
            "Recall": round(float(rec), 4),
            "F1_Score": round(float(f1), 4),
            "ROC_AUC": round(float(auc), 4),
            "Log_Loss": round(float(loss), 4)
        }
        fitted_models[name] = model
        conf_matrices[name] = cm.tolist()
        
        # Plot Confusion Matrix
        sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", ax=axes_cm[idx], cbar=False)
        axes_cm[idx].set_title(f"{name}\nF1: {f1:.3f} | AUC: {auc:.3f}", fontsize=10, fontweight="bold")
        axes_cm[idx].set_xlabel("Predicted")
        axes_cm[idx].set_ylabel("Actual")
        axes_cm[idx].set_xticklabels(["No Default", "Default"])
        axes_cm[idx].set_yticklabels(["No Default", "Default"])
        
        # Compute ROC Curve
        fpr, tpr, _ = roc_curve(y_test, y_prob)
        roc_curves_data[name] = {"fpr": fpr.tolist(), "tpr": tpr.tolist()}
        ax_roc.plot(fpr, tpr, label=f"{name} (AUC = {auc:.3f})", linewidth=2)
        
        # Track best model based on F1-score & ROC-AUC
        combined_metric = (f1 * 0.6) + (auc * 0.4)
        if combined_metric > best_f1:
            best_f1 = combined_metric
            best_model_name = name
            
    fig_cm.suptitle("Confusion Matrix Comparison Across Models", fontsize=14, fontweight="bold")
    plt.tight_layout()
    fig_cm.savefig(os.path.join(RESULTS_DIR, "confusion_matrices.png"), dpi=300)
    plt.close(fig_cm)
    
    ax_roc.plot([0, 1], [0, 1], 'k--', label="Random Chance (AUC = 0.500)", linewidth=1.5)
    ax_roc.set_title("Receiver Operating Characteristic (ROC) Curves", fontsize=12, fontweight="bold")
    ax_roc.set_xlabel("False Positive Rate")
    ax_roc.set_ylabel("True Positive Rate")
    ax_roc.legend(loc="lower right")
    fig_roc.tight_layout()
    fig_roc.savefig(os.path.join(RESULTS_DIR, "roc_curves.png"), dpi=300)
    plt.close(fig_roc)
    
    print(f"[CLASSIFICATION] Best Model Identified: '{best_model_name}' (F1/AUC Score: {best_f1:.4f})")
    
    # Save Best Model
    best_model_obj = fitted_models[best_model_name]
    joblib.dump(best_model_obj, os.path.join(SAVED_MODELS_DIR, "best_classifier.joblib"))
    
    # Save Classification Summary Metadata
    summary_data = {
        "best_model": best_model_name,
        "metrics": results,
        "confusion_matrices": conf_matrices
    }
    with open(os.path.join(RESULTS_DIR, "classification_metrics.json"), "w") as f:
        json.dump(summary_data, f, indent=4)
        
    # Generate Markdown Table Report
    df_results = pd.DataFrame(results).T
    df_results = df_results[["Accuracy", "Precision", "Recall", "F1_Score", "ROC_AUC", "Log_Loss"]]
    
    md_report = f"""# Classification Benchmark & Model Evaluation Report - Byte Brigades

## Imbalance Sensitivity Analysis
In financial credit risk modeling, loan default datasets are inherently imbalanced (typically ~10-15% default rate). 
**Accuracy alone is a misleading metric**: a naive classifier predicting zero defaults for all borrowers would achieve 88%+ accuracy while completely failing to detect risky loans, leading to severe institutional credit losses. 
Therefore, our evaluation prioritizes **Recall** (capturing actual defaulters), **F1-Score** (harmonic mean of Precision & Recall), and **ROC-AUC** (discriminatory capability across probability thresholds).

## Model Comparison Table
{df_results.to_markdown()}

## Selected Best Model
- **Champion Model**: `{best_model_name}`
- **F1-Score**: `{results[best_model_name]['F1_Score']}`
- **ROC-AUC**: `{results[best_model_name]['ROC_AUC']}`
- **Recall**: `{results[best_model_name]['Recall']}`
- **Accuracy**: `{results[best_model_name]['Accuracy']}`

Saved model artifact to `prediction/saved_models/best_classifier.joblib`.
"""
    with open(os.path.join(RESULTS_DIR, "model_comparison.md"), "w") as f:
        f.write(md_report)
        
    print("[CLASSIFICATION] Classification pipeline complete. Metrics & saved model exported successfully.")
    return results, best_model_name

if __name__ == "__main__":
    train_and_evaluate_classifiers()
