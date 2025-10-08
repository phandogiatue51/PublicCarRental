import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { accountAPI } from "../services/api";
import signUpImg from "../images/login/sign-up.jpg";
import "../styles/SignUp.css"; 

function SignUp() {
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        phoneNumber: "",
        identityCardNumber: "",
        licenseNumber: "",
        password: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();

    const updateForm = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
        await accountAPI.register(form); // use your API wrapper
        setSuccess("Account created! Redirecting to sign in...");
        setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
        setError(err.message || "Registration failed");
    } finally {
        setLoading(false);
    }
};

    return (
        <div className="signup-container">
            {/* Header */}
            <div className="signup-header">
                <div className="header-content"></div>
            </div>

            {/* Left Column (Image) */}
            <div 
                className="signup-image"
                style={{ backgroundImage: `url(${signUpImg})` }}
            />

            {/* Right Column (Form) */}
            <div className="signup-form">
                <div className="form-header">
                    <h1>Create account</h1>
                    <p>Join and start renting EVs</p>
                </div>

                <form onSubmit={handleSubmit} className="signup-form-grid">
                    {/* Full Name */}
                    <div className="form-field">
                        <label htmlFor="fullName" className="form-label">
                            Full name
                        </label>
                        <input
                            id="fullName"
                            type="text"
                            value={form.fullName}
                            onChange={(e) => updateForm("fullName", e.target.value)}
                            placeholder="Alex Doe"
                            required
                            className="form-input"
                        />
                    </div>

                    {/* Phone Number */}
                    <div className="form-field">
                        <label htmlFor="phone" className="form-label">
                            Phone number
                        </label>
                        <input
                            id="phone"
                            type="tel"
                            value={form.phoneNumber}
                            onChange={(e) => updateForm("phoneNumber", e.target.value)}
                            placeholder="0123456789"
                            required
                            className="form-input"
                        />
                    </div>

                    {/* Email */}
                    <div className="form-field">
                        <label htmlFor="email" className="form-label">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={form.email}
                            onChange={(e) => updateForm("email", e.target.value)}
                            placeholder="you@example.com"
                            required
                            className="form-input"
                        />
                    </div>

                    {/* Identity Card */}
                    <div className="form-field">
                        <label htmlFor="identity" className="form-label">
                            Identity card number
                        </label>
                        <input
                            id="identity"
                            type="text"
                            value={form.identityCardNumber}
                            onChange={(e) => updateForm("identityCardNumber", e.target.value)}
                            placeholder="ID number"
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
                            value={form.password}
                            onChange={(e) => updateForm("password", e.target.value)}
                            placeholder="••••••••"
                            required
                            className="form-input"
                        />
                    </div>

                    {/* License Number */}
                    <div className="form-field">
                        <label htmlFor="license" className="form-label">
                            License number
                        </label>
                        <input
                            id="license"
                            type="text"
                            value={form.licenseNumber}
                            onChange={(e) => updateForm("licenseNumber", e.target.value)}
                            placeholder="e.g. A123456"
                            className="form-input"
                        />
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="success-message">
                            {success}
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="submit-container">
                        <button
                            type="submit"
                            disabled={loading}
                            className="submit-button"
                        >
                            {loading ? "Creating..." : "Create Account"}
                        </button>
                    </div>
                </form>

                <div className="login-redirect">
                    Already have an account?{" "}
                    <a href="/login" className="login-link">
                        Sign in
                    </a>
                </div>
            </div>
        </div>
    );
}

export default SignUp;