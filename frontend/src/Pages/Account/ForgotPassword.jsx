import React, { useState } from "react";
import { accountAPI } from "../../services/api";
import "./../../styles/ForgotPassword.css";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await accountAPI.forgotPassword(email);
      setMessage("Password reset email sent! Check your inbox.");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <strong>Enter your email address and we'll send you a link to reset your password.</strong>

        <form onSubmit={handleSubmit} className="forgot-password-form">
          <div className="form-field">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="form-input"
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <button
            type="submit"
            disabled={loading}
            className="submit-button"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="back-to-login">
          <a href="/login" className="back-link">← Back to Login</a>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;