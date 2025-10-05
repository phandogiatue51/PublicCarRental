import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import loginImg from "../images/login/login.jpg";

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
            const res = await fetch(
                `${process.env.REACT_APP_API_BASE || "https://publiccarrental-production-b7c5.up.railway.app"}/api/Account/login`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ identifier, password })
                }
            );

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Login failed");
            }

            const data = await res.json();
            sessionStorage.setItem("userRole", data.role);
            // Try to resolve renter info if identifier matches a renter
            try {
                const base = process.env.REACT_APP_API_BASE || "https://publiccarrental-production-b7c5.up.railway.app";
                const rentersRes = await fetch(`${base}/api/EVRenter/all-renters`);
                if (rentersRes.ok) {
                    const renters = await rentersRes.json();
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
                }
            } catch (_) {
                // ignore enrichment errors; proceed to home
            }
            navigate("/");
        } catch (err) {
            setError(err.message || "Login failed");
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
            {/* Header */}
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
                    backgroundImage: `url(${loginImg})`,
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
                    minHeight: "100vh",
                    alignItems: "center", 
                }}
            >
                <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 36, fontWeight: 800, color: "#111827" }}>
                        Welcome back
                    </div>
                    <div
                        style={{
                            color: "#6b7280",
                            marginTop: 6,
                            fontSize: 18
                        }}
                    >
                        Sign in to continue to your account
                    </div>
                </div>
                <form
                    onSubmit={handleSubmit}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                        width: "100%",
                        maxWidth: 400,        // khung form gọn hơn
                        alignItems: "flex-start"
                    }}
                >
                    {/* Email or Phone */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
                        <label
                            htmlFor="identifier"
                            style={{
                                fontSize: 16,
                                color: "#374151",
                                marginBottom: 4,
                            }}
                        >
                            Email or Phone
                        </label>
                        <input
                            id="identifier"
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            placeholder="you@example.com or 0123456789"
                            required
                            style={{
                                width: "100%",   // full theo form
                                padding: "14px 16px",
                                borderRadius: 12,
                                border: "1px solid #d1d5db",
                                background: "#ffffff",
                                color: "#111827",
                                fontSize: 16,
                            }}
                        />
                    </div>

                    {/* Password */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
                        <label
                            htmlFor="password"
                            style={{
                                fontSize: 16,
                                color: "#374151",
                                marginBottom: 4,
                            }}
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            style={{
                                width: "100%",   // full theo form
                                padding: "14px 16px",
                                borderRadius: 12,
                                border: "1px solid #d1d5db",
                                background: "#ffffff",
                                color: "#111827",
                                fontSize: 16,
                            }}
                        />
                    </div>

                    {error && (
                        <div style={{ color: "#dc2626", fontSize: 16 }}>{error}</div>
                    )}

                    <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: "50%",
                                padding: "14px 16px",
                                borderRadius: 20,
                                border: "1px solid #ff4d30",
                                background: "#ff4d30",
                                color: "#ffffff",
                                fontWeight: 700,
                                fontSize: 16,
                                cursor: loading ? "not-allowed" : "pointer",
                            }}
                        >
                            {loading ? "Signing in..." : "Sign In"}
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
                    Don't have an account?{" "}
                    <a href="/sign-up" style={{ color: "#ff4d30", fontWeight: 600 }}>
                        Sign up
                    </a>
                </div>
            </div>
        </div>
    );
}

export default Login;
