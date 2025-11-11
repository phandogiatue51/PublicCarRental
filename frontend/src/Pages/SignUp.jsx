import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { accountAPI } from "../services/api";
import signUpImg from "../images/login/sign-up.jpg";
import "../styles/SignUp.css"; 
import { useToast } from "@chakra-ui/react";

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
    const navigate = useNavigate();
    const toast = useToast(); 

    const updateForm = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await accountAPI.register(form); 
            
            console.log("✅ Registration Successful:", response.message);

            toast({
                title: "Account Created! 🎉",
                description: response.message || "Redirecting you to the sign-in page...",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "top",
            });

            setTimeout(() => navigate("/login"), 3000);

        } catch (err) {
            let errorMessage = "Registration failed. Please try again.";
            
            try {
                if (err.response && err.response.message) {
                    errorMessage = err.response.message; 
                } else if (err.message) {
                    const errorMatch = err.message.match(/"message":"(.*?)"/i);
                    errorMessage = errorMatch && errorMatch[1] ? errorMatch[1] : err.message;
                }
            } catch (e) {
                console.error("Error parsing API failure message:", e);
            }
            
            console.error("❌ Registration Failed:", errorMessage);
            
            toast({
                title: "Registration Failed ⚠️",
                description: errorMessage,
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "top",
            });

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
            <motion.div 
                className="signup-image"
                style={{ backgroundImage: `url(${signUpImg})` }}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            />

            {/* Right Column (Form) */}
            <motion.div 
                className="signup-form"
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
                    <h1>Create account</h1>
                    <p>Join and start renting EVs</p>
                </motion.div>

                <motion.form 
                    onSubmit={handleSubmit} 
                    className="signup-form-grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                >
                    
                    {/* Input Fields */}
                    <div className="form-field">
                        <label htmlFor="fullName" className="form-label">Full name</label>
                        <motion.input 
                            id="fullName" 
                            type="text" 
                            value={form.fullName} 
                            onChange={(e) => updateForm("fullName", e.target.value)} 
                            placeholder="Alex Doe" 
                            required 
                            className="form-input"
                            whileFocus={{ scale: 1.01 }}
                            transition={{ duration: 0.2 }}
                        />
                    </div>
                    <div className="form-field">
                        <label htmlFor="phone" className="form-label">Phone number</label>
                        <motion.input 
                            id="phone" 
                            type="tel" 
                            value={form.phoneNumber} 
                            onChange={(e) => updateForm("phoneNumber", e.target.value)} 
                            placeholder="0123456789" 
                            required 
                            className="form-input"
                            whileFocus={{ scale: 1.01 }}
                            transition={{ duration: 0.2 }}
                        />
                    </div>
                    <div className="form-field">
                        <label htmlFor="email" className="form-label">Email</label>
                        <motion.input 
                            id="email" 
                            type="email" 
                            value={form.email} 
                            onChange={(e) => updateForm("email", e.target.value)} 
                            placeholder="you@example.com" 
                            required 
                            className="form-input"
                            whileFocus={{ scale: 1.01 }}
                            transition={{ duration: 0.2 }}
                        />
                    </div>
                    <div className="form-field">
                        <label htmlFor="identity" className="form-label">Identity card number</label>
                        <motion.input 
                            id="identity" 
                            type="text" 
                            value={form.identityCardNumber} 
                            onChange={(e) => updateForm("identityCardNumber", e.target.value)} 
                            placeholder="ID number" 
                            required 
                            className="form-input"
                            whileFocus={{ scale: 1.01 }}
                            transition={{ duration: 0.2 }}
                        />
                    </div>
                    <div className="form-field">
                        <label htmlFor="password" className="form-label">Password</label>
                        <motion.input 
                            id="password" 
                            type="password" 
                            value={form.password} 
                            onChange={(e) => updateForm("password", e.target.value)} 
                            placeholder="••••••••" 
                            required 
                            className="form-input"
                            whileFocus={{ scale: 1.01 }}
                            transition={{ duration: 0.2 }}
                        />
                    </div>
                    <div className="form-field">
                        <label htmlFor="license" className="form-label">License number</label>
                        <motion.input 
                            id="license" 
                            type="text" 
                            value={form.licenseNumber} 
                            onChange={(e) => updateForm("licenseNumber", e.target.value)} 
                            placeholder="e.g. A123456" 
                            className="form-input"
                            whileFocus={{ scale: 1.01 }}
                            transition={{ duration: 0.2 }}
                        />
                    </div>


                    <div className="submit-container">
                        <motion.button
                            type="submit"
                            disabled={loading}
                            className="submit-button"
                            whileHover={{ scale: loading ? 1 : 1.02 }}
                            whileTap={{ scale: loading ? 1 : 0.98 }}
                        >
                            {loading ? "Creating..." : "Create Account"}
                        </motion.button>
                    </div>
                </motion.form>

                <div className="login-redirect">
                    Already have an account?{" "}
                    <motion.a 
                        href="/login" 
                        className="login-link"
                        whileHover={{ scale: 1.05 }}
                    >
                        Sign in
                    </motion.a>
                </div>
            </motion.div>
        </div>
    );
}

export default SignUp;