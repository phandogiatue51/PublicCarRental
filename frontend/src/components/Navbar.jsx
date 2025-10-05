import { Link, useNavigate } from "react-router-dom";
import Logo from "../images/logo/logo.png";
import { useState } from "react";

function Navbar() {
  const [nav, setNav] = useState(false);
  const navigate = useNavigate();

  const openNav = () => {
    setNav(!nav);
  };

  const isLoggedIn = !!sessionStorage.getItem("userRole");
  const [menuOpen, setMenuOpen] = useState(false);
  const handleLogout = () => {
    sessionStorage.removeItem("userRole");
    navigate("/");
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
            <div className="navbar__buttons" style={{ position: "relative" }}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                style={{
                  background: "transparent",
                  border: 0,
                  padding: 0,
                  cursor: "pointer"
                }}
                aria-label="Open user menu"
              >
                <img
                  src={process.env.PUBLIC_URL + "/avatar-fb-mac-dinh-1.jpg"}
                  alt="avatar"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src =
                      "data:image/svg+xml;utf8,"
                      + encodeURIComponent(
                        '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">\n  <rect width="128" height="128" fill="#f3f4f6"/>\n  <circle cx="64" cy="48" r="24" fill="#9ca3af"/>\n  <path d="M16 116c0-22.091 17.909-40 40-40h16c22.091 0 40 17.909 40 40" fill="#9ca3af"/>\n</svg>'
                      );
                  }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9999,
                    objectFit: "cover",
                    display: "block",
                    border: "1px solid #e5e7eb"
                  }}
                />
              </button>
              {menuOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 44,
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                    minWidth: 160,
                    zIndex: 50
                  }}
                >
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: "block",
                      padding: "10px 12px",
                      color: "#111827",
                      textDecoration: "none"
                    }}
                  >
                    My Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 12px",
                      background: "transparent",
                      border: 0,
                      color: "#111827",
                      cursor: "pointer",
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
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
