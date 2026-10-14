# Borrower Segmentation & Clustering Report - Byte Brigades

## Optimal Cluster Selection Analysis
- **Evaluated K Range**: 2 to 6
- **Selected K**: `K = 3`
- **Evaluation Criteria**: Elbow Method curve stabilization & Silhouette Score optimization.

## Cluster Profile Characterization
|   ClusterID | ProfileName                                 | RiskTier      |   BorrowerCount |   Percentage |   AvgIncome |   AvgCreditScore |   AvgLoanAmount |   AvgDTIRatio |   AvgMonthsEmployed |   DefaultRate_Pct |
|------------:|:--------------------------------------------|:--------------|----------------:|-------------:|------------:|-----------------:|----------------:|--------------:|--------------------:|------------------:|
|           0 | Cluster C: High-Risk Vulnerable Borrowers   | High Risk     |           15650 |         31.3 |     81224.3 |           475.24 |          128388 |         0.497 |                27   |             20.36 |
|           1 | Cluster B: Moderate-Risk Standard Borrowers | Moderate Risk |           15550 |         31.1 |     81775.2 |           470.77 |          128705 |         0.504 |                91.5 |             12.38 |
|           2 | Cluster A: Low-Risk Prime Borrowers         | Low Risk      |           18800 |         37.6 |     83521   |           741.8  |          126487 |         0.498 |                60.7 |              3.93 |

## Interpretation & Risk Segmentation
- **Cluster 0 (High Risk)**: Cluster C: High-Risk Vulnerable Borrowers - Borrowers average $81,224 income, 475.24 credit score, and a DTI ratio of 0.497. Observed Default Rate: **20.36%**.
- **Cluster 1 (Moderate Risk)**: Cluster B: Moderate-Risk Standard Borrowers - Borrowers average $81,775 income, 470.77 credit score, and a DTI ratio of 0.504. Observed Default Rate: **12.38%**.
- **Cluster 2 (Low Risk)**: Cluster A: Low-Risk Prime Borrowers - Borrowers average $83,521 income, 741.8 credit score, and a DTI ratio of 0.498. Observed Default Rate: **3.93%**.
