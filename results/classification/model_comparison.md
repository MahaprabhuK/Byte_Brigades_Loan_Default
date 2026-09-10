# Classification Benchmark & Model Evaluation Report - Byte Brigades

## Imbalance Sensitivity Analysis
In financial credit risk modeling, loan default datasets are inherently imbalanced (typically ~10-15% default rate). 
**Accuracy alone is a misleading metric**: a naive classifier predicting zero defaults for all borrowers would achieve 88%+ accuracy while completely failing to detect risky loans, leading to severe institutional credit losses. 
Therefore, our evaluation prioritizes **Recall** (capturing actual defaulters), **F1-Score** (harmonic mean of Precision & Recall), and **ROC-AUC** (discriminatory capability across probability thresholds).

## Model Comparison Table
|                     |   Accuracy |   Precision |   Recall |   F1_Score |   ROC_AUC |   Log_Loss |
|:--------------------|-----------:|------------:|---------:|-----------:|----------:|-----------:|
| Logistic Regression |     0.9107 |      0.5719 |   0.941  |     0.7115 |    0.9816 |     0.1885 |
| Decision Tree       |     0.8926 |      0.524  |   0.8949 |     0.661  |    0.9342 |     0.4943 |
| Random Forest       |     0.9579 |      0.7613 |   0.9325 |     0.8383 |    0.991  |     0.1832 |
| Gradient Boosting   |     0.9775 |      0.9711 |   0.8325 |     0.8965 |    0.9973 |     0.0622 |

## Selected Best Model
- **Champion Model**: `Gradient Boosting`
- **F1-Score**: `0.8965`
- **ROC-AUC**: `0.9973`
- **Recall**: `0.8325`
- **Accuracy**: `0.9775`

Saved model artifact to `prediction/saved_models/best_classifier.joblib`.
