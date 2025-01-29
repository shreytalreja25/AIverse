import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import logo from "../assets/AIverse-logo.png";
import SearchBar from "./SearchBar";
import API_BASE_URL from "../utils/config"; // Import dynamic backend URL

export default function Navbar() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
      const userData = JSON.parse(localStorage.getItem("user"));
      if (userData) {
        setUsername(userData.username);
        setUserId(userData.id);
      }
    };

    handleStorageChange();
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const storedDarkMode = localStorage.getItem("darkMode");
    if (storedDarkMode === "enabled") {
      setDarkMode(true);
      document.body.classList.add("dark-theme");
    } else {
      setDarkMode(false);
      document.body.classList.remove("dark-theme");
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchNotifications();
    }
  }, [isLoggedIn]);

  const fetchNotifications = async () => {
    const mockNotifications = [
      { id: 1, message: "John Doe liked your post", read: false },
      { id: 2, message: "You have a new follower: Alice", read: false },
      { id: 3, message: "Jane mentioned you in a comment", read: true },
    ];
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter((n) => !n.read).length);
  };

  const markNotificationsAsRead = () => {
    const updatedNotifications = notifications.map((notif) => ({
      ...notif,
      read: true,
    }));
    setNotifications(updatedNotifications);
    setUnreadCount(0);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    navigate("/login");
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.body.classList.toggle("dark-theme", newDarkMode);
    localStorage.setItem("darkMode", newDarkMode ? "enabled" : "disabled");
  };

  const handleViewProfile = async () => {
    if (!userId) {
      alert("User ID not found. Please log in again.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/profile/${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch profile data");
      }
      navigate(`/profile/${userId}`);
    } catch (error) {
      console.error("Error fetching profile:", error);
      alert("Failed to load profile. Please try again later.");
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm py-2">
      <div className="container d-flex justify-content-between align-items-center">
        <Link className="navbar-brand" to="/">
          <img src={logo} alt="AIverse Logo" height="40" />
        </Link>
        <div className="d-flex flex-grow-1 mx-3">{isLoggedIn && <SearchBar />}</div>
        <div className="d-flex align-items-center gap-2">
          {isLoggedIn && (
            <>
              <button
                className="btn btn-outline-warning position-relative"
                onClick={markNotificationsAsRead}
                style={{ minWidth: "80px" }}
              >
                <i className="fas fa-bell"></i>
                {unreadCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {unreadCount}
                  </span>
                )}
              </button>

              <Link className="btn btn-outline-info" to="/feed" style={{ minWidth: "80px" }}>
                <i className="fas fa-rss"></i> Feed
              </Link>
            </>
          )}

          <button
            className={`btn ${darkMode ? "btn-dark" : "btn-outline-dark"}`}
            onClick={toggleDarkMode}
            style={{ minWidth: "100px" }}
          >
            <i className={darkMode ? "fas fa-moon" : "fas fa-sun"}></i> {darkMode ? "Dark" : "Light"}
          </button>

          {isLoggedIn ? (
            <>
              <Link className="btn btn-success" to="/create-post" style={{ minWidth: "120px" }}>
                <i className="fas fa-plus-circle"></i> Post
              </Link>
              <button
                className="btn btn-outline-primary"
                onClick={handleViewProfile}
                style={{ minWidth: "120px" }}
              >
                <i className="fas fa-user-circle"></i> Profile
              </button>
              <button
                className="btn btn-outline-danger"
                onClick={handleLogout}
                style={{ minWidth: "100px" }}
              >
                <i className="fas fa-sign-out-alt"></i> Logout
              </button>
            </>
          ) : (
            <>
              <Link className="btn btn-primary" to="/login" style={{ minWidth: "80px" }}>
                Login
              </Link>
              <Link className="btn btn-outline-primary" to="/register" style={{ minWidth: "100px" }}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
