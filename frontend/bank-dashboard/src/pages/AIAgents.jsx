import React, { useState, useEffect } from 'react';
import { Bot, Activity, Zap, Clock, CheckCircle, XCircle } from 'lucide-react';
import { agentAPI } from '../services/api';
import AgentControls from '../components/AgentControls';
import './AIAgents.css';

const AIAgents = () => {
  const [agentStatus, setAgentStatus] = useState(null);
  const [agentLogs, setAgentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgentData();
  }, []);

  const fetchAgentData = async () => {
    setLoading(true);
    try {
      const [statusRes, logsRes] = await Promise.all([
        agentAPI.getAgentStatus(),
        agentAPI.getAgentLogs(20)
      ]);

      if (statusRes.data.success) {
        setAgentStatus(statusRes.data.status);
      }

      if (logsRes.data.success) {
        setAgentLogs(logsRes.data.logs || []);
      }
    } catch (error) {
      console.error('Failed to fetch agent data:', error);
      // Mock data for demo
      setAgentStatus({
        state: 'running',
        last_run: '2026-02-09T11:30:00Z',
        messages_processed: 1247,
        success_rate: 0.94
      });

      setAgentLogs([
        {
          timestamp: '2026-02-09T11:30:00Z',
          level: 'INFO',
          message: 'Agent cycle completed successfully',
          details: 'Processed 15 customers, sent 23 messages'
        },
        {
          timestamp: '2026-02-09T11:15:00Z',
          level: 'SUCCESS',
          message: 'Message sent to LN001',
          details: 'WhatsApp message delivered to Rajesh Kumar'
        },
        {
          timestamp: '2026-02-09T11:10:00Z',
          level: 'INFO',
          message: 'Customer segmentation completed',
          details: 'Identified 28 high-risk customers'
        },
        {
          timestamp: '2026-02-09T11:05:00Z',
          level: 'WARNING',
          message: 'Rate limit approaching',
          details: 'WhatsApp API: 85% of daily quota used'
        },
        {
          timestamp: '2026-02-09T10:50:00Z',
          level: 'ERROR',
          message: 'Failed to send message to LN045',
          details: 'Invalid phone number format'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAgent = async () => {
    try {
      await agentAPI.startAgent();
      fetchAgentData();
      alert('Agent started successfully');
    } catch (error) {
      console.error('Failed to start agent:', error);
      alert('Failed to start agent');
    }
  };

  const handleStopAgent = async () => {
    try {
      await agentAPI.stopAgent();
      fetchAgentData();
      alert('Agent stopped successfully');
    } catch (error) {
      console.error('Failed to stop agent:', error);
      alert('Failed to stop agent');
    }
  };

  const handleTriggerCollection = async (batchSize) => {
    try {
      await agentAPI.triggerCollection(batchSize);
      fetchAgentData();
      alert(`Collection triggered for ${batchSize} customers`);
    } catch (error) {
      console.error('Failed to trigger collection:', error);
      alert('Failed to trigger collection');
    }
  };

  const handleConfigure = () => {
    alert('Configuration modal would open here');
  };

  const getLogIcon = (level) => {
    switch (level) {
      case 'SUCCESS':
        return <CheckCircle className="log-icon log-icon-success" />;
      case 'ERROR':
        return <XCircle className="log-icon log-icon-error" />;
      case 'WARNING':
        return <Activity className="log-icon log-icon-warning" />;
      default:
        return <Activity className="log-icon log-icon-info" />;
    }
  };

  const getLogClass = (level) => {
    return `log-item log-item-${level.toLowerCase()}`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="ai-agents-page">
      <div className="ai-agents-header">
        <div>
          <h1 className="page-title">AI Agents</h1>
          <p className="page-subtitle">Monitor and control automated collection agents</p>
        </div>
      </div>

      {/* Agent Metrics */}
      <div className="agent-metrics">
        <div className="metric-card-agent">
          <div className="metric-icon metric-icon-blue">
            <Bot className="icon" />
          </div>
          <div className="metric-info">
            <span className="metric-label">Agent Status</span>
            <span className="metric-value">
              {agentStatus?.state === 'running' ? 'Running' : 'Stopped'}
            </span>
          </div>
        </div>

        <div className="metric-card-agent">
          <div className="metric-icon metric-icon-green">
            <CheckCircle className="icon" />
          </div>
          <div className="metric-info">
            <span className="metric-label">Messages Processed</span>
            <span className="metric-value">{agentStatus?.messages_processed || 0}</span>
          </div>
        </div>

        <div className="metric-card-agent">
          <div className="metric-icon metric-icon-purple">
            <Zap className="icon" />
          </div>
          <div className="metric-info">
            <span className="metric-label">Success Rate</span>
            <span className="metric-value">
              {((agentStatus?.success_rate || 0) * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="metric-card-agent">
          <div className="metric-icon metric-icon-orange">
            <Clock className="icon" />
          </div>
          <div className="metric-info">
            <span className="metric-label">Last Run</span>
            <span className="metric-value metric-value-small">
              {agentStatus?.last_run
                ? new Date(agentStatus.last_run).toLocaleTimeString('en-IN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })
                : 'Never'}
            </span>
          </div>
        </div>
      </div>

      {/* Agent Controls */}
      <AgentControls
        status={agentStatus}
        onStart={handleStartAgent}
        onStop={handleStopAgent}
        onTrigger={handleTriggerCollection}
        onConfigure={handleConfigure}
      />

      {/* Agent Configuration */}
      <div className="agent-config-section">
        <h2 className="section-title">Agent Configuration</h2>
        <div className="config-grid">
          <div className="config-item">
            <label className="config-label">Batch Size</label>
            <input type="number" className="config-input" defaultValue="10" />
          </div>
          <div className="config-item">
            <label className="config-label">Schedule Interval (minutes)</label>
            <input type="number" className="config-input" defaultValue="30" />
          </div>
          <div className="config-item">
            <label className="config-label">AI Model</label>
            <select className="config-input">
              <option>gemini-1.5-pro</option>
              <option>gemini-1.5-flash</option>
            </select>
          </div>
          <div className="config-item">
            <label className="config-label">Retry Attempts</label>
            <input type="number" className="config-input" defaultValue="3" />
          </div>
        </div>
        <button className="btn btn-primary" style={{ marginTop: 'var(--spacing-lg)' }}>
          Save Configuration
        </button>
      </div>

      {/* Agent Logs */}
      <div className="agent-logs-section">
        <div className="logs-header">
          <h2 className="section-title">Activity Logs</h2>
          <button className="btn btn-secondary" onClick={fetchAgentData}>
            Refresh
          </button>
        </div>

        <div className="logs-container">
          {agentLogs.length === 0 ? (
            <div className="logs-empty">
              <Activity className="empty-icon" />
              <p>No logs available</p>
            </div>
          ) : (
            agentLogs.map((log, index) => (
              <div key={index} className={getLogClass(log.level)}>
                <div className="log-header">
                  {getLogIcon(log.level)}
                  <span className="log-timestamp">
                    {new Date(log.timestamp).toLocaleString('en-IN')}
                  </span>
                  <span className={`log-level log-level-${log.level.toLowerCase()}`}>
                    {log.level}
                  </span>
                </div>
                <p className="log-message">{log.message}</p>
                {log.details && (
                  <p className="log-details">{log.details}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAgents;
