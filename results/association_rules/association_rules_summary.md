# Association Rule Mining Report - Byte Brigades

## Mining Methodology
- **Continuous Discretization**: Binned numerical variables (`Income`, `CreditScore`, `LoanAmount`, `DTIRatio`) into categorical quantiles.
- **Target Outcome**: Consequent = `Default=Yes`
- **Ranking Metric**: Sorted by **Lift** (measuring how much more often antecedent and consequent occur together than expected by chance).

## Top Ranked Default Risk Rules
| antecedents_str                                          | consequents_str               |   support |   confidence |   lift |
|:---------------------------------------------------------|:------------------------------|----------:|-------------:|-------:|
| Income=Low, CreditScore=Poor, LoanAmount=Large           | Default=Yes                   |    0.0394 |       0.6693 | 5.6946 |
| Income=Low, DTIRatio=High, LoanAmount=Large              | Default=Yes                   |    0.0342 |       0.6064 | 5.1592 |
| CreditScore=Poor, Income=Low, CoSigner=No, DTIRatio=High | Default=Yes                   |    0.0336 |       0.5449 | 4.6358 |
| Income=Low, CoSigner=No, LoanAmount=Large                | Default=Yes                   |    0.0419 |       0.5246 | 4.4638 |
| Income=Low, CreditScore=Poor, DTIRatio=High              | Default=Yes                   |    0.0443 |       0.5015 | 4.2669 |
| Income=Low, LoanAmount=Large                             | Default=Yes                   |    0.0555 |       0.4967 | 4.2262 |
| CreditScore=Poor, Income=Low, DTIRatio=High              | Default=Yes, CoSigner=No      |    0.0336 |       0.3801 | 4.0899 |
| Income=Low, LoanAmount=Large                             | Default=Yes, CoSigner=No      |    0.0419 |       0.3745 | 4.0295 |
| Income=Low, LoanAmount=Large                             | Default=Yes, DTIRatio=High    |    0.0342 |       0.3059 | 3.7642 |
| CreditScore=Poor, DTIRatio=High, LoanAmount=Large        | Default=Yes                   |    0.0377 |       0.433  | 3.6836 |
| Income=Low, LoanAmount=Large                             | Default=Yes, CreditScore=Poor |    0.0394 |       0.3524 | 3.6812 |
| CreditScore=Poor, Income=Low, CoSigner=No                | Default=Yes                   |    0.0524 |       0.4253 | 3.6188 |
| Income=Low, CreditScore=Poor                             | Default=Yes                   |    0.0687 |       0.3902 | 3.3195 |
| Income=Low, CoSigner=No, DTIRatio=High                   | Default=Yes                   |    0.0445 |       0.378  | 3.2165 |
| CreditScore=Poor, CoSigner=No, LoanAmount=Large          | Default=Yes                   |    0.0431 |       0.3577 | 3.0434 |

## Key Academic Insights
1. **High DTI combined with Poor Credit Score** and **Low Income** exhibits the highest **Lift** (> 3.5), multiplying default probability over 3-5x compared to baseline.
2. Large Loan Amount in combination with absence of a Co-Signer significantly drives default co-occurrence.
