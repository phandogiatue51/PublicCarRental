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
  const [selectedContract, setSelectedContract] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

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

  const handleViewDetails = async (contractId) => {
    setDetailLoading(true);
    setError("");
    try {
      const response = await fetch(`https://publiccarrental-production-b7c5.up.railway.app/api/Contract/${contractId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contractDetail = await response.json();
      setSelectedContract(contractDetail);
      setShowDetailModal(true);
    } catch (e) {
      setError(e.message || "Failed to load contract details");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedContract(null);
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
                <button 
                  className="view-details-btn"
                  onClick={() => handleViewDetails(contract.contractId)}
                  disabled={detailLoading}
                >
                  {detailLoading ? 'Loading...' : 'View Details'}
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

      {/* Contract Detail Modal */}
      {showDetailModal && selectedContract && (
        <div className="modal-overlay" onClick={closeDetailModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Contract Details #{selectedContract.contractId}</h3>
              <button className="close-btn" onClick={closeDetailModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="detail-section">
                <h4>Contract Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Contract ID:</span>
                    <span className="value">{selectedContract.contractId}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Status:</span>
                    <span className="value">{getStatusBadge(selectedContract.status)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Invoice ID:</span>
                    <span className="value">{selectedContract.invoiceId || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Renter Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Renter ID:</span>
                    <span className="value">{selectedContract.evRenterId}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Renter Name:</span>
                    <span className="value">{selectedContract.evRenterName}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Vehicle Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Vehicle ID:</span>
                    <span className="value">{selectedContract.vehicleId}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">License Plate:</span>
                    <span className="value">{selectedContract.vehicleLicensePlate}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Rental Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Start Time:</span>
                    <span className="value">{formatDate(selectedContract.startTime)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">End Time:</span>
                    <span className="value">{formatDate(selectedContract.endTime)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Total Cost:</span>
                    <span className="value">₫{selectedContract.totalCost?.toLocaleString() || '0'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Station Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Station ID:</span>
                    <span className="value">{selectedContract.stationId}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Station Name:</span>
                    <span className="value">{selectedContract.stationName}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Staff Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Staff ID:</span>
                    <span className="value">{selectedContract.staffId || 'Not assigned'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Staff Name:</span>
                    <span className="value">{selectedContract.staffName || 'Not assigned'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Images</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Image In:</span>
                    <span className="value">{selectedContract.imageIn ? 'Available' : 'Not available'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Image Out:</span>
                    <span className="value">{selectedContract.imageOut ? 'Available' : 'Not available'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="close-modal-btn" onClick={closeDetailModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Contract;
