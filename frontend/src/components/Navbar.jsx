import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import logo from "../assets/AIverse-logo.png";
import SearchBar from "./SearchBar";
import API_BASE_URL from "../utils/config";
import { useNotifications, NotificationsDropdown } from "./Notify.jsx";

export default function Navbar() {
  const navigate = useNavigate();
  const { unread, markAllRead } = useNotifications();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [userId, setUserId] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
      const userData = JSON.parse(localStorage.getItem("user"));
      if (userData) {
        setUserId(userData.id);
      }
    };
    handleStorageChange();
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    const storedDarkMode = localStorage.getItem("darkMode");
    const enabled = storedDarkMode === "enabled";
    setDarkMode(enabled);
    document.body.classList.toggle("dark-theme", enabled);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) setShowDropdown(false);
  }, [isLoggedIn]);

  // Support opening notifications from MobileBottomNav via a window event
  useEffect(() => {
    const handler = () => {
      setShowDropdown((s) => !s);
      if (unread) markAllRead();
    };
    window.addEventListener('openNotifications', handler);
    return () => window.removeEventListener('openNotifications', handler);
  }, [unread, markAllRead]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    navigate("/login");
  };

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.body.classList.toggle("dark-theme", next);
    localStorage.setItem("darkMode", next ? "enabled" : "disabled");
  };

  const handleViewProfile = async () => {
    if (!userId) {
      console.warn("User ID not found. Please log in again.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/profile/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch profile data");
      navigate(`/profile/${userId}`);
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  return (
    <nav className="navbar navbar-expand-lg bg-light shadow-sm py-2">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img src={logo} alt="AIverse Logo" height="40" className="me-2" />
          {/* <span className="fw-bold">AIverse</span> */}
        </Link>

        {/* Mobile: dark mode toggle to the left of hamburger */}
        <div className="d-flex align-items-center d-lg-none ms-auto">
          <button
            className={`btn ${darkMode ? "btn-dark" : "btn-outline-dark"} me-2`}
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
          >
            <i className={darkMode ? "fas fa-moon" : "fas fa-sun"}></i>
          </button>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
        </div>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          {/* Search centered on large screens, full-width on mobile */}
          <div className="mx-lg-3 my-2 my-lg-0 flex-grow-1">
            {isLoggedIn && <SearchBar />}
          </div>

          <ul className="navbar-nav ms-auto align-items-lg-center gap-2">
            <li className="nav-item">
              <Link className="btn btn-outline-secondary btn-responsive" to="/activities">
                <i className="fas fa-compass"></i> <span className="d-none d-lg-inline">Activities</span>
              </Link>
            </li>
            {/* Settings button (visible on all sizes) */}
            <li className="nav-item">
              <Link className="btn btn-outline-secondary btn-responsive" to="/settings">
                <i className="fas fa-cog"></i> <span className="d-none d-lg-inline">Settings</span>
              </Link>
            </li>
            {isLoggedIn && (
              <li className="nav-item d-none d-lg-block position-relative">
                <button
                  className="btn btn-outline-warning position-relative"
                  onClick={() => { setShowDropdown((s) => !s); if (unread) markAllRead(); }}
                >
                  <i className="fas fa-bell"></i>
                  {unread > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {unread}
                    </span>
                  )}
                </button>
                {showDropdown && (
                  <div className="position-absolute" style={{ right: 0 }}>
                    <NotificationsDropdown />
                  </div>
                )}
              </li>
            )}

            {isLoggedIn && (
              <li className="nav-item d-none d-lg-block">
                <Link className="btn btn-outline-info" to="/feed">
                  <i className="fas fa-rss"></i> Feed
                </Link>
              </li>
            )}

            <li className="nav-item d-none d-lg-block">
              <button className={`btn ${darkMode ? "btn-dark" : "btn-outline-dark"}`} onClick={toggleDarkMode}>
                <i className={darkMode ? "fas fa-moon" : "fas fa-sun"}></i> {darkMode ? "Dark" : "Light"}
              </button>
            </li>

            {isLoggedIn ? (
              <>
                <li className="nav-item d-none d-lg-block">
                  <Link className="btn btn-success" to="/create-post">
                    <i className="fas fa-plus-circle"></i> Post
                  </Link>
                </li>
                <li className="nav-item d-none d-lg-block">
                  <button className="btn btn-outline-primary" onClick={handleViewProfile}>
                    <i className="fas fa-user-circle"></i> Profile
                  </button>
                </li>
                <li className="nav-item">
                  <button className="btn btn-outline-danger btn-responsive" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt"></i> Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="btn btn-primary btn-responsive" to="/login">Login</Link>
                </li>
                <li className="nav-item">
                  <Link className="btn btn-outline-primary btn-responsive" to="/register">Register</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
