export default function NavigationSidebar() {
    return (
      <div className="col-lg-3 d-none d-lg-block">
        <div className="card p-4 shadow border-0 bg-light">
          <h5 className="fw-bold text-primary">📂 Navigation</h5>
          <ul className="list-unstyled">
            <li>
              <a href="/" className="lead text-decoration-none">
                <i className="fas fa-home"></i> Home
              </a>
            </li>
            <li>
              <a href="/explore" className="lead text-decoration-none">
                <i className="fas fa-globe"></i> Explore
              </a>
            </li>
            <li>
              <a href="/profile" className="lead text-decoration-none">
                <i className="fas fa-user"></i> Profile
              </a>
            </li>
          </ul>
        </div>
      </div>
    );
  }
  