import { Link } from "react-router-dom";
import Logo from "../images/logo/logo.png";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

function Navbar() {
  const [nav, setNav] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const openNav = () => {
    setNav(!nav);
  };

  const handleLogout = () => {
    logout();
    setNav(false);
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
            
            {/* Mobile Auth Links - using same styling */}
            {isAuthenticated ? (
              <>
                {user?.isAdmin && (
                  <li>
                    <Link onClick={openNav} to="/admin" className="admin-link">
                      Admin
                    </Link>
                  </li>
                )}
                <li>
                  <Link onClick={openNav} to="/profile" className="profile-link">
                    Profile
                  </Link>
                </li>
                <li>
                  <button onClick={handleLogout} className="mobile-navbar__logout">
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link onClick={openNav} to="/login" className="mobile-navbar__sign-in">
                    Login
                  </Link>
                </li>
                <li>
                  <Link onClick={openNav} to="/sign-up" className="mobile-navbar__register">
                    Sign Up
                  </Link>
                </li>
              </>
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
          
          <div className="navbar__buttons">
            {isAuthenticated ? (
              <>
                {/* Use same button classes as original navbar */}
                {user?.isAdmin && (
                  <Link className="navbar__buttons__admin" to="/admin">
                    Admin
                  </Link>
                )}
                <Link className="navbar__buttons__profile" to="/profile">
                  Profile
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="navbar__buttons__profile"
                  style={{ color: '#dc3545', border: '1px solid #dc3545', borderRadius: '10px', padding: '10px 20px'}}
                >
                  Logout
                </button>
              </>
            ) : (
              <>  
                <Link className="navbar__buttons__sign-in" to="/login">
                  Login
                </Link>
                <Link className="navbar__buttons__register" to="/sign-up">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* mobile hamburger */}
          <div className="mobile-hamb" onClick={openNav}>
            <i className="fa-solid fa-bars"></i>
          </div>
        </div>
      </nav>
    </>
  );
}

export default Navbar;