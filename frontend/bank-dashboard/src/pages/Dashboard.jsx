import React, { useState, useEffect } from 'react';
import { Users, DollarSign, TrendingUp, MessageSquare, AlertCircle } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOutstanding: 0,
    collectionRate: 0,
    messagesSent: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    console.log('📦 Loading Dashboard...');
    // Mock data since backend is unavailable
    setStats({
      totalCustomers: 156,
      totalOutstanding: 2450000,
      collectionRate: 78.5,
      messagesSent: 1243
    });

    setRecentActivity([
      {
        id: 1,
        type: 'payment',
        message: 'Rajesh Kumar made payment of ₹5,000',
        time: '2 minutes ago'
      },
      {
        id: 2,
        type: 'message',
        message: 'WhatsApp sent to Priya Sharma',
        time: '15 minutes ago'
      },
      {
        id: 3,
        type: 'alert',
        message: 'High-risk customer detected: Amit Patel',
        time: '1 hour ago'
      },
      {
        id: 4,
        type: 'payment',
        message: 'Sneha Reddy made payment of ₹12,500',
        time: '2 hours ago'
      }
    ]);

    console.log('✅ Dashboard loaded');
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back! Here's what's happening today.</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-blue">
            <Users size={32} />
          </div>
          <div className="stat-content">
            <h3>Total Customers</h3>
            <p className="stat-value">{stats.totalCustomers}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-red">
            <DollarSign size={32} />
          </div>
          <div className="stat-content">
            <h3>Total Outstanding</h3>
            <p className="stat-value">{formatCurrency(stats.totalOutstanding)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-green">
            <TrendingUp size={32} />
          </div>
          <div className="stat-content">
            <h3>Collection Rate</h3>
            <p className="stat-value">{stats.collectionRate}%</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-orange">
            <MessageSquare size={32} />
          </div>
          <div className="stat-content">
            <h3>Messages Sent</h3>
            <p className="stat-value">{stats.messagesSent}</p>
          </div>
        </div>
      </div>

      <div className="activity-section">
        <h2>Recent Activity</h2>
        <div className="activity-feed">
          {recentActivity.length === 0 ? (
            <p className="empty-state">Customer interactions and system updates will appear here.</p>
          ) : (
            recentActivity.map(activity => (
              <div key={activity.id} className="activity-item">
                <div className={`activity-icon activity-${activity.type}`}>
                  {activity.type === 'payment' && <DollarSign size={18} />}
                  {activity.type === 'message' && <MessageSquare size={18} />}
                  {activity.type === 'alert' && <AlertCircle size={18} />}
                </div>
                <div className="activity-details">
                  <p className="activity-message">{activity.message}</p>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
