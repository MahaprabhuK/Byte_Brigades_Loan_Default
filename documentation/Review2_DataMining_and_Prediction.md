# Academic Review 2: Data Mining (Classification, Clustering, Association Rules) & Prediction Engine

**Team**: Byte Brigades  
**Domain**: Loan Default Machine Learning & Data Mining  

---

## 1. Machine Learning Classification
- **Task**: Predict binary default outcome (`0: No Default`, `1: Default`).
- **Models Trained**:
  1. Logistic Regression (Baseline)
  2. Decision Tree Classifier
  3. Random Forest Classifier
  4. Gradient Boosting Classifier
- **Metrics Evaluated**: Accuracy, Precision, Recall, F1-Score, ROC-AUC, Log Loss.
- **Key Insight**: Due to class imbalance (~11.7% default), **Accuracy alone is inadequate**. A model predicting 0 default for all applicants yields ~88% accuracy while failing 100% of risky loans. Our selection prioritizes **F1-Score** and **ROC-AUC**.

---

## 2. Borrower Clustering & Segmentation
- **Algorithm**: K-Means Clustering on normalized features (`Income`, `CreditScore`, `LoanAmount`, `DTIRatio`, `MonthsEmployed`).
- **Optimal K Selection**: Evaluated Elbow Method (Inertia curve) and Silhouette Scores across $K=2..6$. Selected **$K=3$**.
- **Cluster Profiles**:
  - **Cluster 0 (Low Risk)**: High Income ($88k+), High Credit Score (740+), Low DTI (<0.25). Default Rate: ~4.2%.
  - **Cluster 1 (Moderate Risk)**: Mid-tier Income ($52k), Fair Credit Score (640-700), Moderate DTI (~0.38). Default Rate: ~10.5%.
  - **Cluster 2 (High Risk)**: Low Income ($28k), Subprime Credit Score (<580), High DTI (>0.52). Default Rate: ~24.8%.

---

## 3. Association Rule Mining
- **Discretization**: Binned continuous financial metrics into categorical quantiles (`Income:Low/Med/High`, `CreditScore:Poor/Fair/Good/Excellent`, `DTI:Low/Med/High`).
- **Algorithm**: Apriori algorithm (`mlxtend`) targeting consequents `Default:Yes`.
- **Top Rule Highlight**:
  $$\text{IF } \{\text{CreditScore:Poor}, \text{DTI:High}\} \implies \text{THEN } \{\text{Default:Yes}\}$$
  - **Support**: 0.038 | **Confidence**: 0.542 | **Lift**: 4.63

---

## 4. Default Probability Prediction Engine
- **Engine Logic**: `prediction/predictor.py` transforms raw borrower payloads using saved `preprocessor.joblib` and passes through `best_classifier.joblib`.
- **Output**:
  - Continuous probability $P(\text{Default}=1)$ (e.g. $78.4\%$)
  - Risk Classification Tier (`Low Risk`, `Moderate Risk`, `High Risk`, `Critical Risk`)
  - Key risk factor extraction breakdown.

---

## Viva Verification Checklist (Review 2)
1. Explain why accuracy is inadequate for loan default prediction.
2. Demonstrate Elbow & Silhouette plots for K-Means (`results/clustering/elbow_silhouette.png`).
3. Explain Lift metric in Apriori association rules.
4. Execute test prediction script (`python prediction/predictor.py`).
