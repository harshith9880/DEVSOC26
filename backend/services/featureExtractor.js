/**
 * Feature Extractor
 * Extracts and normalizes features from loan data for analysis
 */
class FeatureExtractor {
  constructor() {
    this.featureNames = [
      'responseRate',
      'loanAmountLeft',
      'currentContactFreq',
      'daysSinceLastResponse',
      'daysSinceLastContact',
      'fico_score_avg',
      'grade_numeric',
      'dti',
      'delinq_2yrs',
      'revol_util',
      'loan_to_income_ratio',
      'contact_channel_count'
    ];
  }

  /**
   * Extract features from loan document
   */
  extract(loan) {
    const features = {
      // Contact behavior features
      responseRate: this.extractResponseRate(loan),
      currentContactFreq: loan.contactProfile?.currentContactFreq || 0,
      daysSinceLastResponse: this.calculateDaysSince(loan.contactProfile?.lastResponseAt),
      daysSinceLastContact: this.calculateDaysSince(loan.contactProfile?.lastContactAt),
      contact_channel_count: loan.contactProfile?.contactChannels?.length || 0,

      // Financial features
      loanAmountLeft: loan.contactProfile?.loanAmountLeft || 0,
      loan_to_income_ratio: this.calculateLoanToIncomeRatio(loan),
      
      // Credit features
      fico_score_avg: this.calculateFicoAverage(loan),
      grade_numeric: this.convertGradeToNumeric(loan.loan_details?.grade),
      dti: this.extractDecimal(loan.borrower?.dti),
      delinq_2yrs: loan.credit_behavior?.delinq_2yrs || 0,
      revol_util: this.extractDecimal(loan.credit_behavior?.revol_util),

      // Loan details
      loan_status: loan.repayment?.loan_status || 'Unknown',
      term_months: this.extractTermMonths(loan.loan_details?.term),
      int_rate: this.extractDecimal(loan.loan_details?.int_rate)
    };

    return features;
  }

  /**
   * Extract response rate with default
   */
  extractResponseRate(loan) {
    const rate = loan.contactProfile?.responseRate;
    if (rate === null || rate === undefined) return 0.0;
    return Math.max(0, Math.min(1, rate)); // Clamp between 0 and 1
  }

  /**
   * Calculate days since a date
   */
  calculateDaysSince(date) {
    if (!date) return 999; // Large number for "never"
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate FICO score average
   */
  calculateFicoAverage(loan) {
    const low = loan.borrower?.fico_range_low || 650;
    const high = loan.borrower?.fico_range_high || 700;
    return (low + high) / 2;
  }

  /**
   * Convert loan grade to numeric (A=1, B=2, ..., G=7)
   */
  convertGradeToNumeric(grade) {
    if (!grade) return 4; // Default to middle grade
    const gradeMap = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7 };
    return gradeMap[grade.toUpperCase()] || 4;
  }

  /**
   * Extract Decimal128 value as number
   */
  extractDecimal(decimal128Value) {
    if (!decimal128Value) return 0;
    if (typeof decimal128Value === 'number') return decimal128Value;
    if (decimal128Value.$numberDecimal) {
      return parseFloat(decimal128Value.$numberDecimal);
    }
    return parseFloat(decimal128Value.toString());
  }

  /**
   * Calculate loan-to-income ratio
   */
  calculateLoanToIncomeRatio(loan) {
    const loanAmount = this.extractDecimal(loan.loan_details?.loan_amnt) || 0;
    const annualIncome = this.extractDecimal(loan.borrower?.annual_inc) || 1;
    return loanAmount / annualIncome;
  }

  /**
   * Extract term in months from string like " 36 months"
   */
  extractTermMonths(termString) {
    if (!termString) return 36;
    const match = termString.match(/(\d+)/);
    return match ? parseInt(match[1]) : 36;
  }

  /**
   * Get feature names for explainability
   */
  getFeatureNames() {
    return this.featureNames;
  }

  /**
   * Normalize features for ML models (optional)
   */
  normalize(features) {
    return {
      responseRate: features.responseRate, // Already 0-1
      loanAmountLeft_norm: Math.min(features.loanAmountLeft / 100000, 1),
      currentContactFreq_norm: Math.min(features.currentContactFreq / 20, 1),
      fico_norm: (features.fico_score_avg - 300) / 550,
      grade_norm: features.grade_numeric / 7,
      dti_norm: Math.min(features.dti / 50, 1),
      revol_util_norm: features.revol_util / 100
    };
  }
}

module.exports = FeatureExtractor;
