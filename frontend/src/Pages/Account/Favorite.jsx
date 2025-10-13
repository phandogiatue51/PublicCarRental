// Favorite.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { renterAPI } from "../../services/api";
import "../../styles/Account/Favorite.css";

function Favorite() {
  const navigate = useNavigate();
  const { isAuthenticated, getCurrentUser } = useAuth();
  const currentUser = getCurrentUser();
  const role = currentUser?.role;
  const renterId = currentUser?.renterId;
  
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFavorite, setSelectedFavorite] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [favoritesPerPage] = useState(4); // Show 3 favorites per page

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
            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
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
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
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
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
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

  if (!isAuthenticated()) {
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
          <div className="favorites-grid">
            {currentFavorites.map((favorite) => (
            <div key={favorite.favoriteId} className="favorite-card">
              <div className="favorite-image-container">
                <img 
                  src={favorite.imageUrl} 
                  alt={`${favorite.brandName} ${favorite.name}`}
                  className="favorite-image"
                  onError={(e) => {
                    e.target.src = '/placeholder-car.png';
                  }}
                />
                <div className="favorite-overlay">
                  <button 
                    className="remove-favorite-btn-overlay"
                    onClick={() => handleRemoveFavorite(favorite.favoriteId)}
                    title="Remove from favorites"
                  >
                    ❤️
                  </button>
                </div>
              </div>
              
                <div className="favorite-content">
                <div className="favorite-header">
                  <h3 className="favorite-title">{favorite.brandName} {favorite.name}</h3>
                  <span className="favorite-type">{favorite.typeName}</span>
                </div>
                
                <div className="favorite-price">
                  <span className="price-label">Price per hour</span>
                  <span className="price-value">₫{favorite.pricePerHour?.toLocaleString() || '0'}</span>
                </div>
                
                <div className="favorite-actions">
                  <button 
                    className="view-details-btn"
                    onClick={() => navigate(`/models?vehicleId=${favorite.vehicleId || favorite.id}`)}
                  >
                    Rent Now
                  </button>
                </div>
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
                <h3 style={{ margin: 0, color: '#333', fontSize: '1.5rem' }}>{selectedFavorite.brandName} {selectedFavorite.name}</h3>
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
            
            <div style={{ padding: '0' }}>
              {/* Hero Image Section */}
              <div style={{
                height: '250px',
                backgroundImage: `url(${selectedFavorite.imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                position: 'relative',
                borderRadius: '0'
              }}>
                <div style={{
                  position: 'absolute',
                  bottom: '0',
                  left: '0',
                  right: '0',
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                  padding: '20px',
                  color: 'white'
                }}>
                  <h2 style={{ margin: '0', fontSize: '1.8rem', fontWeight: 'bold' }}>
                    {selectedFavorite.brandName} {selectedFavorite.name}
                  </h2>
                  <p style={{ margin: '5px 0 0 0', fontSize: '1.1rem', opacity: '0.9' }}>
                    {selectedFavorite.typeName}
                  </p>
                </div>
              </div>

              {/* Content Section */}
              <div style={{ padding: '25px' }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '30px',
                  marginBottom: '25px'
                }}>
                  <div>
                    <h4 style={{ color: '#333', marginBottom: '15px', fontSize: '1.2rem' }}>Vehicle Details</h4>
                    <div style={{ 
                      background: '#f8f9fa', 
                      padding: '15px', 
                      borderRadius: '8px',
                      border: '1px solid #e9ecef'
                    }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>
                        <strong>Brand:</strong> {selectedFavorite.brandName}
                      </p>
                      <p style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>
                        <strong>Model:</strong> {selectedFavorite.name}
                      </p>
                      <p style={{ margin: '0', fontSize: '1rem' }}>
                        <strong>Type:</strong> {selectedFavorite.typeName}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ color: '#333', marginBottom: '15px', fontSize: '1.2rem' }}>Pricing</h4>
                    <div style={{ 
                      background: 'linear-gradient(135deg, #28a745, #20c997)', 
                      padding: '20px', 
                      borderRadius: '8px',
                      color: 'white',
                      textAlign: 'center'
                    }}>
                      <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', opacity: '0.9' }}>
                        Price per hour
                      </p>
                      <p style={{ margin: '0', fontSize: '1.8rem', fontWeight: 'bold' }}>
                        ₫{selectedFavorite.pricePerHour?.toLocaleString() || '0'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              padding: '20px 25px',
              borderTop: '1px solid #e0e0e0',
              backgroundColor: '#f8f9fa',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderRadius: '0 0 30px 30px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.2rem' }}>🚗</span>
                <span style={{ fontSize: '1rem', color: '#666' }}>
                  Ready to rent this vehicle?
                </span>
              </div>
              <button 
                onClick={closeDetailModal}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
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
