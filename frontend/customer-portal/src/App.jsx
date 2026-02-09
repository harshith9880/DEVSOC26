import React from 'react';
import Dashboard from './pages/Dashboard';
import './App.css';

function App() {
  // In production, get loanId from login/auth
  const loanId = new URLSearchParams(window.location.search).get('loan') || 'TEST_001';

  return (
    <div className="app">
      <Dashboard loanId={loanId} />
    </div>
  );
}

export default App;
