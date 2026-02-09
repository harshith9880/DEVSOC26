import React, { useState, useEffect } from 'react';
import { Search, Filter, Mail, MessageSquare, Phone, Send } from 'lucide-react';
import { messageAPI } from '../services/api';
import MessageTimeline from '../components/MessageTimeline';
import './Messages.css';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await messageAPI.getAllMessages();
      if (response.data.success) {
        setMessages(response.data.messages || []);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      // Mock data for demo
      setMessages([
        {
          message_id: 'MSG001',
          loan_id: 'LN001',
          customer_name: 'Rajesh Kumar',
          channel: 'email',
          message_content: 'Dear Rajesh, your EMI payment of ₹5,000 is due. Please make the payment to avoid late fees.',
          sentAt: '2026-02-09T10:30:00Z',
          deliveredAt: '2026-02-09T10:31:00Z',
          openedAt: '2026-02-09T11:15:00Z',
          respondedAt: '2026-02-09T11:45:00Z',
          response_text: 'Will pay by tomorrow'
        },
        {
          message_id: 'MSG002',
          loan_id: 'LN002',
          customer_name: 'Priya Sharma',
          channel: 'whatsapp',
          message_content: 'Hi Priya! Quick reminder about your pending EMI of ₹8,200. Let us know if you need any assistance.',
          sentAt: '2026-02-09T09:20:00Z',
          deliveredAt: '2026-02-09T09:21:00Z',
          openedAt: '2026-02-09T09:45:00Z',
          respondedAt: null
        },
        {
          message_id: 'MSG003',
          loan_id: 'LN003',
          customer_name: 'Amit Patel',
          channel: 'sms',
          message_content: 'EMI Due: ₹12,500. Pay now to avoid charges. Reply HELP for assistance.',
          sentAt: '2026-02-09T08:00:00Z',
          deliveredAt: '2026-02-09T08:01:00Z',
          openedAt: null,
          respondedAt: null
        },
        {
          message_id: 'MSG004',
          loan_id: 'LN004',
          customer_name: 'Sneha Reddy',
          channel: 'call',
          message_content: 'Automated reminder call regarding loan payment.',
          sentAt: '2026-02-08T16:30:00Z',
          deliveredAt: '2026-02-08T16:30:00Z',
          openedAt: '2026-02-08T16:30:00Z',
          respondedAt: '2026-02-08T16:35:00Z',
          response_text: 'Will pay next week',
          call_duration: '5:24'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = messages.filter(msg => {
    const matchesChannel = selectedChannel === 'all' || msg.channel === selectedChannel;
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'responded' && msg.respondedAt) ||
                         (selectedStatus === 'opened' && msg.openedAt && !msg.respondedAt) ||
                         (selectedStatus === 'sent' && !msg.openedAt);
    const matchesSearch = msg.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         msg.loan_id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesChannel && matchesStatus && matchesSearch;
  });

  const stats = {
    total: messages.length,
    sent: messages.filter(m => !m.openedAt).length,
    opened: messages.filter(m => m.openedAt && !m.respondedAt).length,
    responded: messages.filter(m => m.respondedAt).length
  };

  return (
    <div className="messages-page">
      <div className="messages-header">
        <div>
          <h1 className="page-title">Messages</h1>
          <p className="page-subtitle">View and manage all customer communications</p>
        </div>
        <button className="btn btn-primary">
          <Send className="btn-icon" />
          Send Bulk Message
        </button>
      </div>

      {/* Stats Bar */}
      <div className="messages-stats-bar">
        <div className="stat-chip">
          <span className="stat-chip-label">Total</span>
          <span className="stat-chip-value">{stats.total}</span>
        </div>
        <div className="stat-chip stat-chip-blue">
          <span className="stat-chip-label">Sent</span>
          <span className="stat-chip-value">{stats.sent}</span>
        </div>
        <div className="stat-chip stat-chip-green">
          <span className="stat-chip-label">Opened</span>
          <span className="stat-chip-value">{stats.opened}</span>
        </div>
        <div className="stat-chip stat-chip-success">
          <span className="stat-chip-label">Responded</span>
          <span className="stat-chip-value">{stats.responded}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="messages-filters">
        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search by customer or loan ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="channel-filters">
          <button
            className={`channel-btn ${selectedChannel === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedChannel('all')}
          >
            All Channels
          </button>
          <button
            className={`channel-btn ${selectedChannel === 'email' ? 'active' : ''}`}
            onClick={() => setSelectedChannel('email')}
          >
            <Mail className="channel-icon" />
            Email
          </button>
          <button
            className={`channel-btn ${selectedChannel === 'whatsapp' ? 'active' : ''}`}
            onClick={() => setSelectedChannel('whatsapp')}
          >
            <MessageSquare className="channel-icon" />
            WhatsApp
          </button>
          <button
            className={`channel-btn ${selectedChannel === 'sms' ? 'active' : ''}`}
            onClick={() => setSelectedChannel('sms')}
          >
            <MessageSquare className="channel-icon" />
            SMS
          </button>
          <button
            className={`channel-btn ${selectedChannel === 'call' ? 'active' : ''}`}
            onClick={() => setSelectedChannel('call')}
          >
            <Phone className="channel-icon" />
            Call
          </button>
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="status-select"
        >
          <option value="all">All Status</option>
          <option value="sent">Sent Only</option>
          <option value="opened">Opened</option>
          <option value="responded">Responded</option>
        </select>
      </div>

      {/* Messages List */}
      <div className="messages-content">
        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="messages-empty">
            <MessageSquare className="empty-icon" />
            <p>No messages found</p>
          </div>
        ) : (
          <div className="messages-timeline-container">
            <MessageTimeline messages={filteredMessages} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
