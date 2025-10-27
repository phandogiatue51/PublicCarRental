import { Link, useNavigate } from "react-router-dom";
import Logo from "../images/logo/logo.png";
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

function Navbar() {
    const [nav, setNav] = useState(false);
    const navigate = useNavigate();
    const { getCurrentUser, isAuthenticated, logout } = useAuth();
    const [userData, setUserData] = useState(null);

    const openNav = () => {
        setNav(!nav);
    };

    useEffect(() => {
        const updateAuthState = () => {
            if (isAuthenticated()) {
                const currentUser = getCurrentUser();
                setUserData(currentUser);
                setIsLoggingOut(false);
            } else {
                setUserData(null);
                setIsLoggingOut(false);
            }
        };

        // Initial check
        updateAuthState();

        // Listen for storage changes
        const handleStorageChange = (e) => {
            if (e.key === 'jwtToken' || e.key === 'userRole') {
                updateAuthState();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('authStateChanged', updateAuthState);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('authStateChanged', updateAuthState);
        };
    }, [isAuthenticated, getCurrentUser]);

    const isLoggedIn = isAuthenticated();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = () => {
        setIsLoggingOut(true);
        setTimeout(() => {
            logout();
        }, 1000);
    };

    const handleStaffNavigation = () => {
        if (userData?.staffId && userData?.stationId) {
            navigate(`/staff?staffId=${userData.staffId}&stationId=${userData.stationId}`);
        } else {
            navigate("/staff");
        }
    };

    const handleAdminNavigation = () => {
        navigate("/admin");
    };

    // Removed unused handleAccountNavigation to satisfy lint

    // Helper function to determine role display
    const getUserRoleDisplay = () => {
        const role = userData?.role?.toString();
        switch (role) {
            case "Admin":
                return "Admin";
            case "Staff":
                return "Staff";
            case "EVRenter":
                return "Customer";
        }
    };

    return (
        <>
            <nav>
                {/* mobile */}
                <div className={`mobile-navbar ${nav ? "open-nav" : ""}`}>
                    <div onClick={openNav} className="mobile-navbar__close">
                        <i className="fa-solid fa-xmark"></i>
                    </div>
                    <ul className="mobile-navbar__links">
                        <li>
                            <Link onClick={openNav} to="/">
                                Home
                            </Link>
                        </li>
                        <li>
                            <Link onClick={openNav} to="/about">
                                About
                            </Link>
                        </li>
                        <li>
                            <Link onClick={openNav} to="/models">
                                Models
                            </Link>
                        </li>
                        <li>
                            <Link onClick={openNav} to="/testimonials">
                                Testimonials
                            </Link>
                        </li>
                        <li>
                            <Link onClick={openNav} to="/team">
                                Our Team
                            </Link>
                        </li>
                        <li>
                            <Link onClick={openNav} to="/contact">
                                Contact
                            </Link>
                        </li>
                        
                        {/* Mobile auth buttons */}
                        {isLoggedIn && (
                            <li>
                                <div style={{ 
                                    padding: "10px", 
                                    borderTop: "1px solid #eee",
                                    marginTop: "10px"
                                }}>
                                    <span style={{ 
                                        fontSize: "14px", 
                                        color: "#666",
                                        display: "block",
                                        marginBottom: "5px"
                                    }}>
                                        Logged in as: {getUserRoleDisplay()}
                                    </span>
                                    <button
                                        onClick={handleLogout}
                                        disabled={isLoggingOut}
                                        style={{
                                            background: "transparent",
                                            border: "1px solid #ff4d30",
                                            color: "#ff4d30",
                                            padding: "8px 16px",
                                            borderRadius: "3px",
                                            width: "100%",
                                            cursor: isLoggingOut ? "not-allowed" : "pointer"
                                        }}
                                    >
                                        {isLoggingOut ? "Logging out..." : "Logout"}
                                    </button>
                                </div>
                            </li>
                        )}
                    </ul>
                </div>

                {/* desktop */}
                <div className="navbar">
                    <div className="navbar__img">
                        <Link to="/" onClick={() => window.scrollTo(0, 0)}>
                            <img src={Logo} alt="logo-img" />
                        </Link>
                    </div>
                    <ul className="navbar__links">
                        <li>
                            <Link className="home-link" to="/">
                                Home
                            </Link>
                        </li>
                        <li>
                            <Link className="about-link" to="/about">
                                About
                            </Link>
                        </li>
                        <li>
                            <Link className="models-link" to="/models">
                                Our Models
                            </Link>
                        </li>
                        <li>
                            <Link className="testi-link" to="/testimonials">
                                Testimonials
                            </Link>
                        </li>
                        <li>
                            <Link className="team-link" to="/team">
                                Our Team
                            </Link>
                        </li>
                        <li>
                            <Link className="contact-link" to="/contact">
                                Contact
                            </Link>
                        </li>
                    </ul>

                    {/* Auth buttons */}
                    {isLoggedIn ? (
                        <div className="navbar__buttons" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            

                            {/* Customer (0) */}
                            {(userData?.role === "EVRenter") && (
                                <Link className="navbar__buttons__sign-in" to="/account">
                                    Profile
                                </Link>
                            )}

                            {/* Staff (1) */}
                            {(userData?.role === "Staff") && (
                                <button
                                    className="navbar__buttons__register"
                                    onClick={handleStaffNavigation}
                                    style={{
                                        background: "#ff4d30",
                                        border: "1px solid #ff4d30",
                                        color: "white",
                                        cursor: "pointer",
                                        padding: "10px 15px"
                                    }}
                                >
                                    Staff Portal
                                </button>
                            )}

                            {/* Admin (2) */}
                            {(userData?.role === "Admin") && (
                                <button
                                    className="navbar__buttons__register"
                                    onClick={handleAdminNavigation}
                                    style={{
                                        background: "#ff4d30",
                                        border: "1px solid #ff4d30",
                                        color: "white",
                                        cursor: "pointer",
                                        padding: "10px 15px"
                                    }}
                                >
                                    Admin Portal
                                </button>
                            )}

                            <button
                                className="navbar__buttons__register"
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                style={{
                                    background: "transparent",
                                    border: "1px solid #ff4d30",
                                    color: "#ff4d30",
                                    cursor: isLoggingOut ? "not-allowed" : "pointer",
                                    opacity: isLoggingOut ? 0.7 : 1,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px",
                                    padding: "10px 15px"
                                }}
                            >
                                {isLoggingOut ? (
                                    <>
                                        <div className="loading-spinner" style={{
                                            width: "16px",
                                            height: "16px",
                                            border: "2px solid #ff4d30",
                                            borderTop: "2px solid transparent",
                                            borderRadius: "50%",
                                            animation: "spin 1s linear infinite"
                                        }}></div>
                                        Logging out...
                                    </>
                                ) : (
                                    "Logout"
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="navbar__buttons">
                            <Link className="navbar__buttons__sign-in" to="/login">
                                Login
                            </Link>
                            <Link className="navbar__buttons__register" to="/sign-up">
                                Sign Up
                            </Link>
                        </div>
                    )}

                    {/* mobile hamburger */}
                    <div className="mobile-hamb" onClick={openNav}>
                        <i className="fa-solid fa-bars"></i>
                    </div>
                </div>
            </nav>

            {/* Add spin animation for logout spinner */}
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
        </>
    );
}

export default Navbar;