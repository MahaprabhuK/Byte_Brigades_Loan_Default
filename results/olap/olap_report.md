# OLAP Operations Execution Summary - Byte Brigades

## 1. Roll-up Operation (Borrower Level -> Age Group & Education Aggregation)
| AgeGroup   | Education   |   TotalLoans |   DefaultCount |   DefaultRate_Pct |   AvgLoanAmount |   AvgIncome |   AvgCreditScore |
|:-----------|:------------|-------------:|---------------:|------------------:|----------------:|------------:|-----------------:|
| 18-24      | Bachelor's  |         2249 |            276 |             12.27 |          127959 |     81912.5 |           579.15 |
| 18-24      | High School |         2709 |            338 |             12.48 |          129264 |     81040.6 |           576.19 |
| 18-24      | Master's    |         1188 |            140 |             11.78 |          124941 |     80933.6 |           567.19 |
| 18-24      | PhD         |          470 |             43 |              9.15 |          127992 |     81293.7 |           573.19 |
| 25-34      | Bachelor's  |         3365 |            402 |             11.95 |          130429 |     82512.6 |           572.73 |
| 25-34      | High School |         3956 |            485 |             12.26 |          127094 |     82239.4 |           573.52 |
| 25-34      | Master's    |         1767 |            204 |             11.54 |          126524 |     82743.5 |           577.92 |
| 25-34      | PhD         |          679 |             63 |              9.28 |          125210 |     80455   |           559.54 |
| 35-49      | Bachelor's  |         5032 |            583 |             11.59 |          128021 |     82948.6 |           573.77 |
| 35-49      | High School |         5812 |            679 |             11.68 |          128072 |     81758   |           573.03 |
| 35-49      | Master's    |         2653 |            318 |             11.99 |          128581 |     81830.1 |           572.53 |
| 35-49      | PhD         |          996 |             89 |              8.94 |          128585 |     80341.1 |           580.71 |
| 50-64      | Bachelor's  |         5016 |            604 |             12.04 |          126685 |     82662   |           572.27 |
| 50-64      | High School |         5711 |            653 |             11.43 |          126442 |     82645.4 |           576.34 |
| 50-64      | Master's    |         2497 |            306 |             12.25 |          126032 |     82455   |           574.43 |
| 50-64      | PhD         |         1024 |             92 |              8.98 |          131968 |     83347.1 |           569.38 |
| 65+        | Bachelor's  |         1757 |            199 |             11.33 |          129537 |     83517.9 |           576.55 |
| 65+        | High School |         1898 |            221 |             11.64 |          126077 |     82458.9 |           577.88 |
| 65+        | Master's    |          891 |            123 |             13.8  |          131985 |     82199.6 |           568.23 |
| 65+        | PhD         |          330 |             32 |              9.7  |          127710 |     81747.4 |           574.14 |

## 2. Drill-down Operation (Employment Type -> Loan Purpose Detailed View)
| EmploymentType   | LoanPurpose   |   TotalLoans |   DefaultCount |   DefaultRate_Pct |   AvgDTI |   AvgInterestRate |
|:-----------------|:--------------|-------------:|---------------:|------------------:|---------:|------------------:|
| Full-time        | Other         |         4195 |            400 |              9.54 |    0.507 |             13.53 |
| Full-time        | Auto          |         6888 |            642 |              9.32 |    0.497 |             13.53 |
| Full-time        | Education     |         5541 |            506 |              9.13 |    0.492 |             13.48 |
| Full-time        | Home          |         5362 |            484 |              9.03 |    0.5   |             13.5  |
| Full-time        | Business      |         5571 |            490 |              8.8  |    0.497 |             13.48 |
| Part-time        | Education     |         2047 |            338 |             16.51 |    0.498 |             13.79 |
| Part-time        | Other         |         1495 |            233 |             15.59 |    0.5   |             13.18 |
| Part-time        | Business      |         2027 |            284 |             14.01 |    0.497 |             13.68 |
| Part-time        | Home          |         1990 |            276 |             13.87 |    0.504 |             13.65 |
| Part-time        | Auto          |         2477 |            318 |             12.84 |    0.501 |             13.58 |
| Self-employed    | Home          |         1530 |            141 |              9.22 |    0.497 |             13.38 |
| Self-employed    | Other         |         1112 |             94 |              8.45 |    0.477 |             13.58 |
| Self-employed    | Auto          |         1863 |            154 |              8.27 |    0.501 |             13.59 |
| Self-employed    | Business      |         1470 |            118 |              8.03 |    0.495 |             13.63 |
| Self-employed    | Education     |         1486 |            117 |              7.87 |    0.508 |             13.17 |

## 3. Slice Operation (Slicing DW on `LoanPurpose = 'Home'`)
| AgeGroup   | CreditScoreGroup    |   TotalLoans |   DefaultCount |   DefaultRate_Pct |   AvgLoanAmount |
|:-----------|:--------------------|-------------:|---------------:|------------------:|----------------:|
| 18-24      | Excellent (800+)    |          136 |              4 |              2.94 |          120103 |
| 18-24      | Fair (580-669)      |          201 |             17 |              8.46 |          137202 |
| 18-24      | Good (670-739)      |          164 |              7 |              4.27 |          119677 |
| 18-24      | Poor (<580)         |          661 |            118 |             17.85 |          126480 |
| 18-24      | Very Good (740-799) |          150 |              6 |              4    |          127842 |
| 25-34      | Excellent (800+)    |          159 |              6 |              3.77 |          129396 |
| 25-34      | Fair (580-669)      |          305 |             18 |              5.9  |          131759 |
| 25-34      | Good (670-739)      |          259 |             15 |              5.79 |          132521 |
| 25-34      | Poor (<580)         |         1002 |            172 |             17.17 |          126419 |
| 25-34      | Very Good (740-799) |          200 |             10 |              5    |          125266 |
| 35-49      | Excellent (800+)    |          252 |              9 |              3.57 |          133170 |
| 35-49      | Fair (580-669)      |          462 |             44 |              9.52 |          124262 |
| 35-49      | Good (670-739)      |          350 |              8 |              2.29 |          127740 |
| 35-49      | Poor (<580)         |         1469 |            260 |             17.7  |          130098 |
| 35-49      | Very Good (740-799) |          352 |             12 |              3.41 |          126678 |
| 50-64      | Excellent (800+)    |          250 |              8 |              3.2  |          124574 |
| 50-64      | Fair (580-669)      |          438 |             28 |              6.39 |          122732 |
| 50-64      | Good (670-739)      |          355 |             17 |              4.79 |          126304 |
| 50-64      | Poor (<580)         |         1438 |            280 |             19.47 |          128126 |
| 50-64      | Very Good (740-799) |          310 |             11 |              3.55 |          132972 |
| 65+        | Excellent (800+)    |           92 |              1 |              1.09 |          118000 |
| 65+        | Fair (580-669)      |          176 |             12 |              6.82 |          117074 |
| 65+        | Good (670-739)      |          111 |              6 |              5.41 |          113682 |
| 65+        | Poor (<580)         |          487 |            101 |             20.74 |          128670 |
| 65+        | Very Good (740-799) |          112 |              5 |              4.46 |          123589 |

## 4. Dice Operation (Slicing on Education IN (Bachelor's, Master's) & Employment = Full-time & CreditScore >= 650)
| AgeGroup   | Education   | LoanPurpose   | RiskCategory   |   TotalLoans |   DefaultCount |   DefaultRate_Pct |
|:-----------|:------------|:--------------|:---------------|-------------:|---------------:|------------------:|
| 18-24      | Bachelor's  | Auto          | Critical Risk  |            4 |              4 |               100 |
| 18-24      | Bachelor's  | Business      | Critical Risk  |            3 |              3 |               100 |
| 18-24      | Bachelor's  | Education     | Critical Risk  |            5 |              5 |               100 |
| 18-24      | Bachelor's  | Home          | Critical Risk  |            4 |              4 |               100 |
| 18-24      | Master's    | Auto          | Critical Risk  |            2 |              2 |               100 |
| 18-24      | Master's    | Business      | Critical Risk  |            2 |              2 |               100 |
| 18-24      | Master's    | Education     | Critical Risk  |            2 |              2 |               100 |
| 18-24      | Master's    | Home          | Critical Risk  |            2 |              2 |               100 |
| 18-24      | Master's    | Other         | Critical Risk  |            2 |              2 |               100 |
| 25-34      | Bachelor's  | Auto          | Critical Risk  |            5 |              5 |               100 |
| 25-34      | Bachelor's  | Business      | Critical Risk  |            6 |              6 |               100 |
| 25-34      | Bachelor's  | Education     | Critical Risk  |            3 |              3 |               100 |
| 25-34      | Bachelor's  | Home          | Critical Risk  |            5 |              5 |               100 |
| 25-34      | Bachelor's  | Other         | Critical Risk  |            4 |              4 |               100 |
| 25-34      | Master's    | Auto          | Critical Risk  |            4 |              4 |               100 |

## 5. Pivot Operation (Cross-Tabulation: Education vs Employment Type Default Rate %)
| Education   |   Full-time |   Part-time |   Self-employed |   Unemployed |
|:------------|------------:|------------:|----------------:|-------------:|
| Bachelor's  |        9.12 |       14.78 |            8.91 |        25.65 |
| High School |        9.52 |       14.25 |            7.99 |        25.42 |
| Master's    |        9.41 |       14.88 |            8.88 |        26.3  |
| PhD         |        6.61 |       12.54 |            6.34 |        21.28 |
