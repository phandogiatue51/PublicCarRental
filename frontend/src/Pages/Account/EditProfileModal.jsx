// EditProfileModal.jsx
import { useState, useEffect } from 'react';
import { renterAPI } from "../../services/api";
import "../../styles/Account/Modal.css"; // Assuming a shared modal style

function EditProfileModal({ isOpen, onClose, initialData, renterId, onSuccess }) {
  const [formData, setFormData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!renterId) {
      setMessage("Renter ID is missing.");
      setIsError(true);
      return;
    }

    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      // The API expects the full object, including unchanged fields
      // The fields listed in the API example are: 
      // fullName, email, phoneNumber, identityCardNumber, licenseNumber
      const payload = {
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          identityCardNumber: formData.identityCardNumber,
          licenseNumber: formData.licenseNumber,
      };

      await renterAPI.updateRenter(renterId, payload);
      
      setMessage('Profile updated successfully!');
      setIsError(false);
      
      // Update local storage for immediate reflection in the main component
      localStorage.setItem("fullName", formData.fullName);
      localStorage.setItem("email", formData.email);
      localStorage.setItem("phoneNumber", formData.phoneNumber);
      
      // Call the callback to refresh the parent component's data
      onSuccess(); 
      setTimeout(onClose, 1500); // Close after showing success message
    } catch (error) {
      setMessage(error.message || 'Failed to update profile. Please try again.');
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h3>Edit Profile</h3>
        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>

          {/* Email (Often disabled or requires re-verification, but editable here) */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Phone Number */}
          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
            />
          </div>
          
          {/* Identity Card Number (Read-only or requires different update flow if sensitive) */}
          <div className="form-group">
            <label htmlFor="identityCardNumber">Identity Card Number</label>
            <input
              type="text"
              id="identityCardNumber"
              name="identityCardNumber"
              value={formData.identityCardNumber}
              onChange={handleChange}
            />
          </div>

          {/* License Number */}
          <div className="form-group">
            <label htmlFor="licenseNumber">License Number</label>
            <input
              type="text"
              id="licenseNumber"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleChange}
            />
          </div>

          {message && (
            <p className={`message ${isError ? 'error-message' : 'success-message'}`}>
              {message}
            </p>
          )}

          <div className="modal-actions">
            <button type="submit" disabled={loading} className="primary-btn">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" onClick={onClose} className="secondary-btn" disabled={loading}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfileModal;