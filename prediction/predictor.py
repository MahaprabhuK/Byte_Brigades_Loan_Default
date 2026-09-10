"""
Byte Brigades - Default Probability Prediction Engine
------------------------------------------------------
Probabilistic scoring engine that evaluates borrower inputs against the saved
preprocessor pipeline and best classification model. Computes continuous P(Default=1),
assigns risk tier categories, and extracts major risk factors.
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.metrics import brier_score_loss, roc_auc_score, log_loss

SAVED_MODELS_DIR = os.path.join(os.path.dirname(__file__), "saved_models")
RESULTS_DIR = os.path.join(os.path.dirname(__file__), "..", "results", "prediction")
PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed")

class LoanDefaultPredictor:
    def __init__(self):
        self.preprocessor_path = os.path.join(SAVED_MODELS_DIR, "preprocessor.joblib")
        self.model_path = os.path.join(SAVED_MODELS_DIR, "best_classifier.joblib")
        self.meta_path = os.path.join(SAVED_MODELS_DIR, "preprocessor_meta.json")
        
        self.preprocessor = None
        self.model = None
        self.meta_info = None
        self._load_artifacts()
        
    def _load_artifacts(self):
        if os.path.exists(self.preprocessor_path):
            self.preprocessor = joblib.load(self.preprocessor_path)
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
        if os.path.exists(self.meta_path):
            with open(self.meta_path, "r") as f:
                self.meta_info = json.load(f)
                
    def is_ready(self):
        return self.preprocessor is not None and self.model is not None
        
    def predict_borrower_risk(self, borrower_data):
        """
        Accepts raw borrower payload dict and returns probability score, risk tier, and key risk factors.
        
        Expected dictionary keys:
        Age, Income, LoanAmount, CreditScore, MonthsEmployed, NumCreditLines, InterestRate, LoanTerm, DTIRatio,
        Education, EmploymentType, MaritalStatus, HasMortgage, HasDependents, LoanPurpose, HasCoSigner
        """
        if not self.is_ready():
            raise RuntimeError("Predictor artifacts not loaded. Ensure models are trained first.")
            
        df_input = pd.DataFrame([borrower_data])
        
        # Transform through fitted preprocessor
        X_trans = self.preprocessor.transform(df_input)
        
        # Predict continuous probability P(Default=1)
        prob_default = float(self.model.predict_proba(X_trans)[0, 1])
        pred_class = int(self.model.predict(X_trans)[0])
        
        # Determine Risk Category based on probability thresholds
        if prob_default < 0.20:
            risk_cat = "Low Risk"
        elif prob_default < 0.45:
            risk_cat = "Moderate Risk"
        elif prob_default < 0.70:
            risk_cat = "High Risk"
        else:
            risk_cat = "Critical Risk"
            
        # Extract risk factors contributing to default risk
        risk_factors = []
        if borrower_data.get("DTIRatio", 0) > 0.45:
            risk_factors.append("High Debt-to-Income (DTI) ratio exceeding 45%")
        if borrower_data.get("CreditScore", 850) < 600:
            risk_factors.append("Subprime Credit Score below 600")
        if borrower_data.get("InterestRate", 0) > 15.0:
            risk_factors.append("Elevated loan interest rate above 15%")
        if borrower_data.get("EmploymentType") in ["Unemployed", "Part-time"]:
            risk_factors.append("Unstable employment status")
        if borrower_data.get("HasCoSigner") == "No":
            risk_factors.append("Absence of a loan co-signer")
            
        if not risk_factors and prob_default < 0.25:
            risk_factors.append("Strong financial profile with solid credit and income ratio")
            
        return {
            "default_probability": round(prob_default, 4),
            "default_probability_percentage": f"{round(prob_default * 100, 2)}%",
            "predicted_class": pred_class,
            "predicted_label": "Default" if pred_class == 1 else "No Default",
            "risk_category": risk_cat,
            "risk_factors": risk_factors
        }
        
def evaluate_probability_model():
    """
    Evaluates probability calibration & quality metrics on test set.
    """
    os.makedirs(RESULTS_DIR, exist_ok=True)
    predictor = LoanDefaultPredictor()
    
    if not predictor.is_ready():
        print("[PREDICTOR] Artifacts not found. Skipping evaluation.")
        return
        
    df_test = pd.read_csv(os.path.join(PROCESSED_DIR, "test.csv"))
    X_test = df_test.drop(columns=["Default"])
    y_test = df_test["Default"]
    
    probs = predictor.model.predict_proba(X_test)[:, 1]
    
    brier = brier_score_loss(y_test, probs)
    auc = roc_auc_score(y_test, probs)
    loss = log_loss(y_test, probs)
    
    metrics = {
        "ROC_AUC": round(float(auc), 4),
        "Log_Loss": round(float(loss), 4),
        "Brier_Score": round(float(brier), 4),
        "Calibration_Quality": "Excellent" if brier < 0.15 else "Moderate"
    }
    
    with open(os.path.join(RESULTS_DIR, "prediction_evaluation.json"), "w") as f:
        json.dump(metrics, f, indent=4)
        
    print(f"[PREDICTOR] Evaluated Probabilistic Model: ROC-AUC: {auc:.4f}, Brier Score: {brier:.4f}")
    return metrics

if __name__ == "__main__":
    predictor = LoanDefaultPredictor()
    sample = {
        "Age": 32, "Income": 45000, "LoanAmount": 120000, "CreditScore": 560,
        "MonthsEmployed": 12, "NumCreditLines": 3, "InterestRate": 18.5, "LoanTerm": 36,
        "DTIRatio": 0.58, "Education": "High School", "EmploymentType": "Part-time",
        "MaritalStatus": "Single", "HasMortgage": "No", "HasDependents": "Yes",
        "LoanPurpose": "Other", "HasCoSigner": "No"
    }
    res = predictor.predict_borrower_risk(sample)
    print("Sample Risk Scoring Result:\n", json.dumps(res, indent=4))
