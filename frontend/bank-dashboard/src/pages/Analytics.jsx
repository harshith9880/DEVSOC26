import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, PieChart, Activity } from 'lucide-react';
import './Analytics.css';

const Analytics = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('📦 Loading Analytics...');
    setTimeout(() => {
      setLoading(false);
      console.log('✅ Analytics loaded');
    }, 500);
  }, []);

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <h1>Analytics Dashboard</h1>
        <p>Detailed insights and performance metrics</p>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="card-icon icon-blue">
            <BarChart3 size={32} />
          </div>
          <h3>View monthly collection patterns</h3>
          <p>Track payment trends and collection efficiency over time</p>
          <button className="btn-analytics">View Report</button>
        </div>

        <div className="analytics-card">
          <div className="card-icon icon-green">
            <TrendingUp size={32} />
          </div>
          <h3>Track customer engagement</h3>
          <p>Monitor response rates and communication effectiveness</p>
          <button className="btn-analytics">View Report</button>
        </div>

        <div className="analytics-card">
          <div className="card-icon icon-orange">
            <PieChart size={32} />
          </div>
          <h3>Compare channel effectiveness</h3>
          <p>Analyze performance across email, WhatsApp, SMS, and calls</p>
          <button className="btn-analytics">View Report</button>
        </div>

        <div className="analytics-card">
          <div className="card-icon icon-red">
            <Activity size={32} />
          </div>
          <h3>Monitor agent performance</h3>
          <p>Track AI agent efficiency and automation metrics</p>
          <button className="btn-analytics">View Report</button>
        </div>
      </div>

      <div className="development-notice">
        <p>Advanced analytics and reporting features are under development.</p>
      </div>
    </div>
  );
};

export default Analytics;
