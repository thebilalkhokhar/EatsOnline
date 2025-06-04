import { useContext, useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { FaShoppingCart, FaUtensils, FaClipboardList, FaUserCircle, FaSignInAlt, FaUserPlus, FaSignOutAlt, FaBars, FaTimes, FaChevronDown, FaHome } from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import "../assets/Navbar.css";

function Navbar() {
  const { user, logout, isAuthenticated, loading } = useContext(AuthContext);
  const { cartCount } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const dropdownRef = useRef(null);

  const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NjY2NjYyI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MyLjY3IDAgNC44NCAyLjE3IDQuODQgNC44NCAwIDIuNjctMi4xNyA0Ljg0LTQuODQgNC44NC0yLjY3IDAtNC44NC0yLjE3LTQuODQtNC44NCAwLTIuNjcgMi4xNy00Ljg0IDQuODQtNC44NHptMCAxMmM0LjQyIDAgOC4xNy0yLjI4IDkuNTQtNS41N0gxMi4wM2MtMi4zMyAwLTQuMzktMS4yMy01LjU0LTMuMDctLjU3LS45LS45LTEuOTYtLjktMy4wN0gyLjQ2YzEuMzcgMy4yOSA1LjEyIDUuNTcgOS41NCA1LjU3eiIvPjwvc3ZnPg==';

  // Debug log for user data
  useEffect(() => {
    console.log('Navbar user data:', user);
    if (user?.profileImage) {
      console.log('Profile image data:', user.profileImage);
    }
  }, [user]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close menu and prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (isDropdownOpen) setIsDropdownOpen(false);
  };

  const toggleDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const renderMobileMenu = () => (
    <>
      <Link to="/" className="nav-link" onClick={() => setIsOpen(false)}>
        <FaHome className="nav-icon" /> Home
      </Link>
      <Link to="/restaurants" className="nav-link" onClick={() => setIsOpen(false)}>
        <FaUtensils className="nav-icon" /> Restaurants
      </Link>
      <Link to="/cart" className="nav-link" onClick={() => setIsOpen(false)}>
        <div className="cart-icon-container">
          <FaShoppingCart className="nav-icon" />
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </div>
        Cart
      </Link>
      <Link to="/orders" className="nav-link" onClick={() => setIsOpen(false)}>
        <FaClipboardList className="nav-icon" /> Orders
      </Link>
      {user?.role === "admin" && (
        <Link to="/admin/dashboard" className="nav-link" onClick={() => setIsOpen(false)}>
          <MdDashboard className="nav-icon" /> Admin Dashboard
        </Link>
      )}
      <Link to="/profile" className="nav-link" onClick={() => setIsOpen(false)}>
        <FaUserCircle className="nav-icon" /> Profile
      </Link>
      <button className="nav-link logout-btn" onClick={() => { logout(); setIsOpen(false); }}>
        <FaSignOutAlt className="nav-icon" /> Logout
      </button>
    </>
  );

  const renderDesktopMenu = () => (
    <>
      <Link to="/" className="nav-link">
        <FaHome className="nav-icon" /> Home
      </Link>
      <Link to="/restaurants" className="nav-link">
        <FaUtensils className="nav-icon" /> Restaurants
      </Link>
      <Link to="/cart" className="nav-link">
        <div className="cart-icon-container">
          <FaShoppingCart className="nav-icon" />
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </div>
        Cart
      </Link>
      <Link to="/orders" className="nav-link">
        <FaClipboardList className="nav-icon" /> Orders
      </Link>
      {user?.role === "admin" && (
        <Link to="/admin/dashboard" className="nav-link">
          <MdDashboard className="nav-icon" /> Admin Dashboard
        </Link>
      )}
      <div className="user-dropdown" ref={dropdownRef}>
        <button className="dropdown-trigger" onClick={toggleDropdown}>
          <FaUserCircle 
            className="nav-icon" 
            style={{ 
              fontSize: '2rem',
              color: '#666'
            }} 
          />
          <span className="user-name">{user?.name}</span>
          <FaChevronDown className={`chevron ${isDropdownOpen ? 'open' : ''}`} />
        </button>
        <div className={`dropdown-menu ${isDropdownOpen ? 'active' : ''}`}>
          <Link to="/profile" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
            <FaUserCircle className="nav-icon" /> Profile
          </Link>
          <button onClick={() => { logout(); setIsDropdownOpen(false); }} className="dropdown-item">
            <FaSignOutAlt className="nav-icon" /> Logout
          </button>
        </div>
      </div>
    </>
  );

  if (loading) {
    return (
      <nav className="navbar">
        <Link to="/" className="logo">
          EatsOnline
        </Link>
        <div className="nav-links">Loading...</div>
      </nav>
    );
  }

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="logo">
          EatsOnline
        </Link>
        <button className="hamburger" onClick={toggleMenu}>
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>
        <div className={`nav-links ${isOpen ? "active" : ""}`}>
          {isAuthenticated ? (
            isMobile ? renderMobileMenu() : renderDesktopMenu()
          ) : (
            <>
              <Link to="/" className="nav-link" onClick={() => setIsOpen(false)}>
                <FaHome className="nav-icon" /> Home
              </Link>
              <Link to="/signup" className="nav-link" onClick={() => setIsOpen(false)}>
                <FaUserPlus className="nav-icon" /> Signup
              </Link>
              <Link to="/login" className="nav-link" onClick={() => setIsOpen(false)}>
                <FaSignInAlt className="nav-icon" /> Login
              </Link>
            </>
          )}
        </div>
      </nav>
      <div className={`nav-overlay ${isOpen ? "active" : ""}`} onClick={() => setIsOpen(false)} />
    </>
  );
}

export default Navbar;
