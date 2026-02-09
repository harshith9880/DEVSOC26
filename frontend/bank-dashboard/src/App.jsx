import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Lazy load components with error boundaries
const Navbar = React.lazy(() => {
  console.log('📦 Loading Navbar...');
  return import('./components/Navbar').then(module => {
    console.log('✅ Navbar loaded');
    return module;
  }).catch(err => {
    console.error('❌ Navbar failed:', err);
    throw err;
  });
});

const Sidebar = React.lazy(() => {
  console.log('📦 Loading Sidebar...');
  return import('./components/Sidebar').then(module => {
    console.log('✅ Sidebar loaded');
    return module;
  }).catch(err => {
    console.error('❌ Sidebar failed:', err);
    throw err;
  });
});

const Dashboard = React.lazy(() => {
  console.log('📦 Loading Dashboard...');
  return import('./pages/Dashboard').then(module => {
    console.log('✅ Dashboard loaded');
    return module;
  }).catch(err => {
    console.error('❌ Dashboard failed:', err);
    throw err;
  });
});

const Customers = React.lazy(() => {
  console.log('📦 Loading Customers...');
  return import('./pages/Customers').then(module => {
    console.log('✅ Customers loaded');
    return module;
  }).catch(err => {
    console.error('❌ Customers failed:', err);
    throw err;
  });
});

const Analytics = React.lazy(() => {
  console.log('📦 Loading Analytics...');
  return import('./pages/Analytics').then(module => {
    console.log('✅ Analytics loaded');
    return module;
  }).catch(err => {
    console.error('❌ Analytics failed:', err);
    throw err;
  });
});

const Messages = React.lazy(() => {
  console.log('📦 Loading Messages...');
  return import('./pages/Messages').then(module => {
    console.log('✅ Messages loaded');
    return module;
  }).catch(err => {
    console.error('❌ Messages failed:', err);
    throw err;
  });
});

const AIAgents = React.lazy(() => {
  console.log('📦 Loading AIAgents...');
  return import('./pages/AIAgents').then(module => {
    console.log('✅ AIAgents loaded');
    return module;
  }).catch(err => {
    console.error('❌ AIAgents failed:', err);
    throw err;
  });
});

function App() {
  console.log('🎨 App rendering...');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Router>
      <div className="app">
        <React.Suspense fallback={<div>Loading Navbar...</div>}>
          <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        </React.Suspense>
        
        <div className="app-container">
          <React.Suspense fallback={<div>Loading Sidebar...</div>}>
            <Sidebar isOpen={sidebarOpen} />
          </React.Suspense>
          
          <main className={`app-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
            <React.Suspense fallback={<div style={{ padding: '2rem' }}>Loading page...</div>}>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/ai-agents" element={<AIAgents />} />
              </Routes>
            </React.Suspense>
          </main>
        </div>
      </div>
    </Router>
  );
}

console.log('✅ App component ready');
export default App;
