import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { accountAPI } from "../../services/api";
import "./../../styles/ForgotPassword.css";

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (!token) {
            setError("Invalid reset link");
            return;
        }

        setLoading(true);
        setError("");
        setMessage("");

        try {
            await accountAPI.resetPassword(token, newPassword);
            setMessage("Password reset successfully! You can now log in with your new password.");
        } catch (err) {
            setError(err.message || "Failed to reset password.");
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="reset-password-container">
                <div className="reset-password-card">
                    <h2>Invalid Reset Link</h2>
                    <p>The password reset link is invalid or has expired.</p>
                    <a href="/forgot-password" className="retry-link">
                        Request a new reset link
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="reset-password-container font-size-16">
            <div className="reset-password-card">
                <h2>Create New Password</h2>
                <p>Enter your new password below.</p>
                
                <form onSubmit={handleSubmit} className="reset-password-form">
                    <div className="form-field">
                        <label htmlFor="newPassword" className="form-label">
                            New Password
                        </label>
                        <input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength="6"
                            className="form-input"
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="confirmPassword" className="form-label">
                            Confirm Password
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
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
                        {loading ? "Resetting..." : "Reset Password"}
                    </button>
                </form>

                <div className="back-to-login">
                    <a href="/login" className="back-link">← Back to Login</a>
                </div>
            </div>
        </div>
    );
}

export default ResetPassword;