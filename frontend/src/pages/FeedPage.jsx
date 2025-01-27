import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Post from '../components/Post';
import profilePlaceholder from '../assets/user-profile.png';
import Stories from '../components/Stories';

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch posts from the API
    const fetchPosts = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/posts?page=1&limit=10');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch posts');
        }

        setPosts(data);
      } catch (error) {
        setError(error.message);
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Function to navigate to the individual post page
  const handlePostClick = (postId) => {
    navigate(`/post/${postId}`);
  };

  // Handle like functionality
  const handleLike = async (postId, isLiked) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You need to be logged in to like posts!');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/like`, {
        method: isLiked ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post._id === postId
              ? {
                ...post,
                likes: isLiked ? post.likes - 1 : post.likes + 1,
                liked: !isLiked,
              }
              : post
          )
        );
      } else {
        console.error('Failed to update like status');
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  return (
    <div className="container my-4">
      <div className="row">
        {/* Left Sidebar */}
        <div className="col-lg-3 d-none d-lg-block">
          <div className="card p-4 shadow border-0 bg-light">
            <h5 className="fw-bold text-primary">📂 Navigation</h5>
            <ul className="list-unstyled">
              <li><a href="/" className="lead text-decoration-none"><i className="fas fa-home"></i> Home</a></li>
              <li><a href="/explore" className="lead text-decoration-none"><i className="fas fa-globe"></i> Explore</a></li>
              <li><a href="/profile" className="lead text-decoration-none"><i className="fas fa-user"></i> Profile</a></li>
            </ul>
          </div>
        </div>

        {/* Main Feed */}
        <div className="col-lg-6">
          <Stories />
          <h2 className="fw-bold text-primary text-center mb-4">Your Feed</h2>

          {loading ? (
            <p className="text-center">Loading posts...</p>
          ) : error ? (
            <p className="text-center text-danger">{error}</p>
          ) : posts.length === 0 ? (
            <p className="text-center">No posts available.</p>
          ) : (
            posts.map((post) => (
              <div key={post._id} style={{ cursor: 'pointer' }} onClick={() => handlePostClick(post._id)}>
                <Post
                  post={{
                    id: post._id,
                    username: post.authorInfo?.username || 'Unknown',
                    profileImage: post.authorInfo?.profileImage || profilePlaceholder,
                    content: post.content.text,
                    image: post.content.image || null,
                    likes: post.likes,
                    liked: post.liked || false,
                    comments: post.comments.length,
                    time: new Date(post.createdAt).toLocaleString(),
                    firstName: post.authorInfo?.firstName || '',
                    lastName: post.authorInfo?.lastName || '',
                  }}
                  onLike={() => handleLike(post._id, post.liked)}
                />
              </div>
            ))
          )}
        </div>

        {/* Right Sidebar */}
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
                <img src={profilePlaceholder} style={{ height: '20px' }} alt="user" className="rounded-circle me-2" />
                <a href="/user/johndoe" className="text-decoration-none">johndoe</a>
              </li>
              <li>
                <img src={profilePlaceholder} style={{ height: '20px' }} alt="user" className="rounded-circle me-2" />
                <a href="/user/janedoe" className="text-decoration-none">janedoe</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
