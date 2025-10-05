import React, { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";

function Profile() {
  const role = sessionStorage.getItem("userRole");
  const storedFullName = sessionStorage.getItem("fullName");
  const storedEmail = sessionStorage.getItem("email");
  const storedPhoneNumber = sessionStorage.getItem("phoneNumber");
  const renterId = sessionStorage.getItem("renterId");

  const [profile, setProfile] = useState({
    fullName: storedFullName || "",
    email: storedEmail || "",
    phoneNumber: storedPhoneNumber || ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadProfile() {
      if (!renterId) return;
      setLoading(true);
      setError("");
      try {
        const base = process.env.REACT_APP_API_BASE || "https://publiccarrental-production-b7c5.up.railway.app";
        const res = await fetch(`${base}/api/EVRenter/${renterId}`, { signal: controller.signal });
        if (!res.ok) throw new Error(`Failed to load profile (${res.status})`);
        const data = await res.json();
        setProfile({
          fullName: data.fullName || storedFullName || "",
          email: data.email || storedEmail || "",
          phoneNumber: data.phoneNumber || storedPhoneNumber || ""
        });
        // cache for later sessions
        if (data.fullName) sessionStorage.setItem("fullName", data.fullName);
        if (data.email) sessionStorage.setItem("email", data.email);
        if (data.phoneNumber) sessionStorage.setItem("phoneNumber", data.phoneNumber);
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
    return () => controller.abort();
  }, [renterId, storedEmail, storedFullName, storedPhoneNumber]);

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ minHeight: "70vh", padding: 24, paddingTop: 96 }}>
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 8px 24px rgba(0,0,0,0.06)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <img
            src={process.env.PUBLIC_URL + "/avatar-fb-mac-dinh-1.jpg"}
            alt="avatar"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src =
                "data:image/svg+xml;utf8," + encodeURIComponent(
                  '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">\n  <rect width="128" height="128" fill="#f3f4f6"/>\n  <circle cx="64" cy="48" r="24" fill="#9ca3af"/>\n  <path d="M16 116c0-22.091 17.909-40 40-40h16c22.091 0 40 17.909 40 40" fill="#9ca3af"/>\n</svg>'
                );
            }}
            style={{ width: 72, height: 72, borderRadius: 9999, objectFit: "cover", border: "1px solid #e5e7eb" }}
          />
          <div>
            <h1 style={{ margin: 0, fontSize: 24 }}>{profile.fullName || "—"}</h1>
            <div style={{ color: "#6b7280" }}>Role: {role || "—"}</div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr",
            rowGap: 12,
            columnGap: 16
          }}
        >
          <div style={{ color: "#6b7280" }}>FullName</div>
          <div style={{ fontWeight: 600 }}>{profile.fullName || "—"}</div>

          <div style={{ color: "#6b7280" }}>Email</div>
          <div style={{ fontWeight: 600 }}>{profile.email || "—"}</div>

          <div style={{ color: "#6b7280" }}>PhoneNumber</div>
          <div style={{ fontWeight: 600 }}>{profile.phoneNumber || "—"}</div>
        </div>

        {loading && (
          <div style={{ marginTop: 12, color: "#6b7280" }}>Loading profile…</div>
        )}
        {error && (
          <div style={{ marginTop: 12, color: "#dc2626" }}>{error}</div>
        )}

        <div style={{ marginTop: 20 }}>
          <Link to="/" style={{ color: "#ff4d30", fontWeight: 600 }}>Back to Home</Link>
        </div>
      </div>
    </div>
  );
}

export default Profile;


