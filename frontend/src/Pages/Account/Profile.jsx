// Profile.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { renterAPI } from "../../services/api";
import "../../styles/Account/Profile.css";

function Profile() {
  const role = localStorage.getItem("userRole");
  const storedFullName = localStorage.getItem("fullName");
  const storedEmail = localStorage.getItem("email");
  const storedPhoneNumber = localStorage.getItem("phoneNumber");
  const renterId = localStorage.getItem("renterId");

  const [profileData, setProfileData] = useState({
    fullName: storedFullName || "",
    email: storedEmail || "",
    phoneNumber: storedPhoneNumber || "",
    identityCardNumber: "",
    licenseNumber: "",
    status: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadProfile() {
      if (!renterId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const data = await renterAPI.getById(renterId);
        setProfileData({
          fullName: data.fullName || storedFullName || "",
          email: data.email || storedEmail || "",
          phoneNumber: data.phoneNumber || storedPhoneNumber || "",
          identityCardNumber: data.identityCardNumber || "",
          licenseNumber: data.licenseNumber || "",
          status: data.status !== undefined ? data.status : 0
        });
        // cache for later sessions
        if (data.fullName) localStorage.setItem("fullName", data.fullName);
        if (data.email) localStorage.setItem("email", data.email);
        if (data.phoneNumber) localStorage.setItem("phoneNumber", data.phoneNumber);
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
    return () => controller.abort();
  }, [renterId, storedEmail, storedFullName, storedPhoneNumber]);

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

  if (!isAuthenticated()) {
    return (
      <div className="empty-state">
        <h3>Access Denied</h3>
        <p>Please log in to view your profile.</p>
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