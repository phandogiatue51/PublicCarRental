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
                setIsLoggingOut(false); // Reset logout state when logged in
            } else {
                setUserData(null);
                setIsLoggingOut(false); // Reset logout state when logged out
            }
        };

        // Initial check
        updateAuthState();

        // Listen for storage changes (when login/logout happens in other tabs)
        const handleStorageChange = (e) => {
            if (e.key === 'jwtToken' || e.key === 'userRole' || e.key === 'staffId' || e.key === 'stationId') {
                updateAuthState();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Listen for custom auth events
        const handleAuthChange = () => {
            updateAuthState();
        };

        window.addEventListener('authStateChanged', handleAuthChange);

        // Listen for page visibility changes (when user comes back from staff/admin pages)
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                updateAuthState();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('authStateChanged', handleAuthChange);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isAuthenticated, getCurrentUser]);

    const isLoggedIn = isAuthenticated();
    const userRole = userData?.role || localStorage.getItem("userRole");
    const staffId = userData?.staffId || localStorage.getItem("staffId");
    const stationId = userData?.stationId || localStorage.getItem("stationId");
    console.log("Navbar Debug:", {
        isLoggedIn,
        userData,
        userRole,
        localStorageRole: localStorage.getItem("userRole"),
        localStorageRenterId: localStorage.getItem("renterId")
    });


    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = () => {
        setIsLoggingOut(true);

        setTimeout(() => {
            logout();
        }, 2000);
    };

    const handleStaffNavigation = () => {
        if (staffId && stationId) {
            navigate(`/staff?staffId=${staffId}&stationId=${stationId}`);
        } else {
            navigate("/staff");
        }
    };

    const handleAdminLogin = () => {
        navigate("/admin");
    }

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
                            {" "}
                            <Link className="about-link" to="/about">
                                About
                            </Link>
                        </li>
                        <li>
                            {" "}
                            <Link className="models-link" to="/models">
                                Our Models
                            </Link>
                        </li>
                        <li>
                            {" "}
                            <Link className="testi-link" to="/testimonials">
                                Testimonials
                            </Link>
                        </li>
                        <li>
                            {" "}
                            <Link className="team-link" to="/team">
                                Our Team
                            </Link>
                        </li>
                        <li>
                            {" "}
                            <Link className="contact-link" to="/contact">
                                Contact
                            </Link>
                        </li>
                    </ul>


                    {/* hide auth buttons when logged in */}
                    {isLoggedIn ? (
                        <div className="navbar__buttons">
                            {(userRole === "EVRenter" || userRole === 0) && (
                                <Link className="navbar__buttons__sign-in" to="/account">
                                    Profile
                                </Link>
                            )}

                            {(userRole === "Staff" || userRole === 1) && (
                                <button
                                    className="navbar__buttons__register"
                                    onClick={handleStaffNavigation}
                                    style={{
                                        background: "#ff4d30",
                                        border: "1px solid #ff4d30",
                                        color: "white",
                                        cursor: "pointer",
                                        marginRight: "10px"
                                    }}
                                >
                                    Staff Portal
                                </button>
                            )}

                            {(userRole === "Admin" || userRole === 2) && (
                                <button
                                    className="navbar__buttons__register"
                                    onClick={handleAdminLogin}
                                    style={{
                                        background: "#ff4d30",
                                        border: "1px solid #ff4d30",
                                        color: "white",
                                        cursor: "pointer",
                                        marginRight: "10px"
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
                                    gap: "8px"
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

                    {/* mobile */}
                    <div className="mobile-hamb" onClick={openNav}>
                        <i className="fa-solid fa-bars"></i>
                    </div>
                </div>
            </nav>
        </>
    );
}

export default Navbar;