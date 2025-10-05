import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { accountAPI } from "../services/api";
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
            // Use the API service instead of direct fetch
            const data = await accountAPI.login({
                Identifier: identifier,
                Password: password
            });

            console.log('Login response data:', data); // Debug log

            // Map numeric role to string role
            const roleMap = {
                0: "EVRenter",
                1: "Staff", 
                2: "Admin"
            };
            const roleString = roleMap[data.role] || "EVRenter";
            
            console.log('Role mapping:', { role: data.role, roleString }); // Debug log
            
            // Store all user data from the response
            if (data.accountId) sessionStorage.setItem("accountId", data.accountId);
            sessionStorage.setItem("userRole", roleString);
            if (data.email) sessionStorage.setItem("userEmail", data.email);
            if (data.renterId) sessionStorage.setItem("renterId", data.renterId);
            if (data.staffId) sessionStorage.setItem("staffId", data.staffId);
            if (data.stationId) sessionStorage.setItem("stationId", data.stationId);
            if (data.token) sessionStorage.setItem("userToken", data.token);
            sessionStorage.setItem("isAdmin", (roleString === "Admin").toString());
            
            console.log('Stored session data:', {
                accountId: data.accountId,
                role: roleString,
                email: data.email,
                renterId: data.renterId,
                staffId: data.staffId,
                stationId: data.stationId
            }); // Debug log
            
            // Dispatch custom event to notify other components of auth state change
            window.dispatchEvent(new Event('authStateChanged'));
            
            // Redirect based on role
            if (roleString === "Admin") {
                navigate("/admin/dashboard");
            } else if (roleString === "Staff") {
                navigate("/staff/dashboard");
            } else {
                navigate("/");
            }
            
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