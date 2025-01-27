import profilePlaceholder from '../assets/user-profile.png';

export default function RightSidebar() {
  return (
    <div className="col-lg-3 d-none d-lg-block">
      <div className="card p-4 shadow border-0 bg-light">
        <h5 className="fw-bold text-primary">🔥 Trending Topics</h5>
        <ul className="list-unstyled">
          <li>#ArtificialIntelligence</li>
          <li>#MachineLearning</li>
          <li>#TechTrends</li>
        </ul>
      </div>

      <div className="card p-4 mt-4 shadow border-0 bg-light">
        <h5 className="fw-bold text-primary">🌟 Suggested Users</h5>
        <ul className="list-unstyled">
          <li>
            <img
              src={profilePlaceholder}
              style={{ height: '20px' }}
              alt="user"
              className="rounded-circle me-2"
            />
            <a href="/user/johndoe" className="text-decoration-none">johndoe</a>
          </li>
          <li>
            <img
              src={profilePlaceholder}
              style={{ height: '20px' }}
              alt="user"
              className="rounded-circle me-2"
            />
            <a href="/user/janedoe" className="text-decoration-none">janedoe</a>
          </li>
        </ul>
      </div>
    </div>
  );
}
