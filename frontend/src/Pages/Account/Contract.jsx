import { useState, useEffect, useCallback } from "react";
import { contractAPI, renterAPI } from "../../services/api"; 
import RateModal from "./RateModal";
import "../../styles/Account/Contract.css";

function Contract() {
  const renterId = localStorage.getItem("renterId");
  
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedContract, setSelectedContract] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [selectedContractForRating, setSelectedContractForRating] = useState(null);
  
  const isAuthenticated = () => {
    return !!localStorage.getItem("jwtToken"); 
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [contractsPerPage] = useState(3);

  const loadContracts = useCallback(async () => {
    if (!renterId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await renterAPI.getContracts(renterId);
      setContracts(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to load contracts");
    } finally {
      setLoading(false);
    }
  }, [renterId]); 

  useEffect(() => {
    const controller = new AbortController();
    loadContracts();
    return () => controller.abort();
  }, [loadContracts]); 

  const handleRateExperience = (contract) => {
    setSelectedContractForRating(contract);
    setShowRateModal(true);
  };

  const handleRatingSubmitted = () => {
    // Refresh contracts to update isRated status
    loadContracts();
  };

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
      0: { text: 'To Be Confirmed', class: 'tobeconfirmed' },
      1: { text: 'Active', class: 'active' },
      2: { text: 'Completed', class: 'completed' },
      3: { text: 'Cancelled', class: 'cancelled' },
      4: { text: 'Confirmed', class: 'confirmed' }
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
      const contractDetail = await contractAPI.getById(contractId);
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
                  
                  {/* Show Rate button only for completed contracts that haven't been rated */}
                  {contract.status === 2 && !contract.isRated && (
                    <button 
                      className="rate-experience-btn"
                      onClick={() => handleRateExperience(contract)}
                    >
                      ⭐ Rate Your Experience
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
            maxWidth: '700px',
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
            {/* Contract Information */}
            <div style={{ marginBottom: '30px' }}>
              <h4 style={{ color: '#333', marginBottom: '15px', fontSize: '1.3rem' }}>Contract Information</h4>
              <p style={{ marginBottom: '10px', fontSize: '1.1rem' }}><strong>Station:</strong> {selectedContract.stationName}</p>
              <p style={{ marginBottom: '10px', fontSize: '1.1rem' }}><strong>Vehicle:</strong> {selectedContract.vehicleLicensePlate}</p>
            </div>

            {/* Rental Information */}
            <div style={{ marginBottom: '30px' }}>
              <h4 style={{ color: '#333', marginBottom: '15px', fontSize: '1.3rem' }}>Rental Information</h4>
              <p style={{ marginBottom: '10px', fontSize: '1.1rem' }}><strong>Start Time:</strong> {formatDate(selectedContract.startTime)}</p>
              <p style={{ marginBottom: '10px', fontSize: '1.1rem' }}><strong>End Time:</strong> {formatDate(selectedContract.endTime)}</p>
            </div>

            {/* Staff Information */}
            <div style={{ marginBottom: '30px' }}>
              <h4 style={{ color: '#333', marginBottom: '15px', fontSize: '1.3rem' }}>Staff Information</h4>
              <p style={{ marginBottom: '10px', fontSize: '1.1rem' }}><strong>Staff Name:</strong> {selectedContract.staffName || 'Not assigned'}</p>
            </div>

            {/* Invoices Section */}
            {selectedContract.invoices && selectedContract.invoices.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h4 style={{ color: '#333', marginBottom: '15px', fontSize: '1.3rem' }}>Invoices</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {selectedContract.invoices.map((invoice) => (
                    <div 
                      key={invoice.invoiceId}
                      style={{
                        border: '1px solid #e0e0e0',
                        borderRadius: '10px',
                        padding: '15px',
                        backgroundColor: '#f8f9fa'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                          <strong style={{ fontSize: '1.1rem', color: '#333' }}>Invoice #{invoice.invoiceId}</strong>
                          <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '5px' }}>
                            Order Code: {invoice.orderCode}
                          </div>
                        </div>
                        <div style={{ 
                          padding: '4px 8px', 
                          borderRadius: '12px', 
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          backgroundColor: invoice.status === 1 ? '#d4edda' : '#fff3cd',
                          color: invoice.status === 1 ? '#155724' : '#856404'
                        }}>
                          {invoice.status === 1 ? 'PAID' : 'PENDING'}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '1rem', marginBottom: '5px' }}>
                            <strong>Amount Paid:</strong> ₫{invoice.amountPaid?.toLocaleString() || '0'}
                          </div>
                          {invoice.note && (
                            <div style={{ fontSize: '0.9rem', color: '#666', fontStyle: 'italic' }}>
                              Note: {invoice.note}
                            </div>
                          )}
                          <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '5px' }}>
                            Paid: {formatDate(invoice.paidAt)}
                          </div>
                        </div>
                    
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Invoices Message */}
            {(!selectedContract.invoices || selectedContract.invoices.length === 0) && (
              <div style={{ 
                textAlign: 'center', 
                padding: '20px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '10px',
                color: '#666'
              }}>
                No invoices available for this contract
              </div>
            )}
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
              Total Cost: ₫{selectedContract.totalCost?.toLocaleString() || '0'}
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
      {/* Rate Modal */}
      <RateModal
        contract={selectedContractForRating}
        isOpen={showRateModal}
        onClose={() => setShowRateModal(false)}
        onRatingSubmitted={handleRatingSubmitted}
      />
      
    </div>
  );
}

export default Contract;