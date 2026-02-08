/**
 * Persona Engine
 * Classifies borrowers into repayment personas based on behavior patterns
 */
class PersonaEngine {
  constructor() {
    this.personas = {
      HIGH_RISK_NON_RESPONSIVE: {
        description: 'High debt, rarely responds',
        priority: 'critical'
      },
      HIGH_RISK_RESPONSIVE: {
        description: 'High debt, engages regularly',
        priority: 'high'
      },
      MEDIUM_RISK_INCONSISTENT: {
        description: 'Moderate debt, inconsistent engagement',
        priority: 'medium'
      },
      LOW_RISK_RESPONSIVE: {
        description: 'Low debt, responds well',
        priority: 'low'
      },
      LOW_RISK_NON_RESPONSIVE: {
        description: 'Low debt, minimal engagement',
        priority: 'low'
      },
      ZERO_CONTACT: {
        description: 'Never contacted or responded',
        priority: 'high'
      }
    };
  }

  /**
   * Classify borrower into persona
   */
  classify(features) {
    const triggeredRules = [];
    let persona = 'UNKNOWN';

    // Extract key features
    const { responseRate, loanAmountLeft, currentContactFreq, daysSinceLastResponse, fico_score_avg, grade_numeric } = features;

    // Rule 1: Zero contact
    if (currentContactFreq === 0 || daysSinceLastResponse > 90) {
      triggeredRules.push('ZERO_CONTACT_DETECTED');
      if (loanAmountLeft > 10000) {
        persona = 'ZERO_CONTACT';
        return { persona, triggeredRules, confidence: 0.9 };
      }
    }

    // Rule 2: High risk non-responsive
    if (responseRate < 0.3 && loanAmountLeft > 15000) {
      triggeredRules.push('HIGH_RISK_LOW_RESPONSE');
      persona = 'HIGH_RISK_NON_RESPONSIVE';
      return { persona, triggeredRules, confidence: 0.85 };
    }

    // Rule 3: High risk responsive
    if (responseRate >= 0.5 && loanAmountLeft > 20000) {
      triggeredRules.push('HIGH_DEBT_GOOD_ENGAGEMENT');
      persona = 'HIGH_RISK_RESPONSIVE';
      return { persona, triggeredRules, confidence: 0.8 };
    }

    // Rule 4: Low risk responsive
    if (responseRate >= 0.7 && (grade_numeric <= 2 || fico_score_avg >= 720)) {
      triggeredRules.push('LOW_RISK_HIGH_RESPONSE');
      persona = 'LOW_RISK_RESPONSIVE';
      return { persona, triggeredRules, confidence: 0.9 };
    }

    // Rule 5: Low risk non-responsive
    if (responseRate < 0.4 && loanAmountLeft < 5000 && fico_score_avg >= 700) {
      triggeredRules.push('LOW_DEBT_LOW_RESPONSE');
      persona = 'LOW_RISK_NON_RESPONSIVE';
      return { persona, triggeredRules, confidence: 0.75 };
    }

    // Rule 6: Medium risk inconsistent
    if (responseRate >= 0.3 && responseRate < 0.7) {
      triggeredRules.push('INCONSISTENT_ENGAGEMENT');
      persona = 'MEDIUM_RISK_INCONSISTENT';
      return { persona, triggeredRules, confidence: 0.7 };
    }

    // Default fallback
    triggeredRules.push('NO_CLEAR_PATTERN');
    return { persona: 'UNKNOWN', triggeredRules, confidence: 0.5 };
  }

  /**
   * Get persona details
   */
  getPersonaDetails(persona) {
    return this.personas[persona] || { description: 'Unknown persona', priority: 'medium' };
  }

  /**
   * Get all available personas
   */
  getAllPersonas() {
    return Object.keys(this.personas);
  }
}

module.exports = PersonaEngine;
