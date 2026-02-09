import React from 'react';
import './StatCard.css';

const StatCard = ({ title, value, icon: Icon, color = 'blue', format = 'text' }) => {
  const formatValue = () => {
    if (format === 'currency') {
      return `₹${value.toLocaleString('en-IN')}`;
    } else if (format === 'percentage') {
      return `${value}%`;
    }
    return value;
  };

  return (
    <div className="stat-card">
      <div className="stat-card-content">
        <div className="stat-card-text">
          <p className="stat-card-title">{title}</p>
          <p className="stat-card-value">{formatValue()}</p>
        </div>
        <div className={`stat-card-icon stat-card-icon-${color}`}>
          <Icon className="icon" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
