import { useState } from 'react';
import { renterAPI } from "../../services/api";
import "../../styles/Account/Modal.css"; // Assuming a shared modal style

function ChangePasswordModal({ isOpen, onClose, renterId }) {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!renterId) {
      setMessage("Renter ID is missing.");
      setIsError(true);
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage("New password and confirmation password do not match.");
      setIsError(true);
      return;
    }

    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      await renterAPI.changePassword(renterId, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });
      
      setMessage('Password updated successfully!');
      setIsError(false);
      // Clear form data on success
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(onClose, 1500); // Close after showing success message
    } catch (error) {
      setMessage(error.message || 'Failed to change password. Please check your current password.');
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h3>Change Password</h3>
        <form onSubmit={handleSubmit}>
          {/* Current Password */}
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handleChange}
              required
            />
          </div>

          {/* New Password */}
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handleChange}
              required
              minLength="6" // Add basic validation
            />
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handleChange}
              required
              minLength="6" // Add basic validation
            />
          </div>

          {message && (
            <p className={`message ${isError ? 'error-message' : 'success-message'}`}>
              {message}
            </p>
          )}

          <div className="modal-actions">
            <button type="submit" disabled={loading} className="primary-btn">
              {loading ? 'Updating...' : 'Change Password'}
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

export default ChangePasswordModal;