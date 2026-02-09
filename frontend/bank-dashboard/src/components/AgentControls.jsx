import React, { useState } from 'react';
import { Play, Pause, RefreshCw, Settings } from 'lucide-react';
import './AgentControls.css';

const AgentControls = ({ status, onStart, onStop, onRefresh }) => {
  const [batchSize, setBatchSize] = useState(10);

  const handleStart = () => {
    if (onStart) onStart({ batch_size: batchSize });
  };

  return (
    <div className="agent-controls">
      <div className="control-section">
        <h3>Agent Control Panel</h3>
        
        <div className="status-indicator">
          <div className={`status-dot status-${status || 'stopped'}`}></div>
          <span className="status-text">
            Status: <strong>{status || 'Stopped'}</strong>
          </span>
        </div>

        <div className="control-buttons">
          {status === 'running' ? (
            <button className="btn btn-danger" onClick={onStop}>
              <Pause size={18} />
              Stop Agent
            </button>
          ) : (
            <button className="btn btn-success" onClick={handleStart}>
              <Play size={18} />
              Start Agent
            </button>
          )}
          
          <button className="btn btn-secondary" onClick={onRefresh}>
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        <div className="control-settings">
          <label>
            Batch Size:
            <input
              type="number"
              value={batchSize}
              onChange={(e) => setBatchSize(parseInt(e.target.value) || 10)}
              min="1"
              max="50"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default AgentControls;
