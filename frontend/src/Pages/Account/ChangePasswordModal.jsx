import { useState } from 'react';
import { renterAPI } from "../../services/api";
import "../../styles/Account/Modal.css";

function ChangePasswordModal({ isOpen, onClose, renterId }) {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Add the same toast function from EditProfileModal
  const showToast = (message, type = 'error') => {
    const existingToasts = document.querySelectorAll('.custom-toast');
    existingToasts.forEach(toast => toast.remove());

    const toast = document.createElement('div');
    toast.className = `custom-toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-message">${message}</span>
        <button class="toast-close">&times;</button>
      </div>
    `;

    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#4CAF50' : '#f44336'};
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      min-width: 300px;
      max-width: 500px;
      animation: slideIn 0.3s ease-out;
    `;

    const toastContent = toast.querySelector('.toast-content');
    toastContent.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 15px;
    `;

    const toastMessage = toast.querySelector('.toast-message');
    toastMessage.style.cssText = `
      flex: 1;
      font-size: 14px;
      font-weight: 500;
    `;

    const toastClose = toast.querySelector('.toast-close');
    toastClose.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background-color 0.2s;
    `;

    toastClose.onmouseover = () => {
      toastClose.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    };
    toastClose.onmouseout = () => {
      toastClose.style.backgroundColor = 'transparent';
    };

    toastClose.addEventListener('click', () => {
      toast.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => toast.remove(), 300);
    });

    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => toast.remove(), 300);
      }
    }, 5000);

    if (!document.querySelector('#toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(toast);
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!renterId) {
      showToast("Renter ID is missing.", 'error');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast("New password and confirmation password do not match.", 'error');
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
      
      // Show success toast
      showToast('Password updated successfully!', 'success');
      
      // Also show in form for accessibility
      setMessage('Password updated successfully!');
      setIsError(false);
      
      // Clear form data on success
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(onClose, 1500);
    } catch (error) {
      // Extract just the error message from the response
      let errorMessage = 'Failed to change password. Please check your current password.';
      
      if (error.message) {
        try {
          const errorMatch = error.message.match(/\{"error":"([^"]+)"\}/);
          if (errorMatch && errorMatch[1]) {
            errorMessage = errorMatch[1];
          } else {
            const messageMatch = error.message.match(/error":"([^"]+)"/);
            if (messageMatch && messageMatch[1]) {
              errorMessage = messageMatch[1];
            } else {
              errorMessage = error.message.replace(/HTTP error! status: \d+ - /, '');
            }
          }
        } catch (parseError) {
          errorMessage = error.message.replace(/HTTP error! status: \d+ - /, '');
        }
      }

      // Show error toast
      showToast(errorMessage, 'error');
      
      // Also show in form for accessibility
      setMessage(errorMessage);
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

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handleChange}
              required
              minLength="6"
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