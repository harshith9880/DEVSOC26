import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, DollarSign, TrendingUp, MessageSquare, AlertCircle } from 'lucide-react';
import './Dashboard.css';

const API_BASE_URL = 'http://localhost:5000/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOutstanding: 0,
    collectionRate: 0,
    messagesSent: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('📦 Loading Dashboard...');
    fetchDashboardData();
    console.log('✅ Dashboard loaded');
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch customers for stats
      const customersResponse = await axios.get(`${API_BASE_URL}/customers`);
      
      if (customersResponse.data.success && customersResponse.data.customers) {
        const customers = customersResponse.data.customers;
        
        // Calculate stats
        const totalCustomers = customers.length;
        const totalOutstanding = customers.reduce((sum, c) => sum + (c.outstanding_amount || 0), 0);
        const avgResponseRate = customers.reduce((sum, c) => sum + (c.response_rate || 0), 0) / totalCustomers;
        
        setStats({
          totalCustomers,
          totalOutstanding,
          collectionRate: avgResponseRate.toFixed(1),
          messagesSent: totalCustomers * 8 // Approximate
        });
      }

      // Set some recent activity (can be replaced with real API later)
      setRecentActivity([
        {
          id: 1,
          type: 'payment',
          message: 'Customer made payment',
          time: '2 minutes ago'
        },
        {
          id: 2,
          type: 'message',
          message: 'WhatsApp campaign sent',
          time: '15 minutes ago'
        }
      ]);
    } catch (error) {
      console.error('❌ Failed to fetch dashboard data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

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
