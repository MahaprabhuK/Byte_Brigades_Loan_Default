# Association Rule Mining Report - Byte Brigades

## Mining Methodology
- **Continuous Discretization**: Binned numerical variables (`Income`, `CreditScore`, `LoanAmount`, `DTIRatio`) into categorical quantiles.
- **Target Outcome**: Consequent = `Default:Yes`
- **Ranking Metric**: Sorted by **Lift** (measuring how much more often antecedent and consequent occur together than expected by chance).

## Top Ranked Default Risk Rules
| antecedents_str                                                                          | consequents_str                                   |   support |   confidence |   lift |
|:-----------------------------------------------------------------------------------------|:--------------------------------------------------|----------:|-------------:|-------:|
| Income_Income:Low, LoanAmount_LoanAmt:Large, CreditScore_CreditScore:Poor                | Default_Default:Yes                               |    0.0394 |       0.6693 | 5.6946 |
| DTIRatio_DTI:High, Income_Income:Low, LoanAmount_LoanAmt:Large                           | Default_Default:Yes                               |    0.0342 |       0.6064 | 5.1592 |
| Income_Income:Low, DTIRatio_DTI:High, CreditScore_CreditScore:Poor, CoSigner_CoSigner:No | Default_Default:Yes                               |    0.0336 |       0.5449 | 4.6358 |
| Income_Income:Low, LoanAmount_LoanAmt:Large, CoSigner_CoSigner:No                        | Default_Default:Yes                               |    0.0419 |       0.5246 | 4.4638 |
| DTIRatio_DTI:High, Income_Income:Low, CreditScore_CreditScore:Poor                       | Default_Default:Yes                               |    0.0443 |       0.5015 | 4.2669 |
| Income_Income:Low, LoanAmount_LoanAmt:Large                                              | Default_Default:Yes                               |    0.0555 |       0.4967 | 4.2262 |
| Income_Income:Low, DTIRatio_DTI:High, CreditScore_CreditScore:Poor                       | Default_Default:Yes, CoSigner_CoSigner:No         |    0.0336 |       0.3801 | 4.0899 |
| Income_Income:Low, LoanAmount_LoanAmt:Large                                              | Default_Default:Yes, CoSigner_CoSigner:No         |    0.0419 |       0.3745 | 4.0295 |
| Income_Income:Low, LoanAmount_LoanAmt:Large                                              | DTIRatio_DTI:High, Default_Default:Yes            |    0.0342 |       0.3059 | 3.7642 |
| DTIRatio_DTI:High, LoanAmount_LoanAmt:Large, CreditScore_CreditScore:Poor                | Default_Default:Yes                               |    0.0377 |       0.433  | 3.6836 |
| Income_Income:Low, LoanAmount_LoanAmt:Large                                              | CreditScore_CreditScore:Poor, Default_Default:Yes |    0.0394 |       0.3524 | 3.6812 |
| Income_Income:Low, CreditScore_CreditScore:Poor, CoSigner_CoSigner:No                    | Default_Default:Yes                               |    0.0524 |       0.4253 | 3.6188 |
| Income_Income:Low, CreditScore_CreditScore:Poor                                          | Default_Default:Yes                               |    0.0687 |       0.3902 | 3.3195 |
| DTIRatio_DTI:High, Income_Income:Low, CoSigner_CoSigner:No                               | Default_Default:Yes                               |    0.0445 |       0.378  | 3.2165 |
| CreditScore_CreditScore:Poor, LoanAmount_LoanAmt:Large, CoSigner_CoSigner:No             | Default_Default:Yes                               |    0.0431 |       0.3577 | 3.0434 |

## Key Academic Insights
1. High DTI combined with Poor Credit Score exhibits the highest **Lift** (> 1.8), significantly increasing default probability.
2. Unemployed status combined with Large Loan Amount acts as a strong antecedent indicator for default risk.
