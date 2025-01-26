import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import logo from '../assets/AIverse-logo.png';

export default function Navbar() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Listen for login state changes
  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem('token'));

      // Retrieve user data when logged in
      const userData = JSON.parse(localStorage.getItem('user'));
      if (userData) {
        setUsername(userData.username);
        setUserId(userData.id); // Correcting the ID retrieval
      }
    };

    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Load dark mode preference from localStorage
  useEffect(() => {
    const storedDarkMode = localStorage.getItem('darkMode');
    if (storedDarkMode === 'enabled') {
      setDarkMode(true);
      document.body.classList.add('dark-theme');
    } else {
      setDarkMode(false);
      document.body.classList.remove('dark-theme');
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchNotifications();
    }
  }, [isLoggedIn]);

  // Fetch notifications (mocked API call)
  const fetchNotifications = async () => {
    const mockNotifications = [
      { id: 1, message: 'John Doe liked your post', read: false },
      { id: 2, message: 'You have a new follower: Alice', read: false },
      { id: 3, message: 'Jane mentioned you in a comment', read: true },
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/search?query=${searchQuery}`);
  };

  // Toggle dark mode and store preference in localStorage
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.body.classList.toggle('dark-theme', newDarkMode);
    localStorage.setItem('darkMode', newDarkMode ? 'enabled' : 'disabled');
  };

  const handleViewProfile = async () => {
    if (!userId) {
      alert('User ID not found. Please log in again.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/profile/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch profile data');
      }
      navigate(`/profile/${userId}`);
    } catch (error) {
      console.error('Error fetching profile:', error);
      alert('Failed to load profile. Please try again later.');
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <img src={logo} alt="AIverse Logo" height="40" />
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center">
            {/* Search Bar */}
            <li className="nav-item me-3">
              <form className="d-flex" onSubmit={handleSearch}>
                <input
                  type="text"
                  className="form-control me-2"
                  placeholder="Search AIverse..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="btn btn-outline-primary" type="submit">
                  <i className="fas fa-search"></i>
                </button>
              </form>
            </li>

            {/* Notifications Dropdown */}
            {isLoggedIn && (
              <li className="nav-item dropdown me-3">
                <button
                  className="btn btn-outline-warning dropdown-toggle position-relative"
                  id="notificationDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  onClick={markNotificationsAsRead}
                >
                  <i className="fas fa-bell"></i>
                  {unreadCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="notificationDropdown">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <li key={notification.id} className={`dropdown-item ${notification.read ? '' : 'fw-bold'}`}>
                        {notification.message}
                      </li>
                    ))
                  ) : (
                    <li className="dropdown-item text-muted">No new notifications</li>
                  )}
                </ul>
              </li>
            )}

            {/* Feed Button (Only visible when logged in) */}
            {isLoggedIn && (
              <li className="nav-item me-3">
                <Link className="btn btn-outline-info" to="/feed">
                  <i className="fas fa-rss"></i> Feed
                </Link>
              </li>
            )}

            {/* Dark Mode Toggle */}
            <li className="nav-item me-3">
              <button className={`btn ${darkMode ? 'btn-dark' : 'btn-outline-dark'}`} onClick={toggleDarkMode}>
                <i className={darkMode ? 'fas fa-moon' : 'fas fa-sun'}></i> {darkMode ? 'Dark' : 'Light'} Mode
              </button>
            </li>

            {isLoggedIn ? (
              <>
                <li className="nav-item">
                  <Link className="btn btn-success me-3" to="/create-post">
                    <i className="fas fa-plus-circle"></i> Create Post
                  </Link>
                </li>
                <li className="nav-item">
                  <button className="btn btn-outline-primary me-3" onClick={handleViewProfile}>
                    <i className="fas fa-user-circle"></i> View Profile ({username})
                  </button>
                </li>
                <li className="nav-item">
                  <button className="btn btn-outline-danger" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt"></i> Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">
                    <i className="fas fa-sign-in-alt"></i> Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="btn btn-primary" to="/register">
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
