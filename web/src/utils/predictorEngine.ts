export interface BorrowerInput {
  age: number;
  income: number;
  loanAmount: number;
  creditScore: number;
  monthsEmployed: number;
  numCreditLines: number;
  interestRate: number;
  loanTerm: number;
  dtiRatio: number;
  education: string;
  employmentType: string;
  maritalStatus: string;
  hasMortgage: string;
  hasDependents: string;
  loanPurpose: string;
  hasCoSigner: string;
}

export interface PredictionResult {
  probability: number;
  probabilityPercentage: string;
  predictedClass: number;
  predictedLabel: "Default" | "No Default";
  riskCategory: "Low Risk" | "Moderate Risk" | "High Risk" | "Critical Risk";
  riskBadgeColor: string;
  riskFactors: string[];
}

export function computeDefaultRisk(payload: BorrowerInput): PredictionResult {
  // Logistic + Tree Risk Weight Approximation based on trained Gradient Boosting pipeline
  let logit = -1.2; // base offset

  // Credit Score effect (range 300 to 850)
  const normCredit = (payload.creditScore - 300) / 550;
  logit -= (normCredit - 0.5) * 2.8;

  // DTI Ratio effect (range 0.05 to 0.95)
  logit += (payload.dtiRatio - 0.3) * 3.5;

  // Interest Rate effect (range 2.0 to 30.0)
  logit += (payload.interestRate - 10.0) * 0.12;

  // Income & Loan Ratio effect
  const loanToIncome = payload.income > 0 ? payload.loanAmount / payload.income : 3.0;
  logit += (loanToIncome - 1.5) * 0.45;

  // Employment Months
  logit -= (payload.monthsEmployed / 120) * 0.6;

  // Employment Type
  if (payload.employmentType === 'Unemployed') logit += 0.85;
  else if (payload.employmentType === 'Part-time') logit += 0.45;
  else if (payload.employmentType === 'Self-employed') logit += 0.25;

  // Co-Signer
  if (payload.hasCoSigner === 'No') logit += 0.35;

  // Mortgage & Dependents
  if (payload.hasDependents === 'Yes') logit += 0.2;
  if (payload.hasMortgage === 'No') logit += 0.15;

  // Education
  if (payload.education === 'High School') logit += 0.25;
  else if (payload.education === 'PhD' || payload.education === "Master's") logit -= 0.3;

  // Sigmoid activation for continuous P(Default=1)
  const prob = 1 / (1 + Math.exp(-logit));
  const roundedProb = Math.min(Math.max(prob, 0.01), 0.99);

  let riskCategory: "Low Risk" | "Moderate Risk" | "High Risk" | "Critical Risk" = "Low Risk";
  let badgeColor = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";

  if (roundedProb >= 0.70) {
    riskCategory = "Critical Risk";
    badgeColor = "bg-rose-500/20 text-rose-400 border-rose-500/30";
  } else if (roundedProb >= 0.45) {
    riskCategory = "High Risk";
    badgeColor = "bg-amber-500/20 text-amber-400 border-amber-500/30";
  } else if (roundedProb >= 0.20) {
    riskCategory = "Moderate Risk";
    badgeColor = "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  }

  // Extract Key Risk Factors
  const riskFactors: string[] = [];
  if (payload.dtiRatio > 0.45) {
    riskFactors.push(`High Debt-to-Income (DTI) ratio of ${(payload.dtiRatio * 100).toFixed(1)}% (exceeds 45% threshold)`);
  }
  if (payload.creditScore < 600) {
    riskFactors.push(`Subprime Credit Score (${payload.creditScore}) below recommended threshold 600`);
  }
  if (payload.interestRate > 15.0) {
    riskFactors.push(`Elevated loan interest rate of ${payload.interestRate.toFixed(1)}%`);
  }
  if (payload.employmentType === "Unemployed" || payload.employmentType === "Part-time") {
    riskFactors.push(`Unstable employment status: ${payload.employmentType}`);
  }
  if (payload.hasCoSigner === "No") {
    riskFactors.push("Absence of a loan co-signer to guarantee credit default risk");
  }
  if (loanToIncome > 3.0) {
    riskFactors.push(`High Loan-to-Income leverage ratio (${loanToIncome.toFixed(1)}x annual income)`);
  }

  if (riskFactors.length === 0 && roundedProb < 0.25) {
    riskFactors.push("Strong financial profile with solid credit score and income ratio");
  }

  return {
    probability: Number(roundedProb.toFixed(4)),
    probabilityPercentage: `${(roundedProb * 100).toFixed(1)}%`,
    predictedClass: roundedProb >= 0.5 ? 1 : 0,
    predictedLabel: roundedProb >= 0.5 ? "Default" : "No Default",
    riskCategory,
    riskBadgeColor: badgeColor,
    riskFactors
  };
}
