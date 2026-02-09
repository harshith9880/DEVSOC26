import React from 'react';
import { Mail, MessageCircle, Phone, Clock } from 'lucide-react';
import './MessageTimeline.css';

const MessageTimeline = ({ messages }) => {
  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'email': return <Mail size={18} />;
      case 'whatsapp': return <MessageCircle size={18} />;
      case 'sms': return <Phone size={18} />;
      case 'call': return <Phone size={18} />;
      default: return <MessageCircle size={18} />;
    }
  };

  const getChannelColor = (channel) => {
    switch (channel) {
      case 'email': return '#3b82f6';
      case 'whatsapp': return '#10b981';
      case 'sms': return '#8b5cf6';
      case 'call': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  if (!messages || messages.length === 0) {
    return (
      <div className="timeline-empty">
        <Clock size={48} color="#d1d5db" />
        <p>No messages yet</p>
      </div>
    );
  }

  return (
    <div className="message-timeline">
      {messages.map((message, index) => (
        <div key={message.message_id || index} className="timeline-item">
          <div 
            className="timeline-icon" 
            style={{ background: getChannelColor(message.channel) }}
          >
            {getChannelIcon(message.channel)}
          </div>
          <div className="timeline-content">
            <div className="timeline-header">
              <span className="timeline-channel">{message.channel.toUpperCase()}</span>
              <span className="timeline-time">
                {new Date(message.sentAt).toLocaleString()}
              </span>
            </div>
            <p className="timeline-message">{message.message_content}</p>
            {message.openedAt && (
              <span className="timeline-status status-opened">
                ✓ Opened {new Date(message.openedAt).toLocaleTimeString()}
              </span>
            )}
            {message.respondedAt && (
              <span className="timeline-status status-responded">
                ✓ Responded {new Date(message.respondedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageTimeline;
