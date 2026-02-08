/**
 * Scorer
 * Calculates confidence scores and risk metrics
 */
class Scorer {
  constructor() {
    this.weights = {
      responseRate: 0.3,
      loanAmount: 0.25,
      ficoScore: 0.2,
      contactFrequency: 0.15,
      grade: 0.1
    };
  }

  /**
   * Calculate confidence score for persona classification
   */
  calculateConfidence(personaResult, features) {
    let confidence = personaResult.confidence || 0.5;

    // Boost confidence based on data quality
    const dataQualityScore = this.assessDataQuality(features);
    confidence = confidence * (0.7 + dataQualityScore * 0.3);

    // Adjust based on number of triggered rules
    const ruleCount = personaResult.triggeredRules?.length || 0;
    if (ruleCount >= 2) {
      confidence = Math.min(confidence + 0.1, 1.0);
    }

    // Cap between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Assess data quality (0-1 score)
   */
  assessDataQuality(features) {
    let score = 0;
    let checks = 0;

    // Check if key features are present
    if (features.responseRate !== null && features.responseRate !== undefined) {
      score += 1;
    }
    checks++;

    if (features.loanAmountLeft > 0) {
      score += 1;
    }
    checks++;

    if (features.fico_score_avg >= 300) {
      score += 1;
    }
    checks++;

    if (features.currentContactFreq >= 0) {
      score += 1;
    }
    checks++;

    if (features.contact_channel_count > 0) {
      score += 1;
    }
    checks++;

    return score / checks;
  }

  /**
   * Calculate default risk score (0-1, higher = riskier)
   */
  calculateDefaultRisk(features) {
    let riskScore = 0;

    // Low response rate increases risk
    riskScore += (1 - features.responseRate) * this.weights.responseRate;

    // High loan amount increases risk
    const loanRisk = Math.min(features.loanAmountLeft / 50000, 1);
    riskScore += loanRisk * this.weights.loanAmount;

    // Low FICO score increases risk
    const ficoRisk = Math.max(0, (750 - features.fico_score_avg) / 450);
    riskScore += ficoRisk * this.weights.ficoScore;

    // High contact frequency without response increases risk
    if (features.responseRate < 0.3 && features.currentContactFreq > 10) {
      riskScore += 0.15;
    }

    // Poor grade increases risk
    const gradeRisk = (features.grade_numeric - 1) / 6;
    riskScore += gradeRisk * this.weights.grade;

    return Math.max(0, Math.min(1, riskScore));
  }

  /**
   * Calculate engagement score (0-1, higher = better)
   */
  calculateEngagementScore(features) {
    let engagementScore = 0;

    // Response rate is primary indicator
    engagementScore += features.responseRate * 0.5;

    // Recent response boosts score
    if (features.daysSinceLastResponse < 7) {
      engagementScore += 0.2;
    } else if (features.daysSinceLastResponse < 30) {
      engagementScore += 0.1;
    }

    // Multiple contact channels indicate engagement
    engagementScore += Math.min(features.contact_channel_count / 4, 0.3);

    return Math.max(0, Math.min(1, engagementScore));
  }

  /**
   * Get score interpretation
   */
  interpretScore(score, type = 'confidence') {
    const interpretations = {
      confidence: {
        high: { min: 0.7, label: 'High Confidence' },
        medium: { min: 0.4, label: 'Medium Confidence' },
        low: { min: 0, label: 'Low Confidence' }
      },
      risk: {
        high: { min: 0.7, label: 'High Risk' },
        medium: { min: 0.4, label: 'Medium Risk' },
        low: { min: 0, label: 'Low Risk' }
      }
    };

    const levels = interpretations[type] || interpretations.confidence;

    if (score >= levels.high.min) return levels.high.label;
    if (score >= levels.medium.min) return levels.medium.label;
    return levels.low.label;
  }
}

module.exports = Scorer;
