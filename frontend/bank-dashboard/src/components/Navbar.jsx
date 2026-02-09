import React from 'react';
import { Menu, Bell, User } from 'lucide-react';
import './Navbar.css';

const Navbar = ({ onMenuClick }) => {
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-left">
          <button className="menu-btn" onClick={onMenuClick}>
            <Menu size={24} />
          </button>
          <h1 className="navbar-title">🏦 Bank Dashboard</h1>
        </div>
        
        <div className="navbar-right">
          <button className="navbar-icon-btn">
            <Bell size={20} />
          </button>
          <button className="navbar-icon-btn">
            <User size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
