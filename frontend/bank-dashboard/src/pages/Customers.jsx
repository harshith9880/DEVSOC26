import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Customers.css';

const Customers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('📦 Loading Customers...');
    fetchCustomers();
    console.log('✅ Customers loaded');
  }, []);

  const fetchCustomers = () => {
    // Mock data
    const mockCustomers = [
      {
        loan_id: 'LN001',
        customer_name: 'Rajesh Kumar',
        email: 'rajesh.k@email.com',
        phone_number: '+91 98765 43210',
        outstanding_amount: 125000,
        response_rate: 85,
        persona: 'HIGH_RISK_AGGRESSIVE_DEFAULTER'
      },
      {
        loan_id: 'LN002',
        customer_name: 'Priya Sharma',
        email: 'priya.sharma@email.com',
        phone_number: '+91 98234 56789',
        outstanding_amount: 85000,
        response_rate: 92,
        persona: 'LOW_RISK_COOPERATIVE_BORROWER'
      },
      {
        loan_id: 'LN003',
        customer_name: 'Amit Patel',
        email: 'amit.patel@email.com',
        phone_number: '+91 97654 32109',
        outstanding_amount: 250000,
        response_rate: 45,
        persona: 'HIGH_RISK_EVASIVE_DEBTOR'
      },
      {
        loan_id: 'LN004',
        customer_name: 'Sneha Reddy',
        email: 'sneha.reddy@email.com',
        phone_number: '+91 99876 54321',
        outstanding_amount: 65000,
        response_rate: 78,
        persona: 'MEDIUM_RISK_INCONSISTENT_PAYER'
      },
      {
        loan_id: 'LN005',
        customer_name: 'Vikram Singh',
        email: 'vikram.singh@email.com',
        phone_number: '+91 98123 45678',
        outstanding_amount: 195000,
        response_rate: 55,
        persona: 'HIGH_RISK_FINANCIAL_DISTRESSED'
      },
      {
        loan_id: 'LN006',
        customer_name: 'Anita Desai',
        email: 'anita.desai@email.com',
        phone_number: '+91 97234 56780',
        outstanding_amount: 45000,
        response_rate: 95,
        persona: 'LOW_RISK_TIMELY_BORROWER'
      }
    ];

    setCustomers(mockCustomers);
    setLoading(false);
  };

  const getRiskStatus = (persona) => {
    if (!persona) return 'UNKNOWN';
    if (persona.includes('HIGH_RISK')) return 'HIGH_RISK';
    if (persona.includes('MEDIUM_RISK')) return 'MEDIUM_RISK';
    if (persona.includes('LOW_RISK')) return 'LOW_RISK';
    return 'UNKNOWN';
  };

  const getRiskColor = (persona) => {
    const status = getRiskStatus(persona);
    switch (status) {
      case 'HIGH_RISK': return '#ef4444';
      case 'MEDIUM_RISK': return '#f59e0b';
      case 'LOW_RISK': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getFilteredCustomers = () => {
    let filtered = [...customers];

    // Search filter
    if (searchTerm && searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(customer => {
        const name = (customer.customer_name || '').toLowerCase();
        const loanId = (customer.loan_id || '').toLowerCase();
        const email = (customer.email || '').toLowerCase();
        const phone = (customer.phone_number || '').toLowerCase();
        
        return name.includes(term) || loanId.includes(term) || 
               email.includes(term) || phone.includes(term);
      });
    }

    // Status filter
    if (filterStatus && filterStatus !== 'all') {
      filtered = filtered.filter(customer => {
        const status = getRiskStatus(customer.persona);
        return status.toLowerCase() === filterStatus.toLowerCase();
      });
    }

    return filtered;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleViewDetails = (loanId) => {
    navigate(`/customers/${loanId}`);
  };

  const filteredCustomers = getFilteredCustomers();

  if (loading) {
    return <div className="loading">Loading customers...</div>;
  }

  return (
    <div className="customers-page">
      <div className="customers-header">
        <h1>Customer Management</h1>
        <button className="btn-export">
          <Download size={18} />
          Export Data
        </button>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by name, loan ID, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={18} />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="high_risk">High Risk</option>
            <option value="medium_risk">Medium Risk</option>
            <option value="low_risk">Low Risk</option>
          </select>
        </div>
      </div>

      <div className="results-summary">
        <p>Total: <strong>{customers.length}</strong></p>
        <p>Showing: <strong>{filteredCustomers.length}</strong></p>
      </div>

      <div className="customers-table-container">
        <table className="customers-table">
          <thead>
            <tr>
              <th>LOAN ID</th>
              <th>CUSTOMER NAME</th>
              <th>CONTACT</th>
              <th>OUTSTANDING</th>
              <th>RESPONSE RATE</th>
              <th>RISK STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>
                  No customers found
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer) => (
                <tr key={customer.loan_id}>
                  <td className="loan-id">{customer.loan_id}</td>
                  <td className="customer-name">{customer.customer_name}</td>
                  <td className="contact-info">
                    <div>{customer.email}</div>
                    <div className="phone">{customer.phone_number}</div>
                  </td>
                  <td className="outstanding">{formatCurrency(customer.outstanding_amount)}</td>
                  <td>
                    <div className="response-rate" 
                         style={{ 
                           background: customer.response_rate > 70 ? '#d1fae5' : '#fee2e2',
                           color: customer.response_rate > 70 ? '#047857' : '#991b1b'
                         }}>
                      {customer.response_rate}%
                    </div>
                  </td>
                  <td>
                    <span className="risk-badge"
                          style={{ 
                            background: `${getRiskColor(customer.persona)}20`,
                            color: getRiskColor(customer.persona)
                          }}>
                      {getRiskStatus(customer.persona).replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn-view-details"
                      onClick={() => handleViewDetails(customer.loan_id)}
                    >
                      <Eye size={16} />
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Customers;
