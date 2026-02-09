import React from 'react';
import { Eye, Send } from 'lucide-react';
import './CustomerTable.css';

const CustomerTable = ({ customers, onViewCustomer, onSendMessage }) => {
  const getPersonaBadge = (persona) => {
    const badges = {
      'HIGH_RISK_NO_RESPONSE': { class: 'badge-danger', label: 'High Risk' },
      'MEDIUM_RISK_INCONSISTENT': { class: 'badge-warning', label: 'Medium Risk' },
      'LOW_RISK_COMMUNICATIVE': { class: 'badge-success', label: 'Low Risk' },
      'COMPLIANT': { class: 'badge-info', label: 'Compliant' }
    };
    const badge = badges[persona] || { class: 'badge-secondary', label: persona };
    return <span className={`badge ${badge.class}`}>{badge.label}</span>;
  };

  return (
    <div className="customer-table-container">
      <table className="customer-table">
        <thead>
          <tr>
            <th>Loan ID</th>
            <th>Customer Name</th>
            <th>Amount Left</th>
            <th>Response Rate</th>
            <th>Persona</th>
            <th>Last Contact</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.loan_id}>
              <td className="customer-loan-id">{customer.loan_id}</td>
              <td className="customer-name">{customer.customer_name}</td>
              <td className="customer-amount">
                ₹{customer.loan_amount_left.toLocaleString('en-IN')}
              </td>
              <td>
                <div className="response-rate">
                  <div className="response-rate-bar">
                    <div 
                      className="response-rate-fill"
                      style={{ width: `${(customer.response_rate * 100).toFixed(0)}%` }}
                    />
                  </div>
                  <span className="response-rate-text">
                    {(customer.response_rate * 100).toFixed(0)}%
                  </span>
                </div>
              </td>
              <td>{getPersonaBadge(customer.persona)}</td>
              <td className="customer-last-contact">
                {customer.last_contact_date 
                  ? new Date(customer.last_contact_date).toLocaleDateString('en-IN')
                  : 'Never'}
              </td>
              <td>
                <div className="customer-actions">
                  <button
                    className="action-btn action-btn-view"
                    onClick={() => onViewCustomer(customer.loan_id)}
                    title="View Details"
                  >
                    <Eye className="action-icon" />
                  </button>
                  <button
                    className="action-btn action-btn-send"
                    onClick={() => onSendMessage(customer.loan_id)}
                    title="Send Message"
                  >
                    <Send className="action-icon" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerTable;
