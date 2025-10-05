// Profile.jsx
import { useAuth } from "../../hooks/useAuth";
import { useState, useEffect } from "react";
import { renterAPI } from "../../services/api";
import "../../styles/Account/Profile.css";

function Profile() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        // For now, we'll use mock data since the API will be connected later
        // const data = await renterAPI.getById(user.renterId);
        
        // Mock data based on the API response you showed
        const mockData = {
          renterId: user.renterId || 1,
          fullName: "Phan Do Gia Tue",
          email: user.email || "phandogiatue51@gmail.com",
          phoneNumber: "0901697330",
          identityCardNumber: "045678901",
          licenseNumber: "B123456789",
          status: 0
        };
        
        setProfileData(mockData);
      } catch (err) {
        setError("Failed to load profile data");
        console.error("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfileData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <h3>Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="empty-state">
        <h3>No Profile Data</h3>
        <p>Unable to load profile information.</p>
      </div>
    );
  }

  return (
    <div className="profile-content">
      <div className="profile-header">
        <h2>Profile Information</h2>
        <p>Manage your personal details and account settings</p>
      </div>

      <div className="profile-details">
        <div className="detail-group">
          <h3>Personal Information</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Full Name</label>
              <div className="detail-value">{profileData.fullName}</div>
            </div>
            <div className="detail-item">
              <label>Email</label>
              <div className="detail-value">{profileData.email}</div>
            </div>
            <div className="detail-item">
              <label>Phone Number</label>
              <div className="detail-value">{profileData.phoneNumber}</div>
            </div>
          </div>
        </div>

        <div className="detail-group">
          <h3>Identity Information</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Identity Card Number</label>
              <div className="detail-value">{profileData.identityCardNumber}</div>
            </div>
            <div className="detail-item">
              <label>License Number</label>
              <div className="detail-value">{profileData.licenseNumber}</div>
            </div>
            <div className="detail-item">
              <label>Account Status</label>
              <div className="detail-value">
                <span className={`status-badge ${profileData.status === 0 ? 'active' : 'inactive'}`}>
                  {profileData.status === 0 ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-actions">
        <button className="edit-profile-btn">
          Edit Profile
        </button>
        <button className="change-password-btn">
          Change Password
        </button>
      </div>
    </div>
  );
}

export default Profile;