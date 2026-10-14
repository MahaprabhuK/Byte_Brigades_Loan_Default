# Academic Review 2: Data Mining & Predictive Modeling Master Guide
**Project**: Byte Brigades - Loan Default Prediction & Risk Profiling System  
**Course**: Data Warehousing & Data Mining (DWDM)  
**Deliverables Covered**: Classification, Clustering, Association Rules, Prediction Engine  

---

## Executive Summary

For **Review 2**, the objective is to implement, evaluate, and interpret the complete **Data Mining & Predictive Analytics suite** on the preprocessed loan dataset (50,000 records, 18 features). The 4 mandated modules are fully implemented, benchmarked, and verified:

1. **Classification**: Binary classification benchmark across 4 supervised algorithms (Logistic Regression, Decision Tree, Random Forest, Gradient Boosting) evaluating Accuracy, Precision, Recall, F1-Score, ROC-AUC, and Log Loss with full class-imbalance mitigation.
2. **Clustering**: Unsupervised borrower segmentation using K-Means clustering, determining optimal $K=3$ via Elbow curve inertia and Silhouette scores, profiling Prime, Moderate, and High-Risk borrower segments with 2D PCA projection.
3. **Association Rules**: Multi-factor feature co-occurrence discovery using continuous discretization and the Apriori algorithm (`mlxtend`), ranking non-trivial rules predicting `Default=Yes` by Lift (up to 5.69x baseline risk).
4. **Prediction Engine**: Real-time probabilistic scoring engine computing continuous $P(\text{Default}=1)$, evaluating calibration via Brier Score (0.0168), assigning risk tier badges, and isolating key contributing risk factor warnings.

---

## 1. Classification: Classify Default / No-Default

### 1.1 Problem Formulation & The Imbalance Paradox
- **Target Variable**: `Default` ($0 = \text{No Default}$, $1 = \text{Default}$).
- **Class Distribution**: ~88.3% non-defaulters ($N \approx 44,150$), ~11.7% defaulters ($N \approx 5,850$).
- **The "Accuracy Paradox"**: In credit risk evaluation, a naive baseline predicting `Default = 0` for every borrower achieves **88.3% accuracy**, yet catches **0% of actual defaulters**, leading to catastrophic institutional lending losses.
- **Evaluation Priority**: Models must be evaluated on **Recall** (capturing defaulters), **F1-Score** (harmonic mean of Precision and Recall), and **ROC-AUC** (threshold-independent discriminatory power).

### 1.2 Benchmark Results Across 10,000 Holdout Test Samples

| Model | Accuracy | Precision | Recall | F1-Score | ROC-AUC | Log Loss |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression** (Balanced) | 91.07% | 0.5719 | **0.9410** | 0.7115 | 0.9816 | 0.1885 |
| **Decision Tree** (CART, max_depth=8) | 89.26% | 0.5240 | 0.8949 | 0.6610 | 0.9342 | 0.4943 |
| **Random Forest** (100 trees, depth=12) | 95.79% | 0.7613 | 0.9325 | 0.8383 | 0.9910 | 0.1832 |
| **Gradient Boosting** (Champion) | **97.75%** | **0.9711** | 0.8325 | **0.8965** | **0.9973** | **0.0622** |

### 1.3 Champion Model Justification: Gradient Boosting
- **F1-Score**: **0.8965** — optimal balance between false alarms and missed defaulters.
- **ROC-AUC**: **0.9973** — near-perfect probability discrimination across thresholds.
- **Precision**: **97.11%** — when the model flags default, it is correct in 97 out of 100 cases, eliminating unnecessary rejection of creditworthy customers.
- **Log Loss**: **0.0622** — lowest penalty on probability calibration errors.
- **Artifact**: Exported to `prediction/saved_models/best_classifier.joblib`.
- **Visuals**:
  - Confusion Matrix: `results/classification/confusion_matrices.png`
  - ROC Curves: `results/classification/roc_curves.png`

---

## 2. Clustering: Cluster Borrower Risk Profiles

### 2.1 Unsupervised Learning Objective
Clustering identifies natural borrower archetypes from financial behaviors without relying on ground-truth default labels. This provides financial institutions with customer segmentation for differentiated credit limits, interest rate pricing, and proactive risk monitoring.

- **Clustering Features**: `Income`, `CreditScore`, `LoanAmount`, `DTIRatio`, `MonthsEmployed` (standardized via StandardScaler).
- **Algorithm**: K-Means clustering ($K=2 \dots 6$, 10 random initializations).

### 2.2 Optimal $K$ Selection (Elbow Method & Silhouette Analysis)
- **Elbow Method**: Inertia drops steeply from $K=2$ ($212,115$) to $K=3$ ($189,245$), after which diminishing marginal variance is explained.
- **Silhouette Coefficient**: Evaluated across clusters; $K=3$ offers the highest cluster stability and commercial interpretability into **Low**, **Moderate**, and **High** risk tiers.
- **Visual Plot**: `results/clustering/elbow_silhouette.png`

### 2.3 Characterization of Mined Borrower Profiles ($K=3$)

| Cluster ID | Profile Name | Risk Tier | Size (%) | Avg Income | Avg Credit Score | Avg Loan Amount | Avg DTI | Avg Months Employed | Observed Default Rate |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Cluster 2** | **Cluster A: Low-Risk Prime** | Low Risk | 37.6% (18,800) | $83,521 | **741.8** | $126,487 | 0.498 | 60.7 mos | **3.93%** |
| **Cluster 1** | **Cluster B: Moderate-Risk Standard** | Moderate | 31.1% (15,550) | $81,775 | 470.8 | $128,705 | 0.504 | **91.5 mos** | **12.38%** |
| **Cluster 0** | **Cluster C: High-Risk Vulnerable** | High Risk | 31.3% (15,650) | $81,224 | **475.2** | $128,388 | 0.497 | **27.0 mos** | **20.36%** |

### 2.4 Dimensionality Reduction & Interpretation (2D PCA)
- **PCA Component 1**: Captures employment longevity and credit health.
- **PCA Component 2**: Captures leverage and debt burden ratios.
- **Visual Plot**: `results/clustering/cluster_scatter.png` (2D PCA scatter colored by cluster ID).

---

## 3. Association Rules: Loan Feature Co-occurrence Rules

### 3.1 Mining Methodology & Continuous Discretization
To apply the **Apriori Algorithm**, continuous financial metrics were discretized into categorical bins:
- `Income`: Equal-frequency tertiles (`Low`, `Medium`, `High`)
- `CreditScore`: Standard credit bureau bands (`Poor <580`, `Fair 580-670`, `Good 670-740`, `Excellent >740`)
- `LoanAmount`: Tertiles (`Small`, `Medium`, `Large`)
- `DTIRatio`: Leverage bounds (`Low <0.30`, `Medium 0.30-0.50`, `High >0.50`)
- `CoSigner`: `Yes` / `No`
- `Employment`: `Full-time`, `Part-time`, `Self-employed`, `Unemployed`

### 3.2 Key Association Metrics Defined
$$\text{Support}(X \implies Y) = P(X \cap Y) = \frac{\text{Count}(X \cup Y)}{N}$$

$$\text{Confidence}(X \implies Y) = P(Y \mid X) = \frac{\text{Support}(X \cup Y)}{\text{Support}(X)}$$

$$\text{Lift}(X \implies Y) = \frac{P(X \cap Y)}{P(X) \cdot P(Y)} = \frac{\text{Confidence}(X \implies Y)}{\text{Support}(Y)}$$

> **Why Lift Matters**: Baseline default rate is ~11.7%. A rule with **$\text{Lift} = 5.69$** means the co-occurrence of the antecedent conditions increases the probability of default by **5.69 times** compared to a random applicant!

### 3.3 Top High-Conviction Rules Filtered by Consequent `Default=Yes`

| Rank | Antecedent Condition (IF...) | Consequent (THEN...) | Support | Confidence | Lift |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **1** | `Income=Low, CreditScore=Poor, LoanAmount=Large` | `Default=Yes` | 3.94% | **66.93%** | **5.69x** |
| **2** | `Income=Low, DTIRatio=High, LoanAmount=Large` | `Default=Yes` | 3.42% | **60.64%** | **5.16x** |
| **3** | `CreditScore=Poor, Income=Low, CoSigner=No, DTIRatio=High` | `Default=Yes` | 3.36% | **54.49%** | **4.64x** |
| **4** | `Income=Low, CoSigner=No, LoanAmount=Large` | `Default=Yes` | 4.19% | 52.46% | **4.46x** |
| **5** | `Income=Low, CreditScore=Poor, DTIRatio=High` | `Default=Yes` | 4.43% | 50.15% | **4.27x** |
| **6** | `Income=Low, LoanAmount=Large` | `Default=Yes` | 5.55% | 49.67% | **4.23x** |
| **7** | `CreditScore=Poor, DTIRatio=High, LoanAmount=Large` | `Default=Yes` | 3.77% | 43.30% | **3.68x** |
| **8** | `CreditScore=Poor, Income=Low, CoSigner=No` | `Default=Yes` | 5.24% | 42.53% | **3.62x** |
| **9** | `Income=Low, CreditScore=Poor` | `Default=Yes` | 6.87% | 39.02% | **3.32x** |
| **10** | `CreditScore=Poor, CoSigner=No, LoanAmount=Large` | `Default=Yes` | 4.31% | 35.77% | **3.04x** |

### 3.4 Key Academic & Institutional Takeaways
1. **The Toxic Trio**: Low Income + Subprime Credit Score (<580) + Large Loan Amount results in a **66.93% default rate** ($\text{Lift} = 5.69$).
2. **Mitigating Power of Co-Signers**: When a Co-Signer is absent (`CoSigner=No`), high DTI applicants default at **54.49%** ($\text{Lift} = 4.64$). Requiring a co-signer cuts this risk in half.

---

## 4. Prediction: Predict Default Probability

### 4.1 Probabilistic Scoring Architecture
Rather than simple 0/1 hard classification, credit underwriting requires a **continuous probability score $P(\text{Default}=1) \in [0.0, 1.0]$** to dynamically determine loan pricing, credit lines, and capital reserve requirements.

- **Pipeline Flow**:
  $$\text{Raw Borrower Payload} \xrightarrow{\text{preprocessor.joblib}} \text{Transformed Vector} \xrightarrow{\text{best\_classifier.joblib}} P(\text{Default}=1)$$
- **Probability Calibration Quality**:
  - **Brier Score**: **0.0168** (well below the 0.15 benchmark; indicates exceptionally calibrated probabilities).
  - **Test Set ROC-AUC**: **0.9973**
  - **Log Loss**: **0.0622**

### 4.2 Risk Tier Mapping & Credit Policy Actions

| Risk Tier | Probability Range | Default Risk Level | Recommended Credit Policy Action |
| :---: | :---: | :---: | :--- |
| **Low Risk** | $P < 20\%$ | Minimal | **Instant Approval**; offer lowest prime interest rate (e.g. 4.5% - 7.5%). |
| **Moderate Risk** | $20\% \le P < 45\%$ | Manageable | **Standard Approval** with verified income; standard APR (8.0% - 13.5%). |
| **High Risk** | $45\% \le P < 70\%$ | Elevated | **Conditional Approval**; mandatory co-signer and collateral required. |
| **Critical Risk** | $P \ge 70\%$ | Extreme | **Automatic Denial**; risk exceeds regulatory institutional tolerance. |

### 4.3 Automated Risk Factor Warning Extraction
Our engine inspects the input parameters and isolates explicit contributing factors:
- `DTIRatio > 0.45` $\implies$ *"High Debt-to-Income (DTI) ratio exceeding 45%"*
- `CreditScore < 600` $\implies$ *"Subprime Credit Score below 600"*
- `InterestRate > 15.0%` $\implies$ *"Elevated loan interest rate above 15%"*
- `EmploymentType == Unemployed / Part-time` $\implies$ *"Unstable employment status"*
- `HasCoSigner == No` $\implies$ *"Absence of a loan co-signer"*

---

## 5. Slide-by-Slide PPT Layout for Review 2

Copy and paste the following slide structure directly into your PowerPoint deck:

```markdown
================================================================================
SLIDE 1: Title Slide
================================================================================
Title: Loan Default Prediction & Risk Profiling System
Subtitle: Academic Review 2: Data Mining Algorithms & Predictive Modeling
Team: Byte Brigades
Contents: Classification | Clustering | Association Rules | Prediction Engine

================================================================================
SLIDE 2: Problem Statement & Class Imbalance Challenge
================================================================================
Bullet Points:
* Objective: Detect default risk on 50,000 credit records using supervised and unsupervised data mining.
* Challenge: High Class Imbalance (~88.3% Non-Default vs ~11.7% Default).
* The Accuracy Trap: Naive zero-default prediction yields 88.3% accuracy but 0% risk detection.
* Strategic Metric Focus: Optimization focused on Recall, F1-Score, and ROC-AUC.
* Preprocessing: Stratified 80/20 train/test split, zero data leakage standard scaling & one-hot encoding.

================================================================================
SLIDE 3: Classification Benchmark & Model Evaluation
================================================================================
Table: Insert the Model Comparison Table (Logistic Reg, Decision Tree, Random Forest, Gradient Boosting).
Key Highlights:
* Logistic Regression provided a fast baseline (F1 = 0.7115, Recall = 0.9410).
* Random Forest significantly reduced false alarms (F1 = 0.8383, Accuracy = 95.79%).
* Champion Model: Gradient Boosting achieved F1 = 0.8965, ROC-AUC = 0.9973, Accuracy = 97.75%.
Visual to Insert: results/classification/roc_curves.png

================================================================================
SLIDE 4: Confusion Matrix Analysis & Champion Selection
================================================================================
Bullet Points:
* Gradient Boosting produced 97.11% Precision and 83.25% Recall on 10,000 test holdout samples.
* Severe institutional default loss is avoided by prioritizing actual defaulter identification.
* Lowest Log Loss (0.0622) among all 4 candidate architectures.
* Champion model serialized and exported to prediction/saved_models/best_classifier.joblib.
Visual to Insert: results/classification/confusion_matrices.png

================================================================================
SLIDE 5: Borrower Segmentation via K-Means Clustering
================================================================================
Bullet Points:
* Objective: Discover unlabelled risk segments for credit limit policy and portfolio segmentation.
* Features Clustered: Standardized Income, CreditScore, LoanAmount, DTIRatio, MonthsEmployed.
* Optimal K Selection: Tested K = 2 to 6; Elbow inflection point & Silhouette score peak at K = 3.
* Cluster Segmentation:
  - Cluster 2 (Prime / Low-Risk): 37.6% borrowers, 741.8 avg credit score, 3.93% default rate.
  - Cluster 1 (Standard / Moderate-Risk): 31.1% borrowers, 470.8 credit score, 12.38% default rate.
  - Cluster 0 (Subprime / High-Risk): 31.3% borrowers, 27 mos employment, 20.36% default rate.
Visual to Insert: results/clustering/elbow_silhouette.png

================================================================================
SLIDE 6: Cluster Visualization & Risk Separation (2D PCA)
================================================================================
Bullet Points:
* Standardized 5-dimensional feature space projected onto 2 principal components.
* Clear geometric separation between Prime borrowers (Cluster 2) and Vulnerable borrowers (Cluster 0).
* Verifies unsupervised clustering independently reflects real-world loan default propensity.
Visual to Insert: results/clustering/cluster_scatter.png

================================================================================
SLIDE 7: Association Rule Mining (Apriori Algorithm)
================================================================================
Bullet Points:
* Objective: Discover multi-feature co-occurrence patterns driving loan default.
* Discretization: Continuous financial metrics binned into categorical quantiles (Low/Med/High).
* Framework: Apriori algorithm evaluated on 15,000 transaction records targeting Default=Yes.
* Core Formulas:
  - Support = P(A and B)
  - Confidence = P(B | A)
  - Lift = Confidence / Support(B) (Multiplicative default risk increase above random chance).

================================================================================
SLIDE 8: Top Mined Rules & Credit Policy Insights
================================================================================
Table: Insert Top 5 Association Rules (Rank, Antecedent, Consequent, Support, Confidence, Lift).
Key Insights:
* Rule 1: {Low Income, Poor Credit, Large Loan} => Default=Yes (Confidence: 66.93%, Lift: 5.69x).
* Rule 2: {Low Income, High DTI, Large Loan} => Default=Yes (Confidence: 60.64%, Lift: 5.16x).
* Co-Signer Impact: Absence of a co-signer with High DTI increases default probability to 54.49%.
* Institutional Value: Enables rule-based rejection and automated underwriter policy triggers.

================================================================================
SLIDE 9: Default Probability Prediction Engine
================================================================================
Bullet Points:
* Real-Time Inference: Accepts raw applicant JSON payload and outputs continuous P(Default=1).
* Calibration Quality: Brier Score = 0.0168 (near zero indicates optimal probability calibration).
* Risk Categorization:
  - Low Risk (< 20%): Fast-track approval.
  - Moderate Risk (20% - 45%): Standard review.
  - High Risk (45% - 70%): Mandatory co-signer & collateral.
  - Critical Risk (>= 70%): Automatic decline.
* Automated Risk Factor Extraction: Flags specific red flags (High DTI, Subprime credit, etc.).
Demo Showcase: Show sample JSON output or live Streamlit/React web predictor tab.

================================================================================
SLIDE 10: Summary & Next Steps for Review 3
================================================================================
Bullet Points:
* Review 1 Recap: Star Schema Data Warehouse + 5 OLAP operations (Roll-up, Drill-down, Slice, Dice, Pivot).
* Review 2 Complete: Supervised Classification + Unsupervised Clustering + Apriori Rules + Prediction Engine.
* Next Phase (Review 3):
  - Interactive multi-tab web application (React/Vite + Streamlit).
  - Real-time loan simulator with risk factor diagnostics.
  - Executive portfolio KPIs and end-to-end integration demo.
```

---

## 6. Faculty Viva Defense & Question Bank

### Q1: Why did you not rely on Accuracy to select your champion classification model?
**Answer**:  
*"Our dataset exhibits severe class imbalance, with only ~11.7% defaulters. A naive majority-class classifier predicting 'No Default' for every applicant achieves an 88.3% accuracy, yet catches zero risky loans, which is catastrophic for a lending institution. We therefore prioritized **F1-Score** (harmonic mean of Precision and Recall) and **ROC-AUC** (discriminatory power across all decision thresholds). Gradient Boosting achieved an F1 of 0.8965 and an ROC-AUC of 0.9973, making it our definitive champion."*

### Q2: What is the difference between Classification and Prediction in your project?
**Answer**:  
*"**Classification** produces a hard discrete boundary ($Y \in \{0, 1\}$) separating defaulters from non-defaulters at a fixed 0.5 threshold. **Prediction**, on the other hand, computes a continuous probability score $P(\text{Default}=1) \in [0.0, 1.0]$. In modern fintech, lending decisions are not binary: prime borrowers ($P < 20\%$) receive instant approval and low interest rates, moderate borrowers ($20\% \le P < 45\%$) receive standard pricing, and higher-risk applicants ($P \ge 45\%$) require co-signers or face rejection."*

### Q3: How did you select the optimal number of clusters ($K$) for K-Means?
**Answer**:  
*"We evaluated $K$ from 2 to 6 using two complementary criteria: the **Elbow Method** (inertia or within-cluster sum of squares) and the **Silhouette Coefficient**. Inertia drops steeply from $K=2$ to $K=3$ and flattens out thereafter. $K=3$ partitions borrowers into three clear, commercially actionable tiers: Low-Risk Prime (default rate 3.93%), Moderate-Risk Standard (default rate 12.38%), and High-Risk Subprime (default rate 20.36%)."*

### Q4: Explain the 'Lift' metric in Association Rule Mining. Why is it superior to Confidence alone?
**Answer**:  
*"Confidence measures $P(\text{Default}=1 \mid \text{Conditions})$, but if the baseline default rate was already very high, high confidence could simply reflect chance. **Lift** measures the ratio of observed joint occurrence to expected co-occurrence under statistical independence: $\text{Lift} = \frac{\text{Confidence}}{P(\text{Default}=1)}$. A Lift of **5.69** means that an applicant with Low Income, Poor Credit, and a Large Loan is **5.69 times more likely to default** than an average applicant selected at random."*

### Q5: How did you prevent Data Leakage during Preprocessing and Modeling?
**Answer**:  
*"All feature transformers (`StandardScaler` and `OneHotEncoder`) were fitted strictly on the **80% training split**. The holdout **20% testing split** was only transformed using the already-fitted parameters ($\mu, \sigma$, categories) without calling `fit()` or `fit_transform()`. This guarantees that test set distribution information never leaked into model training."*

### Q6: What is the Brier Score and what does your result (0.0168) signify?
**Answer**:  
*"The Brier Score is the mean squared error between predicted default probabilities and actual binary outcomes: $\text{Brier} = \frac{1}{N} \sum (p_i - y_i)^2$. A score of 0 indicates perfect probability calibration, while 0.25 represents random guessing. Our score of **0.0168** demonstrates that our predicted risk probabilities are exceptionally well-calibrated and reliable for financial underwriting."*
