import React, { useState } from "react";
import { motion } from "framer-motion";
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
            <motion.div
                className="login-image"
                style={{ backgroundImage: `url(${loginImg})` }}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            />

            {/* Right Column (Form) */}
            <motion.div 
                className="login-form"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
                <motion.div 
                    className="form-header"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                >
                    <h1>Welcome back</h1>
                    <p>Log in to continue to your account</p>
                </motion.div>

                <motion.form 
                    onSubmit={handleSubmit} 
                    className="login-form-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                >
                    {/* Email or Phone */}
                    <div className="form-field">
                        <label htmlFor="identifier" className="form-label">
                            Email or Phone
                        </label>
                        <motion.input
                            id="identifier"
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            placeholder="you@example.com or 0123456789"
                            required
                            className="form-input"
                            whileFocus={{ scale: 1.01 }}
                            transition={{ duration: 0.2 }}
                        />
                    </div>

                    {/* Password */}
                    <div className="form-field">
                        <label htmlFor="password" className="form-label">
                            Password
                        </label>
                        <motion.input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="form-input"
                            whileFocus={{ scale: 1.01 }}
                            transition={{ duration: 0.2 }}
                        />
                    </div>

                    <div className="forgot-password-link">
                        <motion.a 
                            href="/forgot-password" 
                            className="forgot-link"
                            whileHover={{ x: 3 }}
                        >
                            Forgot your password?
                        </motion.a>
                    </div>

                    {error && (
                        <motion.div
                            className="error-message"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {error}
                        </motion.div>
                    )}

                    <div className="submit-container">
                        <motion.button
                            type="submit"
                            disabled={loading}
                            className="submit-button"
                            whileHover={{ scale: loading ? 1 : 1.02 }}
                            whileTap={{ scale: loading ? 1 : 0.98 }}
                        >
                            {loading ? (
                                <>
                                    Logging in...
                                </>
                            ) : (
                                "Log In"
                            )}
                        </motion.button>
                    </div>
                </motion.form>

                <div className="signup-redirect">
                    Don't have an account?{" "}
                    <motion.a 
                        href="/sign-up" 
                        className="signup-link"
                        whileHover={{ scale: 1.05 }}
                    >
                        Sign up
                    </motion.a>
                </div>
            </motion.div>
        </div>
    );
}

export default Login;