import React from 'react';
import './MessageCard.css';

const MessageCard = ({ message, loanId }) => {
  const getChannelEmoji = (channel) => {
    const emojis = {
      email: '📧',
      whatsapp: '💬',
      sms: '📱',
      call: '📞'
    };
    return emojis[channel] || '💌';
  };

  return (
    <div className={`message-card ${!message.openedAt ? 'unread' : ''}`}>
      <div className="message-header">
        <span className={`channel-badge channel-${message.channel}`}>
          {getChannelEmoji(message.channel)} {message.channel.toUpperCase()}
        </span>
        <span className="message-time">
          {new Date(message.sentAt).toLocaleString()}
        </span>
        {!message.openedAt && <span className="unread-badge">New</span>}
      </div>
      
      <p className="message-content">{message.message_content}</p>
      
      <div className="message-actions">
        <button className="action-btn">💳 Make Payment</button>
        {message.openedAt && (
          <span className="status-opened">✓ Opened</span>
        )}
        {message.respondedAt && (
          <span className="status-responded">✓ Responded</span>
        )}
      </div>
    </div>
  );
};

export default MessageCard;
