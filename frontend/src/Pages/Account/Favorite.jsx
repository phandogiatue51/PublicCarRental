// Favorite.jsx
import { useState, useEffect } from "react";
import { renterAPI } from "../../services/api";
import "../../styles/Account/Favorite.css";

function Favorite() {
  const role = sessionStorage.getItem("userRole");
  const renterId = sessionStorage.getItem("renterId");
  
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFavorite, setSelectedFavorite] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [favoritesPerPage] = useState(3); // Show 3 favorites per page

  useEffect(() => {
    const controller = new AbortController();
    async function loadFavorites() {
      if (!renterId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        // Fetch favorites for the specific renter
        const response = await fetch(`https://publiccarrental-production-b7c5.up.railway.app/api/EVRenter/${renterId}/favorites`, {
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
        setFavorites(Array.isArray(data) ? data : []);
      } catch (e) {
        if (e.name !== "AbortError") {
          setError(e.message || "Failed to load favorites");
        }
      } finally {
        setLoading(false);
      }
    }
    loadFavorites();
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
      0: { text: 'Available', class: 'available' },
      1: { text: 'Rented', class: 'rented' },
      2: { text: 'Maintenance', class: 'maintenance' },
      3: { text: 'Unavailable', class: 'unavailable' }
    };
    const statusInfo = statusMap[status] || { text: 'Unknown', class: 'unknown' };
    return (
      <span className={`status-badge ${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    );
  };

  const handleViewDetails = async (vehicleId) => {
    setDetailLoading(true);
    setError("");
    try {
      const response = await fetch(`https://publiccarrental-production-b7c5.up.railway.app/api/Vehicle/${vehicleId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const vehicleDetail = await response.json();
      setSelectedFavorite(vehicleDetail);
      setShowDetailModal(true);
    } catch (e) {
      setError(e.message || "Failed to load vehicle details");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedFavorite(null);
  };

  const handleRemoveFavorite = async (favoriteId) => {
    try {
      const response = await fetch(`https://publiccarrental-production-b7c5.up.railway.app/api/Favorite/${favoriteId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        // Remove from local state
        setFavorites(favorites.filter(fav => fav.favoriteId !== favoriteId));
      }
    } catch (e) {
      setError(e.message || "Failed to remove favorite");
    }
  };

  // Pagination logic
  const indexOfLastFavorite = currentPage * favoritesPerPage;
  const indexOfFirstFavorite = indexOfLastFavorite - favoritesPerPage;
  const currentFavorites = favorites.slice(indexOfFirstFavorite, indexOfLastFavorite);
  const totalPages = Math.ceil(favorites.length / favoritesPerPage);

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

  // Reset to first page when favorites change
  useEffect(() => {
    setCurrentPage(1);
  }, [favorites]);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading favorites...</p>
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
        <p>Please log in to view your favorites.</p>
      </div>
    );
  }

  return (
    <div className="favorite-content">
      <div className="favorite-header">
        <h2>My Favorites</h2>
        <p>Save vehicles you're interested in for later</p>
      </div>

      {favorites.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">❤️</div>
          <h3>No Favorites Yet</h3>
          <p>Start adding vehicles to your favorites by clicking the heart icon on any vehicle.</p>
          <button className="primary-btn">
            Browse Vehicles
          </button>
        </div>
      ) : (
        <>
          <div className="favorites-list">
            {currentFavorites.map((favorite) => (
            <div key={favorite.favoriteId} className="favorite-card">
              <div className="favorite-header-card">
                <h3>{favorite.vehicle?.brand} {favorite.vehicle?.model}</h3>
                {getStatusBadge(favorite.vehicle?.status)}
              </div>
              
              <div className="favorite-details">
                <div className="detail-row">
                  <span className="label">License Plate:</span>
                  <span className="value">{favorite.vehicle?.licensePlate}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Type:</span>
                  <span className="value">{favorite.vehicle?.type?.name}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Daily Rate:</span>
                  <span className="value">₫{favorite.vehicle?.dailyRate?.toLocaleString() || '0'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Added Date:</span>
                  <span className="value">{formatDate(favorite.addedDate)}</span>
                </div>
              </div>

              <div className="favorite-actions">
                <button 
                  className="view-details-btn"
                  onClick={() => handleViewDetails(favorite.vehicleId)}
                  disabled={detailLoading}
                >
                  {detailLoading ? 'Loading...' : 'View Details'}
                </button>
                <button 
                  className="remove-favorite-btn"
                  onClick={() => handleRemoveFavorite(favorite.favoriteId)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {indexOfFirstFavorite + 1} to {Math.min(indexOfLastFavorite, favorites.length)} of {favorites.length} favorites
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

      {/* Vehicle Detail Modal */}
      {showDetailModal && selectedFavorite && (
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
              borderRadius: '30px 30px 0 0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <h3 style={{ margin: 0, color: '#333', fontSize: '1.5rem' }}>{selectedFavorite.brand} {selectedFavorite.model}</h3>
                {getStatusBadge(selectedFavorite.status)}
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
                  <h4 style={{ color: '#333', marginBottom: '15px', fontSize: '1.3rem' }}>Vehicle Information</h4>
                  <p style={{ marginBottom: '10px', fontSize: '1.1rem' }}><strong>License Plate:</strong> {selectedFavorite.licensePlate}</p>
                  <p style={{ marginBottom: '10px', fontSize: '1.1rem' }}><strong>Type:</strong> {selectedFavorite.type?.name}</p>
                </div>

                <div style={{ marginBottom: '30px' }}>
                  <h4 style={{ color: '#333', marginBottom: '15px', fontSize: '1.3rem' }}>Pricing Information</h4>
                  <p style={{ marginBottom: '10px', fontSize: '1.1rem' }}><strong>Daily Rate:</strong> ₫{selectedFavorite.dailyRate?.toLocaleString() || '0'}</p>
                  <p style={{ marginBottom: '10px', fontSize: '1.1rem' }}><strong>Hourly Rate:</strong> ₫{selectedFavorite.hourlyRate?.toLocaleString() || '0'}</p>
                </div>

                <div>
                  <h4 style={{ color: '#333', marginBottom: '15px', fontSize: '1.3rem' }}>Location Information</h4>
                  <p style={{ marginBottom: '10px', fontSize: '1.1rem' }}><strong>Station:</strong> {selectedFavorite.station?.name || 'N/A'}</p>
                  <p style={{ marginBottom: '10px', fontSize: '1.1rem' }}><strong>Address:</strong> {selectedFavorite.station?.address || 'N/A'}</p>
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
              borderRadius: '0 0 30px 30px'
            }}>
              <div style={{
                fontSize: '1.4rem',
                fontWeight: 'bold',
                color: '#28a745'
              }}>
                Daily Rate: ₫{selectedFavorite.dailyRate?.toLocaleString() || '0'} 🚗
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

export default Favorite;
