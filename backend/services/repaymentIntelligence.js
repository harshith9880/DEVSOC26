const FeatureExtractor = require('./featureExtractor');
const PersonaEngine = require('./personaEngine');
const StrategyEngine = require('./strategyEngine');
const Scorer = require('./scorer');

/**
 * Repayment Intelligence
 * Main orchestrator for the decision intelligence pipeline
 * Analyzes borrower behavior and recommends optimal collection strategies
 */
class RepaymentIntelligence {
  constructor(loan) {
    if (!loan) {
      throw new Error('Loan document is required for RepaymentIntelligence');
    }

    this.loan = loan;
    this.featureExtractor = new FeatureExtractor();
    this.personaEngine = new PersonaEngine();
    this.strategyEngine = new StrategyEngine();
    this.scorer = new Scorer();
  }

  /**
   * Main analysis pipeline
   * Returns complete intelligence feedback
   */
  async analyze() {
    try {
      // Step 1: Extract features from loan data
      console.log(`🔍 Extracting features for loan ${this.loan.id}...`);
      const features = this.featureExtractor.extract(this.loan);

      // Step 2: Classify borrower persona
      console.log(`🎭 Classifying repayment persona...`);
      const personaResult = this.personaEngine.classify(features);

      // Step 3: Recommend collection strategies
      console.log(`📋 Generating strategy recommendations...`);
      const strategies = this.strategyEngine.recommend(
        personaResult.persona,
        features,
        this.loan.contactProfile
      );

      // Step 4: Calculate confidence score
      console.log(`📊 Calculating confidence scores...`);
      const confidence = this.scorer.calculateConfidence(personaResult, features);

      // Step 5: Calculate default risk
      const defaultRisk = this.scorer.calculateDefaultRisk(features);

      // Step 6: Calculate engagement score
      const engagementScore = this.scorer.calculateEngagementScore(features);

      // Step 7: Determine max contact intensity
      const maxIntensity = this.calculateMaxIntensity(
        personaResult.persona,
        features,
        defaultRisk
      );

      // Build complete feedback output
      const feedback = {
        loan_id: this.loan.id,
        repayment_persona: personaResult.persona,
        confidence: confidence,
        triggered_rules: personaResult.triggeredRules || [],
        recommended_strategies: strategies,
        max_intensity_level: maxIntensity,
        
        // Additional analytics
        analytics: {
          default_risk_score: defaultRisk,
          engagement_score: engagementScore,
          risk_interpretation: this.scorer.interpretScore(defaultRisk, 'risk'),
          engagement_interpretation: this.scorer.interpretScore(engagementScore, 'confidence')
        },

        // Feature snapshot for audit trail
        feature_snapshot: {
          responseRate: features.responseRate,
          loanAmountLeft: features.loanAmountLeft,
          currentContactFreq: features.currentContactFreq,
          daysSinceLastResponse: features.daysSinceLastResponse,
          fico_score_avg: features.fico_score_avg,
          grade: this.loan.loan_details?.grade
        },

        generated_at: new Date()
      };

      console.log(`✅ Analysis complete for loan ${this.loan.id}: Persona=${personaResult.persona}, Confidence=${confidence.toFixed(2)}`);

      return feedback;

    } catch (error) {
      console.error(`❌ Intelligence analysis failed for loan ${this.loan.id}:`, error);
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  /**
   * Calculate maximum contact intensity level (1-5)
   * Higher = more aggressive contact strategy
   */
  calculateMaxIntensity(persona, features, defaultRisk) {
    const baseIntensityMap = {
      'HIGH_RISK_NON_RESPONSIVE': 5,
      'HIGH_RISK_RESPONSIVE': 4,
      'ZERO_CONTACT': 5,
      'MEDIUM_RISK_INCONSISTENT': 3,
      'LOW_RISK_NON_RESPONSIVE': 2,
      'LOW_RISK_RESPONSIVE': 1,
      'UNKNOWN': 2
    };

    let intensity = baseIntensityMap[persona] || 2;

    // Boost intensity for high outstanding amounts
    if (features.loanAmountLeft > 50000) {
      intensity = Math.min(intensity + 1, 5);
    } else if (features.loanAmountLeft > 30000) {
      intensity = Math.min(intensity + 0.5, 5);
    }

    // Reduce intensity if already contacted frequently
    if (features.currentContactFreq > 15) {
      intensity = Math.max(intensity - 1, 1);
    } else if (features.currentContactFreq > 10) {
      intensity = Math.max(intensity - 0.5, 1);
    }

    // Adjust based on default risk
    if (defaultRisk > 0.8) {
      intensity = Math.min(intensity + 1, 5);
    }

    // Round and clamp to 1-5
    return Math.max(1, Math.min(5, Math.round(intensity)));
  }

  /**
   * Re-analyze with updated loan data
   * Used after new interactions or payment events
   */
  async reanalyze(updatedLoan) {
    this.loan = updatedLoan;
    console.log(`🔄 Re-analyzing loan ${this.loan.id}...`);
    return await this.analyze();
  }

  /**
   * Get next best action
   * Returns the highest priority recommended strategy
   */
  getNextBestAction(feedback) {
    if (!feedback.recommended_strategies || feedback.recommended_strategies.length === 0) {
      return {
        channel: 'email',
        tone: 'informational',
        message: 'No specific action recommended'
      };
    }

    const topStrategy = feedback.recommended_strategies[0];
    return {
      channel: topStrategy.channel,
      tone: topStrategy.tone,
      message: `Contact via ${topStrategy.channel} with ${topStrategy.tone} tone`
    };
  }

  /**
   * Get explainability summary
   * Returns human-readable explanation of the decision
   */
  explainDecision(feedback) {
    const persona = feedback.repayment_persona;
    const confidence = (feedback.confidence * 100).toFixed(0);
    const rules = feedback.triggered_rules.join(', ');
    
    return {
      summary: `Classified as ${persona} with ${confidence}% confidence`,
      reasoning: `Based on rules: ${rules}`,
      risk_level: feedback.analytics.risk_interpretation,
      engagement_level: feedback.analytics.engagement_interpretation,
      recommended_action: this.getNextBestAction(feedback).message
    };
  }

  /**
   * Batch analyze multiple loans
   * Optimized for processing large datasets
   */
  static async batchAnalyze(loans) {
    const results = [];
    
    for (const loan of loans) {
      try {
        const intelligence = new RepaymentIntelligence(loan);
        const feedback = await intelligence.analyze();
        results.push({ loan_id: loan.id, feedback, success: true });
      } catch (error) {
        results.push({ 
          loan_id: loan.id, 
          error: error.message, 
          success: false 
        });
      }
    }

    return results;
  }

  /**
   * Get feature importance for this analysis
   */
  getFeatureImportance() {
    return this.featureExtractor.getFeatureNames();
  }
}

module.exports = RepaymentIntelligence;
