// Invoice.jsx
import React from 'react';

function Invoice() {
  return (
    <div className="invoice-content">
      <div className="invoice-header">
        <h2>My Invoices</h2>
        <p>View and download your rental invoices</p>
      </div>

      <div className="empty-state">
        <div className="empty-icon">🧾</div>
        <h3>No Invoices Yet</h3>
        <p>Your invoices will appear here once you complete rental contracts.</p>
        <button className="primary-btn">
          View Contracts
        </button>
      </div>
    </div>
  );
}

export default Invoice;
