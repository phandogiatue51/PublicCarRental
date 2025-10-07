import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import loginImg from "../images/login/login.jpg";
import "../styles/Login.css";

function Login() {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const { login, loading, error, setError } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        
        try {
            await login(identifier, password);
        } catch (err) {
            console.error("Login error:", err);
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