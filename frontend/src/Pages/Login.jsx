import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { accountAPI, renterAPI } from "../services/api";
import loginImg from "../images/login/login.jpg";
import "../styles/Login.css";

function Login() {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const data = await accountAPI.login({
                Identifier: identifier,
                Password: password
            });
            
            console.log('Login response data:', data); // Debug log
            sessionStorage.setItem("userRole", data.role);
            
            // Try to resolve renter info if identifier matches a renter
            try {
                const renters = await renterAPI.getAll();
                const idLower = (identifier || "").toLowerCase();
                const matched = renters.find(r =>
                    (r.email && r.email.toLowerCase() === idLower) ||
                    (r.phoneNumber && r.phoneNumber === identifier)
                );
                if (matched) {
                    sessionStorage.setItem("renterId", String(matched.renterId));
                    if (matched.fullName) sessionStorage.setItem("fullName", matched.fullName);
                    if (matched.email) sessionStorage.setItem("email", matched.email);
                    if (matched.phoneNumber) sessionStorage.setItem("phoneNumber", matched.phoneNumber);
                }
            } catch (_) {
                // ignore enrichment errors; proceed to home
            }
            navigate("/");
        } catch (err) {
            setError(err.message || "Login failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            {/* Header */}
            <div className="login-header">
                <div className="header-content"></div>
            </div>

            {/* Left Column (Image) */}
            <div 
                className="login-image"
                style={{ backgroundImage: `url(${loginImg})` }}
            />

            {/* Right Column (Form) */}
            <div className="login-form">
                <div className="form-header">
                    <h1>Welcome back</h1>
                    <p>Log in to continue to your account</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form-content">
                    {/* Email or Phone */}
                    <div className="form-field">
                        <label htmlFor="identifier" className="form-label">
                            Email or Phone
                        </label>
                        <input
                            id="identifier"
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            placeholder="you@example.com or 0123456789"
                            required
                            className="form-input"
                        />
                    </div>

                    {/* Password */}
                    <div className="form-field">
                        <label htmlFor="password" className="form-label">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="form-input"
                        />
                    </div>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <div className="submit-container">
                        <button
                            type="submit"
                            disabled={loading}
                            className="submit-button"
                        >
                            {loading ? (
                                <>
                                    <span className="loading-spinner"></span>
                                    Logging in...
                                </>
                            ) : (
                                "Log In"
                            )}
                        </button>
                    </div>
                </form>

                <div className="signup-redirect">
                    Don't have an account?{" "}
                    <a href="/sign-up" className="signup-link">
                        Sign up
                    </a>
                </div>
            </div>
        </div>
    );
}

export default Login;