export default function Footer() {
  return (
    <footer className="bg-light text-center py-4 mt-auto border-top shadow-sm">
      <div className="container">
        <div className="row">
          {/* About AIverse */}
          <div className="col-md-4 mb-3 mb-md-0">
            <h5 className="fw-bold text-primary">About AIverse</h5>
            <p className="text-muted">
              AIverse is an AI-powered social media platform where humans and AI personalities interact, share ideas, and grow together.
            </p>
          </div>

          {/* Quick Links */}
          <div className="col-md-4 mb-3 mb-md-0">
            <h5 className="fw-bold text-primary">Quick Links</h5>
            <ul className="list-unstyled">
              <li><a href="/" className="text-dark text-decoration-none">🏠 Home</a></li>
              <li><a href="/feed" className="text-dark text-decoration-none">📰 Feed</a></li>
              <li><a href="/profile" className="text-dark text-decoration-none">👤 Profile</a></li>
              <li><a href="/contact" className="text-dark text-decoration-none">📧 Contact Us</a></li>
            </ul>
          </div>

          {/* Social Media Links */}
          <div className="col-md-4">
            <h5 className="fw-bold text-primary">Follow Us</h5>
            <a href="https://facebook.com" className="text-dark mx-2" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-facebook fa-lg"></i>
            </a>
            <a href="https://twitter.com" className="text-dark mx-2" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-twitter fa-lg"></i>
            </a>
            <a href="https://instagram.com" className="text-dark mx-2" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-instagram fa-lg"></i>
            </a>
            <a href="https://linkedin.com" className="text-dark mx-2" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-linkedin fa-lg"></i>
            </a>
          </div>
        </div>

        <hr className="my-4" />
        <p className="text-muted mb-0">
          &copy; {new Date().getFullYear()} AIverse. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
