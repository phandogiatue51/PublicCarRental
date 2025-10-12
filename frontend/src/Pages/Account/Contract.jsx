// Contract.jsx
import { useState, useEffect } from "react";
import { renterAPI } from "../../services/api";
import "../../styles/Account/Contract.css";

function Contract() {
  const role = sessionStorage.getItem("userRole");
  const renterId = sessionStorage.getItem("renterId");
  
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadContracts() {
      if (!renterId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        // Fetch all contracts and filter by renter ID
        const response = await fetch(`https://publiccarrental-production-b7c5.up.railway.app/api/Contract/all`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          },
          signal: controller.signal
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        // Filter contracts for the current renter
        const renterContracts = Array.isArray(data) 
          ? data.filter(contract => contract.evRenterId === parseInt(renterId))
          : [];
        setContracts(renterContracts);
      } catch (e) {
        if (e.name !== "AbortError") {
          setError(e.message || "Failed to load contracts");
        }
      } finally {
        setLoading(false);
      }
    }
    loadContracts();
    return () => controller.abort();
  }, [renterId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      0: { text: 'Pending', class: 'pending' },
      1: { text: 'Confirmed', class: 'confirmed' },
      2: { text: 'Active', class: 'active' },
      3: { text: 'Completed', class: 'completed' },
      4: { text: 'Cancelled', class: 'cancelled' }
    };
    const statusInfo = statusMap[status] || { text: 'Unknown', class: 'unknown' };
    return (
      <span className={`status-badge ${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading contracts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="empty-state">
        <h3>Access Denied</h3>
        <p>Please log in to view your contracts.</p>
      </div>
    );
  }

  return (
    <div className="contract-content">
      <div className="contract-header">
        <h2>My Contracts</h2>
        <p>View and manage your rental contracts</p>
      </div>

      {contracts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No Contracts Yet</h3>
          <p>You haven't made any rental contracts yet. Start exploring our vehicles to create your first contract!</p>
          <button className="primary-btn">
            Browse Vehicles
          </button>
        </div>
      ) : (
        <div className="contracts-list">
          {contracts.map((contract) => (
            <div key={contract.contractId} className="contract-card">
              <div className="contract-header-card">
                <h3>Contract #{contract.contractId}</h3>
                {getStatusBadge(contract.status)}
              </div>
              
              <div className="contract-details">
                <div className="detail-row">
                  <span className="label">Renter:</span>
                  <span className="value">{contract.evRenterName}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Vehicle License:</span>
                  <span className="value">{contract.vehicleLicensePlate}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Start Time:</span>
                  <span className="value">{formatDate(contract.startTime)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">End Time:</span>
                  <span className="value">{formatDate(contract.endTime)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Total Cost:</span>
                  <span className="value">₫{contract.totalCost?.toLocaleString() || '0'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Station:</span>
                  <span className="value">{contract.stationName || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Staff:</span>
                  <span className="value">{contract.staffName || 'Not assigned'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Invoice ID:</span>
                  <span className="value">{contract.invoiceId || 'N/A'}</span>
                </div>
              </div>

              <div className="contract-actions">
                <button className="view-details-btn">
                  View Details
                </button>
                {contract.status === 0 && (
                  <button className="cancel-contract-btn">
                    Cancel Contract
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Contract;
