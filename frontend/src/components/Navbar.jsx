import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiInfo,
  FiMail,
  FiLogIn,
  FiMessageCircle,
  FiSettings,
  FiUser,
  FiLogOut,
  FiMenu,
  FiX,
} from "react-icons/fi";

const Navbar = ({ user, setUser }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
    setOpen(false);
  };

  const closeMenu = () => {
    setOpen(false);
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="mobile-navbar">
        <div className="mobile-brand">
          <span>MamaTrust</span>
          <div className="brand-icon">AI</div>
        </div>

        <button className="menu-button" onClick={() => setOpen(!open)}>
          {open ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {/* Desktop / Mobile Sidebar */}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        {/* Logo */}
        <div className="navbar-brand">
          <div>
            <div className="brand nav-brand">
              <span>MaMaTrust</span>
              <div className="brand-icon">AI</div>
            </div>
            <small>AI Parenting Assistant</small>
          </div>
        </div>

        {/* Menu */}
        <nav className="nav-menu">
          {!user ? (
            <>
              <Link to="/" onClick={closeMenu}>
                <FiHome />
                <span>Home</span>
              </Link>

              <Link to="/about" onClick={closeMenu}>
                <FiInfo />
                <span>About</span>
              </Link>

              <Link to="/contact" onClick={closeMenu}>
                <FiMail />
                <span>Contact</span>
              </Link>

              <Link to="/login" className="login-nav-link" onClick={closeMenu}>
                <FiLogIn />
                <span>Login</span>
              </Link>
            </>
          ) : (
            <>
              <Link to="/chat" onClick={closeMenu}>
                <FiMessageCircle />
                <span>Chat</span>
              </Link>

              <Link to="/profile" onClick={closeMenu}>
                <FiUser />
                <span>Profile</span>
              </Link>

              <Link to="/settings" onClick={closeMenu}>
                <FiSettings />
                <span>Settings</span>
              </Link>
            </>
          )}
        </nav>

        {/* Bottom section */}
        {user && (
          <div className="navbar-bottom">
            <div className="user-info">
              <div className="user-avatar">{user.name?.charAt(0) || "U"}</div>

              <div>
                <strong>{user.name || "User"}</strong>
                <small>{user.email}</small>
              </div>
            </div>

            <button className="logout-button" onClick={handleLogout}>
              <FiLogOut />
              <span>Logout</span>
            </button>
          </div>
        )}
      </aside>

      {/* Mobile overlay */}
      {open && <div className="sidebar-overlay" onClick={closeMenu}></div>}
    </>
  );
};

export default Navbar;
