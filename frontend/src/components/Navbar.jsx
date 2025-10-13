import { Link, useNavigate } from "react-router-dom";
import Logo from "../images/logo/logo.png";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

function Navbar() {
  const [nav, setNav] = useState(false);
  const navigate = useNavigate();
  const { getCurrentUser, isAuthenticated, logout } = useAuth();

  const openNav = () => {
    setNav(!nav);
  };
  // Derive auth state from JWT (set by Login via useAuth)
  const isLoggedIn = isAuthenticated();
  const currentUser = getCurrentUser();
  const userRole = currentUser?.role?.toString();
  const staffId = currentUser?.staffId;
  const stationId = currentUser?.stationId;
  const [isLoggingOut, setIsLoggingOut] = useState(false);

 const handleLogout = () => {
  setIsLoggingOut(true);
  setTimeout(() => {
    // Clear any legacy session flags (backward-compat) and JWT via hook
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("accountId");
    sessionStorage.removeItem("fullName");
    sessionStorage.removeItem("email");
    sessionStorage.removeItem("isAdmin");
    sessionStorage.removeItem("staffId");
    sessionStorage.removeItem("stationId");
    sessionStorage.removeItem("renterId");
    sessionStorage.removeItem("phoneNumber");
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
              {(userRole === "0" || userRole === "EVRenter") && (
              <Link className="navbar__buttons__sign-in" to="/account">
                Profile
              </Link>
              )}
                
              {(userRole === "1" || userRole === "Staff") && (
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

              {(userRole === "2" || userRole === "Admin") && (
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