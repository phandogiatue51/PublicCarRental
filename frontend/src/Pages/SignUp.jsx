import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import signUpImg from "../images/login/sign-up.jpg";

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

    const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);
        try {
            const res = await fetch(
                `${process.env.REACT_APP_API_BASE || "https://publiccarrental-production-b7c5.up.railway.app"}/api/Account/register`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        fullName: form.fullName,
                        email: form.email,
                        phoneNumber: form.phoneNumber,
                        identityCardNumber: form.identityCardNumber,
                        licenseNumber: form.licenseNumber,
                        password: form.password
                    })
                }
            );
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Registration failed");
            }
            setSuccess("Account created! Redirecting to sign in...");
            setTimeout(() => navigate("/login"), 1000);
        } catch (err) {
            setError(err.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                background: "#ffffff",
                position: "relative",
                overflow: "hidden"
            }}
        >
            {/* Header chung */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 96,
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 20px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    zIndex: 10
                }}
            >
                <div style={{ fontWeight: 700, color: "#111827" }}></div>
            </div>

            {/* Cột trái (ảnh) */}
            <div
                style={{
                    backgroundImage: `url(${signUpImg})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    minHeight: "100vh"
                }}
            />

            {/* Cột phải (form) */}
            <div
                style={{
                    padding: 40,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    minHeight: "100vh"
                }}
            >
                <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 36, fontWeight: 800, color: "#111827" }}>
                        Create account
                    </div>
                    <div style={{ color: "#6b7280", marginTop: 6, fontSize: 18 }}>
                        Join and start renting EVs
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
                >
                    <div>
                        <label
                            htmlFor="fullName"
                            style={{
                                display: "block",
                                fontSize: 16,
                                color: "#374151",
                                marginBottom: 8
                            }}
                        >
                            Full name
                        </label>
                        <input
                            id="fullName"
                            type="text"
                            value={form.fullName}
                            onChange={(e) => update("fullName", e.target.value)}
                            placeholder="Alex Doe"
                            required
                            style={{
                                width: "100%",
                                padding: "14px 16px",
                                borderRadius: 12,
                                border: "1px solid #d1d5db",
                                background: "#ffffff",
                                color: "#111827",
                                fontSize: 16
                            }}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="phone"
                            style={{
                                display: "block",
                                fontSize: 16,
                                color: "#374151",
                                marginBottom: 8
                            }}
                        >
                            Phone number
                        </label>
                        <input
                            id="phone"
                            type="tel"
                            value={form.phoneNumber}
                            onChange={(e) => update("phoneNumber", e.target.value)}
                            placeholder="0123456789"
                            required
                            style={{
                                width: "100%",
                                padding: "14px 16px",
                                borderRadius: 12,
                                border: "1px solid #d1d5db",
                                background: "#ffffff",
                                color: "#111827",
                                fontSize: 16
                            }}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="email"
                            style={{
                                display: "block",
                                fontSize: 16,
                                color: "#374151",
                                marginBottom: 8
                            }}
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={form.email}
                            onChange={(e) => update("email", e.target.value)}
                            placeholder="you@example.com"
                            required
                            style={{
                                width: "100%",
                                padding: "14px 16px",
                                borderRadius: 12,
                                border: "1px solid #d1d5db",
                                background: "#ffffff",
                                color: "#111827",
                                fontSize: 16
                            }}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="identity"
                            style={{
                                display: "block",
                                fontSize: 16,
                                color: "#374151",
                                marginBottom: 8
                            }}
                        >
                            Identity card number
                        </label>
                        <input
                            id="identity"
                            type="text"
                            value={form.identityCardNumber}
                            onChange={(e) => update("identityCardNumber", e.target.value)}
                            placeholder="ID number"
                            required
                            style={{
                                width: "100%",
                                padding: "14px 16px",
                                borderRadius: 12,
                                border: "1px solid #d1d5db",
                                background: "#ffffff",
                                color: "#111827",
                                fontSize: 16
                            }}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            style={{
                                display: "block",
                                fontSize: 16,
                                color: "#374151",
                                marginBottom: 8
                            }}
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={form.password}
                            onChange={(e) => update("password", e.target.value)}
                            placeholder="••••••••"
                            required
                            style={{
                                width: "100%",
                                padding: "14px 16px",
                                borderRadius: 12,
                                border: "1px solid #d1d5db",
                                background: "#ffffff",
                                color: "#111827",
                                fontSize: 16
                            }}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="license"
                            style={{
                                display: "block",
                                fontSize: 16,
                                color: "#374151",
                                marginBottom: 8
                            }}
                        >
                            License number
                        </label>
                        <input
                            id="license"
                            type="text"
                            value={form.licenseNumber}
                            onChange={(e) => update("licenseNumber", e.target.value)}
                            placeholder="e.g. A123456"
                            style={{
                                width: "100%",
                                padding: "14px 16px",
                                borderRadius: 12,
                                border: "1px solid #d1d5db",
                                background: "#ffffff",
                                color: "#111827",
                                fontSize: 16
                            }}
                        />
                    </div>

                    {error && (
                        <div
                            style={{ color: "#dc2626", fontSize: 16, gridColumn: "1 / -1" }}
                        >
                            {error}
                        </div>
                    )}
                    {success && (
                        <div
                            style={{ color: "#16a34a", fontSize: 16, gridColumn: "1 / -1" }}
                        >
                            {success}
                        </div>
                    )}

                    <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "center" }}>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: "25%",   // vẫn 50% nhưng giờ ở giữa
                                padding: "14px 16px",
                                borderRadius: 20,
                                border: "1px solid #ff4d30" ,
                                //       background: loading ? "#164e63" : "#0ea5b7",
                                background:"#ff4d30",
                                color: "#ffffff",
                                fontWeight: 700,
                                fontSize: 16,
                                cursor: loading ? "not-allowed" : "pointer"
                            }}
                        >
                            {loading ? "Creating..." : "Create Account"}
                        </button>
                    </div>
                </form>

                <div
                    style={{
                        marginTop: 18,
                        color: "#6b7280",
                        fontSize: 16,
                        textAlign: "center"
                    }}
                >
                    Already have an account?{" "}
                    <a href="/login" style={{ color: "#ff4d30", fontWeight: 600 }}>
                        Sign in
                    </a>
                </div>
            </div>
        </div>
    );
}

export default SignUp;
