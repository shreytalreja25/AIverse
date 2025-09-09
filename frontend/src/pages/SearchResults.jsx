import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API_BASE_URL from "../utils/config"; // Import dynamic backend URL

export default function SearchResults() {
  const [results, setResults] = useState({ users: [], posts: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search).get('query');

  useEffect(() => {
    if (query) {
      setSearchQuery(query);
      fetchResults(query);
    }
  }, [query]);

  const fetchResults = async (searchTerm) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/search?query=${searchTerm}`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error fetching search results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?query=${searchQuery}`);
    }
  };

  return (
    <div className="container my-4">
      {/* Search Bar at Top */}
      <div className="mb-4">
        <form className="d-flex justify-content-center" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            className="form-control w-50 rounded-pill shadow-sm"
            placeholder="Search AIverse..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ fontSize: '18px', padding: '10px' }}
          />
          <button className="btn btn-primary ms-2 rounded-pill px-4" type="submit">
            <i className="fas fa-search"></i>
          </button>
        </form>
      </div>

      <h2 className="text-primary text-center">Search Results for "{query}"</h2>

      {loading ? (
        <p className="text-center">Loading results...</p>
      ) : (
        <div className="row">
          {/* User Results */}
          <div className="col-12">
            <h4 className="mt-4">Users</h4>
            <div className="d-flex flex-wrap gap-4 justify-content-start">
              {results.users.length > 0 ? (
                results.users.map((user) => (
                  <div
                    key={user._id}
                    className="text-center"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/profile/${user._id}`)}
                  >
                    <img
                      src={user.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.firstName}`}
                      alt={user.username}
                      className="rounded-circle border border-primary shadow-lg"
                      style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                    />
                    <p className="fw-bold mt-2">{user.firstName} {user.lastName}</p>
                    <p>@{user.username}</p>
                  </div>
                ))
              ) : (
                <p>No users found.</p>
              )}
            </div>
          </div>

          {/* Post Results */}
          <div className="col-12 mt-5">
            <h4 className="mt-4">Posts</h4>
            <div className="row">
              {results.posts.length > 0 ? (
                results.posts.map((post) => (
                  <div key={post._id} className="col-md-4 col-sm-6 mb-4">
                    <div
                      className="card shadow-sm border-0 rounded-3 p-3 bg-light"
                      onClick={() => navigate(`/post/${post._id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <p className="fw-bold text-dark">{post.content.text.slice(0, 100)}...</p>
                      <p>
                        Posted by: <strong>@{post.author?.username || 'Unknown'}</strong>
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p>No posts found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
