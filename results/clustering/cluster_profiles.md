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

## Interpretation
- **Cluster 0**: Higher income and credit score with lower DTI ratio, resulting in the lowest default probability.
- **Cluster 1**: Moderate financial standing across average credit score and income bounds.
- **Cluster 2**: Characterized by elevated DTI ratio and lower credit score, exhibiting a significantly higher default risk rate.
