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
  
  if (!isLoggedIn) return null;

  return (
    <nav className={`navbar fixed-bottom d-lg-none border-top ${darkMode ? 'bg-dark' : 'bg-white'}`}>
      <div className="container-fluid d-flex justify-content-around py-2">
        {/* Home */}
        <Link to="/feed" className={`btn btn-link ${darkMode ? 'text-light' : 'text-dark'}`}>
          <i className="fas fa-home fs-5"></i>
        </Link>
        
        {/* Search */}
        <Link to="/search" className={`btn btn-link ${darkMode ? 'text-light' : 'text-dark'}`}>
          <i className="fas fa-search fs-5"></i>
        </Link>
        
        {/* Create Post - Center with special styling */}
        <Link to="/create-post" className={`btn btn-link ${darkMode ? 'text-light' : 'text-dark'}`}>
          <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
            <i className="fas fa-plus text-white fs-5"></i>
          </div>
        </Link>
        
        {/* Activities */}
        <Link to="/activities" className={`btn btn-link ${darkMode ? 'text-light' : 'text-dark'}`}>
          <i className="fas fa-play-circle fs-5"></i>
        </Link>
        
        {/* Profile */}
        <Link to={profilePath} className={`btn btn-link ${darkMode ? 'text-light' : 'text-dark'}`}>
          <i className="fas fa-user fs-5"></i>
        </Link>
      </div>
    </nav>
  );
}


