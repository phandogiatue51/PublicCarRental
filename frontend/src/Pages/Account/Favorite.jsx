// Favorite.jsx
import React from 'react';

function Favorite() {
  return (
    <div className="favorite-content">
      <div className="favorite-header">
        <h2>My Favorites</h2>
        <p>Save vehicles you're interested in for later</p>
      </div>

      <div className="empty-state">
        <div className="empty-icon">❤️</div>
        <h3>No Favorites Yet</h3>
        <p>Start adding vehicles to your favorites by clicking the heart icon on any vehicle.</p>
        <button className="primary-btn">
          Browse Vehicles
        </button>
      </div>
    </div>
  );
}

export default Favorite;
