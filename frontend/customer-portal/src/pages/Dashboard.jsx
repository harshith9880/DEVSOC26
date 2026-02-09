import React, { useState } from 'react';
import { AlertCircle, TrendingUp, MessageSquare, Clock } from 'lucide-react';
import StatCard from '../components/StatCard';
import FilterTabs from '../components/FilterTabs';
import MessageCard from '../components/MessageCard';
import './Dashboard.css';

const Dashboard = ({ loanId = 'TEST_001' }) => {
  const [filter, setFilter] = useState('all');

  // Mock data
  const profile = {
    loan_amount_left: 45000,
    response_rate: 0.65
  };

  const messages = [
    {
      message_id: '1',
      channel: 'email',
      message_content: 'Your EMI payment of ₹5,000 is due tomorrow. Please make payment to avoid late fees.',
      sentAt: new Date().toISOString(),
      openedAt: null
    },
    {
      message_id: '2',
      channel: 'whatsapp',
      message_content: 'Hi! Quick reminder about your pending EMI of ₹8,200.',
      sentAt: new Date(Date.now() - 3600000).toISOString(),
      openedAt: new Date(Date.now() - 1800000).toISOString()
    },
    {
      message_id: '3',
      channel: 'sms',
      message_content: 'EMI Due: ₹12,500. Pay now.',
      sentAt: new Date(Date.now() - 7200000).toISOString(),
      openedAt: null
    }
  ];

  const getFilteredMessages = () => {
    if (filter === 'all') return messages;
    if (filter === 'unread') return messages.filter(m => !m.openedAt);
    if (filter === 'responded') return messages.filter(m => m.respondedAt);
    return messages;
  };

  const tabs = [
    { id: 'all', label: 'All', count: messages.length },
    { id: 'unread', label: 'Unread', count: messages.filter(m => !m.openedAt).length },
    { id: 'responded', label: 'Responded', count: messages.filter(m => m.respondedAt).length }
  ];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="container">
          <h1 className="dashboard-title">🏦 Loan Portal</h1>
          <p className="dashboard-subtitle">Loan ID: <strong>{loanId}</strong></p>
        </div>
      </header>

      <main className="container dashboard-main">
        <div className="stats-grid">
          <StatCard
            title="Outstanding Amount"
            value={profile.loan_amount_left}
            icon={AlertCircle}
            color="red"
            format="currency"
          />
          <StatCard
            title="Response Rate"
            value={(profile.response_rate * 100).toFixed(0)}
            icon={TrendingUp}
            color="green"
            format="percentage"
          />
          <StatCard
            title="Total Messages"
            value={messages.length}
            icon={MessageSquare}
            color="blue"
          />
          <StatCard
            title="Unread Messages"
            value={messages.filter(m => !m.openedAt).length}
            icon={Clock}
            color="orange"
          />
        </div>

        <div className="messages-section">
          <div className="messages-header">
            <h2 className="messages-title">📬 Recent Messages</h2>
            <FilterTabs 
              tabs={tabs}
              activeTab={filter}
              onTabChange={setFilter}
            />
          </div>

          <div className="messages-list">
            {getFilteredMessages().length === 0 ? (
              <div className="messages-empty">
                <MessageSquare className="empty-icon" size={64} />
                <p className="empty-text">No messages found</p>
              </div>
            ) : (
              getFilteredMessages().map((message) => (
                <MessageCard
                  key={message.message_id}
                  message={message}
                  loanId={loanId}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
