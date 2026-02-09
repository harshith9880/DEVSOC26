import React from 'react';
import './FilterTabs.css';

const FilterTabs = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="filter-tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`filter-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label} {tab.count !== undefined && `(${tab.count})`}
        </button>
      ))}
    </div>
  );
};

export default FilterTabs;
