import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import loginImg from "../images/login/login.jpg";
import "../styles/Login.css";
import { useToast } from "@chakra-ui/react";

function Login() {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const { login, loading, error, setError } = useAuth();

    const toast = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            await login(identifier, password);
        } catch (err) {
            console.error("Login error:", err);

            let displayMessage = "An unexpected error occurred during login.";

            try {
                const errorJsonString = err.message.match(/\{.*\}/);
                if (errorJsonString) {
                    const errorObj = JSON.parse(errorJsonString[0]);
                    displayMessage = errorObj.message || displayMessage;
                }
            } catch (parseError) {
                displayMessage = err.message || displayMessage;
            }

            toast({
                title: "Login Failed ⚠️",
                description: displayMessage,
                status: "error",
                duration: 6000,
                isClosable: true,
                position: "top"
            });
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

                    <div className="forgot-password-link">
                        <a href="/forgot-password" className="forgot-link">
                            Forgot your password?
                        </a>
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