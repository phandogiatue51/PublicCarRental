// Contract.jsx
import React from 'react';

function Contract() {
  return (
    <div className="contract-content">
      <div className="contract-header">
        <h2>My Contracts</h2>
        <p>View and manage your rental contracts</p>
      </div>

      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <h3>No Contracts Yet</h3>
        <p>You haven't made any rental contracts yet. Start exploring our vehicles to create your first contract!</p>
        <button className="primary-btn">
          Browse Vehicles
        </button>
      </div>
    </div>
  );
}

export default Contract;
