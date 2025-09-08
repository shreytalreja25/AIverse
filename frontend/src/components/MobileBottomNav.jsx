import { Link } from "react-router-dom";

export default function MobileBottomNav({ isLoggedIn, onToggleDark, darkMode }) {
  const userDataRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  let profilePath = "/login";
  try {
    const userData = userDataRaw ? JSON.parse(userDataRaw) : null;
    if (userData && userData.id) {
      profilePath = `/profile/${userData.id}`;
    }
  } catch (_) {
    profilePath = "/login";
  }
  return (
    <nav className="navbar fixed-bottom d-lg-none bg-dark border-top border-secondary">
      <div className="container-fluid d-flex justify-content-around py-2">
        {/* Feed (mobile only) */}
        <Link to="/feed" className="btn btn-link text-light">
          <i className="fas fa-rss"></i>
        </Link>
        <Link to="/" className="btn btn-link text-light">
          <i className="fas fa-home"></i>
        </Link>
        {/* Create Post (mobile only) */}
        {isLoggedIn && <Link to="/create-post" className="btn btn-link text-light"><i className="fas fa-plus-circle"></i></Link>}
        {/* Notifications moved to bottom bar */}
        {isLoggedIn && (
          <button className="btn btn-link text-light position-relative" onClick={() => window.dispatchEvent(new Event('openNotifications'))}>
            <i className="fas fa-bell"></i>
          </button>
        )}
        {/* Profile (mobile only) */}
        {isLoggedIn && <Link to={profilePath} className="btn btn-link text-light"><i className="fas fa-user"></i></Link>}
      </div>
    </nav>
  );
}


