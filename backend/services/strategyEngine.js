/**
 * Strategy Engine
 * Recommends communication strategies based on persona and profile
 */
class StrategyEngine {
  constructor() {
    this.strategyMap = {
      HIGH_RISK_NON_RESPONSIVE: [
        { channel: 'call', tone: 'empathetic', frequency: 'high', priority: 1 },
        { channel: 'whatsapp', tone: 'urgent', frequency: 'high', priority: 2 },
        { channel: 'sms', tone: 'empathetic', frequency: 'medium', priority: 3 }
      ],
      HIGH_RISK_RESPONSIVE: [
        { channel: 'whatsapp', tone: 'supportive', frequency: 'medium', priority: 1 },
        { channel: 'email', tone: 'informational', frequency: 'medium', priority: 2 },
        { channel: 'call', tone: 'supportive', frequency: 'low', priority: 3 }
      ],
      MEDIUM_RISK_INCONSISTENT: [
        { channel: 'sms', tone: 'informational', frequency: 'medium', priority: 1 },
        { channel: 'email', tone: 'informational', frequency: 'medium', priority: 2 },
        { channel: 'whatsapp', tone: 'supportive', frequency: 'low', priority: 3 }
      ],
      LOW_RISK_RESPONSIVE: [
        { channel: 'email', tone: 'informational', frequency: 'low', priority: 1 },
        { channel: 'sms', tone: 'informational', frequency: 'low', priority: 2 }
      ],
      LOW_RISK_NON_RESPONSIVE: [
        { channel: 'email', tone: 'informational', frequency: 'low', priority: 1 },
        { channel: 'sms', tone: 'empathetic', frequency: 'low', priority: 2 }
      ],
      ZERO_CONTACT: [
        { channel: 'call', tone: 'empathetic', frequency: 'high', priority: 1 },
        { channel: 'sms', tone: 'urgent', frequency: 'high', priority: 2 },
        { channel: 'whatsapp', tone: 'empathetic', frequency: 'medium', priority: 3 }
      ],
      UNKNOWN: [
        { channel: 'email', tone: 'informational', frequency: 'medium', priority: 1 },
        { channel: 'sms', tone: 'informational', frequency: 'medium', priority: 2 }
      ]
    };
  }

  /**
   * Recommend strategies for a persona
   */
  recommend(persona, features, contactProfile) {
    const baseStrategies = this.strategyMap[persona] || this.strategyMap['UNKNOWN'];

    // Filter based on available contact channels
    const availableChannels = contactProfile?.contactChannels || ['email', 'sms'];
    let filteredStrategies = baseStrategies.filter(s => 
      availableChannels.length === 0 || availableChannels.includes(s.channel)
    );

    // If no strategies match available channels, use base strategies
    if (filteredStrategies.length === 0) {
      filteredStrategies = baseStrategies.slice(0, 2);
    }

    // Adjust frequency based on current contact count
    if (contactProfile?.currentContactFreq > 15) {
      filteredStrategies = filteredStrategies.map(s => ({
        ...s,
        frequency: this.reduceFrequency(s.frequency)
      }));
    }

    // Adjust tone based on response rate
    const responseRate = features.responseRate || 0;
    if (responseRate < 0.2) {
      filteredStrategies = filteredStrategies.map(s => ({
        ...s,
        tone: s.tone === 'informational' ? 'empathetic' : s.tone
      }));
    }

    return filteredStrategies.slice(0, 3); // Return top 3 strategies
  }

  /**
   * Reduce frequency level
   */
  reduceFrequency(frequency) {
    const frequencyMap = {
      'high': 'medium',
      'medium': 'low',
      'low': 'low'
    };
    return frequencyMap[frequency] || frequency;
  }

  /**
   * Get strategy explanation
   */
  explainStrategy(strategy) {
    return `Contact via ${strategy.channel} with ${strategy.tone} tone at ${strategy.frequency} frequency`;
  }
}

module.exports = StrategyEngine;
