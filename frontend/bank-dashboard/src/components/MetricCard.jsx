import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import './MetricCard.css';

const MetricCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue',
  trend,
  trendValue,
  format = 'text'
}) => {
  const formatValue = () => {
    if (format === 'currency') {
      return `₹${value.toLocaleString('en-IN')}`;
    } else if (format === 'percentage') {
      return `${value}%`;
    }
    return value;
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    return trend === 'up' ? <TrendingUp className="trend-icon" /> : <TrendingDown className="trend-icon" />;
  };

  return (
    <div className="metric-card">
      <div className="metric-card-header">
        <div className={`metric-card-icon metric-card-icon-${color}`}>
          <Icon className="icon" />
        </div>
        <div className="metric-card-content">
          <p className="metric-card-title">{title}</p>
          <p className="metric-card-value">{formatValue()}</p>
          {trendValue && (
            <div className={`metric-card-trend metric-card-trend-${trend}`}>
              {getTrendIcon()}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
