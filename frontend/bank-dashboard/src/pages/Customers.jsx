import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, UserPlus } from 'lucide-react';
import { customerAPI } from '../services/api';
import CustomerTable from '../components/CustomerTable';
import './Customers.css';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPersona, setFilterPersona] = useState('all');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await customerAPI.getAllCustomers();
      if (response.data.success) {
        setCustomers(response.data.customers || []);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      // Mock data for demo
      setCustomers([
        {
          loan_id: 'LN001',
          customer_name: 'Rajesh Kumar',
          loan_amount_left: 45000,
          response_rate: 0.65,
          persona: 'LOW_RISK_COMMUNICATIVE',
          last_contact_date: '2026-02-08'
        },
        {
          loan_id: 'LN002',
          customer_name: 'Priya Sharma',
          loan_amount_left: 82000,
          response_rate: 0.32,
          persona: 'MEDIUM_RISK_INCONSISTENT',
          last_contact_date: '2026-02-07'
        },
        {
          loan_id: 'LN003',
          customer_name: 'Amit Patel',
          loan_amount_left: 125000,
          response_rate: 0.15,
          persona: 'HIGH_RISK_NO_RESPONSE',
          last_contact_date: '2026-02-05'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCustomer = (loanId) => {
    console.log('View customer:', loanId);
    // Navigate to customer detail page
  };

  const handleSendMessage = (loanId) => {
    console.log('Send message to:', loanId);
    // Open message composer modal
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.loan_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterPersona === 'all' || customer.persona === filterPersona;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="customers-page">
      <div className="customers-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">Manage customer loans and communications</p>
        </div>
        <button className="btn btn-primary">
          <UserPlus className="btn-icon" />
          Add Customer
        </button>
      </div>

      {/* Filters */}
      <div className="customers-filters">
        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search by name or loan ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <select
          value={filterPersona}
          onChange={(e) => setFilterPersona(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Personas</option>
          <option value="HIGH_RISK_NO_RESPONSE">High Risk</option>
          <option value="MEDIUM_RISK_INCONSISTENT">Medium Risk</option>
          <option value="LOW_RISK_COMMUNICATIVE">Low Risk</option>
          <option value="COMPLIANT">Compliant</option>
        </select>

        <button className="btn btn-secondary">
          <Filter className="btn-icon" />
          More Filters
        </button>

        <button className="btn btn-secondary">
          <Download className="btn-icon" />
          Export
        </button>
      </div>

      {/* Stats Cards */}
      <div className="customers-stats">
        <div className="stat-box">
          <span className="stat-value">{customers.length}</span>
          <span className="stat-label">Total Customers</span>
        </div>
        <div className="stat-box">
          <span className="stat-value">
            {customers.filter(c => c.persona === 'HIGH_RISK_NO_RESPONSE').length}
          </span>
          <span className="stat-label">High Risk</span>
        </div>
        <div className="stat-box">
          <span className="stat-value">
            ₹{customers.reduce((sum, c) => sum + c.loan_amount_left, 0).toLocaleString('en-IN')}
          </span>
          <span className="stat-label">Total Outstanding</span>
        </div>
        <div className="stat-box">
          <span className="stat-value">
            {((customers.reduce((sum, c) => sum + c.response_rate, 0) / customers.length) * 100).toFixed(0)}%
          </span>
          <span className="stat-label">Avg Response Rate</span>
        </div>
      </div>

      {/* Customer Table */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
        </div>
      ) : (
        <CustomerTable
          customers={filteredCustomers}
          onViewCustomer={handleViewCustomer}
          onSendMessage={handleSendMessage}
        />
      )}
    </div>
  );
};

export default Customers;
