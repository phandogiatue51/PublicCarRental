// Contract.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { renterAPI } from "../../services/api";
import "../../styles/Account/Contract.css";

function Contract() {
  const role = localStorage.getItem("userRole");
  const renterId = localStorage.getItem("renterId");
  
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedContract, setSelectedContract] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [contractsPerPage] = useState(3); // Show 3 contracts per page

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
        // Fetch contracts for the specific renter
        const response = await fetch(`https://publiccarrental-production-b7c5.up.railway.app/api/EVRenter/${renterId}/contracts`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
          },
          signal: controller.signal
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setContracts(Array.isArray(data) ? data : []);
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
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
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

  // Pagination logic
  const indexOfLastContract = currentPage * contractsPerPage;
  const indexOfFirstContract = indexOfLastContract - contractsPerPage;
  const currentContracts = contracts.slice(indexOfFirstContract, indexOfLastContract);
  const totalPages = Math.ceil(contracts.length / contractsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Go to previous page
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Go to next page
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Reset to first page when contracts change
  useEffect(() => {
    setCurrentPage(1);
  }, [contracts]);

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

  if (!isAuthenticated()) {
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
        <>
          <div className="contracts-list">
            {currentContracts.map((contract) => (
            <div key={contract.contractId} className="contract-card">
              <div className="contract-header-card">
                <h3>Contract #{contract.contractId}</h3>
                {getStatusBadge(contract.status)}
              </div>
              
              <div className="contract-details">
                <div className="detail-row">
                  <span className="label">Vehicle:</span>
                  <span className="value">{contract.vehicleLicensePlate}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Rental Period:</span>
                  <span className="value">{formatDate(contract.startTime)} - {formatDate(contract.endTime)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Total Cost:</span>
                  <span className="value">₫{contract.totalCost?.toLocaleString() || '0'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Station:</span>
                  <span className="value">{contract.stationName || 'N/A'}</span>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {indexOfFirstContract + 1} to {Math.min(indexOfLastContract, contracts.length)} of {contracts.length} contracts
              </div>
              
              <div className="pagination">
                <button 
                  className="pagination-btn"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                
                <div className="pagination-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                    <button
                      key={number}
                      className={`pagination-number ${currentPage === number ? 'active' : ''}`}
                      onClick={() => paginate(number)}
                    >
                      {number}
                    </button>
                  ))}
                </div>
                
                <button 
                  className="pagination-btn"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Contract Detail Modal */}
      {showDetailModal && selectedContract && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={closeDetailModal}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '30px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px',
              borderBottom: '1px solid #e0e0e0',
              backgroundColor: '#f8f9fa',
              borderRadius: '100px 100px 0 0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <h3 style={{ margin: 0, color: '#333', fontSize: '1.5rem' }}>Contract Details #{selectedContract.contractId}</h3>
                {getStatusBadge(selectedContract.status)}
              </div>
              <button 
                onClick={closeDetailModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '5px',
                  borderRadius: '50%'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ padding: '25px' }}>
              <div>
                <div style={{ marginBottom: '30px' }}>
                  <h4 style={{ color: '#333', marginBottom: '15px', fontSize: '1.3rem' }}>Contract Information</h4>
                  <p style={{ marginBottom: '10px', fontSize: '1.1rem' }}><strong>Invoice ID:</strong> {selectedContract.invoiceId || 'N/A'}</p>
                  <p style={{ marginBottom: '10px', fontSize: '1.1rem' }}><strong>Station:</strong> {selectedContract.stationName}</p>
                </div>

                <div style={{ marginBottom: '30px' }}>
                  <h4 style={{ color: '#333', marginBottom: '15px', fontSize: '1.3rem' }}>Rental Information</h4>
                  <p style={{ marginBottom: '10px', fontSize: '1.1rem' }}><strong>Start Time:</strong> {formatDate(selectedContract.startTime)}</p>
                  <p style={{ marginBottom: '10px', fontSize: '1.1rem' }}><strong>End Time:</strong> {formatDate(selectedContract.endTime)}</p>
                </div>

                <div>
                  <h4 style={{ color: '#333', marginBottom: '15px', fontSize: '1.3rem' }}>Staff Information</h4>
                  <p style={{ marginBottom: '10px', fontSize: '1.1rem' }}><strong>Staff Name:</strong> {selectedContract.staffName || 'Not assigned'}</p>
                </div>
              </div>
            </div>

            <div style={{
              padding: '25px',
              borderTop: '1px solid #e0e0e0',
              backgroundColor: '#f8f9fa',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderRadius: '0 0 100px 100px'
            }}>
              <div style={{
                fontSize: '1.4rem',
                fontWeight: 'bold',
                color: '#28a745'
              }}>
                Total Cost: ₫{selectedContract.totalCost?.toLocaleString() || '0'} 🤑
              </div>
              <button 
                onClick={closeDetailModal}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
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
