import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import profilePlaceholder from '../assets/user-profile.png';

export default function ProfilePage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    // Fetch user profile
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/profile/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }
        const data = await response.json();

        setUser({
          ...data,
          profileImage: data.profileImage || profilePlaceholder,
        });

        // Check if the logged-in user is following this profile
        const loggedInUser = JSON.parse(localStorage.getItem('user'));
        if (loggedInUser) {
          setIsFollowing(data.followers.some(follower => follower.userId === loggedInUser._id));
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [id]);

  // Handle follow/unfollow action
  const handleFollowToggle = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to follow users.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/users/${id}/${isFollowing ? 'unfollow' : 'follow'}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        setUser(prevState => ({
          ...prevState,
          followers: isFollowing
            ? prevState.followers.filter(f => f.userId !== id)
            : [...prevState.followers, { userId: id, followedAt: new Date() }]
        }));
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to update follow status');
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
      alert('An error occurred. Please try again later.');
    }
  };

  if (loading) return <p className="text-center">Loading profile...</p>;
  if (!user) return <p className="text-center text-danger">User not found.</p>;

  return (
    <div className="container my-5">
      <div className="card p-4 shadow-lg border-0 bg-dark text-light">
        <div className="row align-items-center">
          <div className="col-md-4 text-center">
            <img
              src={user.profileImage}
              alt="Profile"
              className="rounded-circle border border-3 border-primary"
              width="150"
              height="150"
            />
          </div>
          <div className="col-md-8 text-center text-md-start">
            <h2 className="fw-bold text-primary">{user.username}</h2>
            <p className="text-light">{user.bio || 'No bio available'}</p>
            <div className="d-flex justify-content-center justify-content-md-start">
              <div className="me-4 text-center">
                <h5 className="fw-bold text-primary">{user.posts?.length || 0}</h5>
                <p className="text-light">Posts</p>
              </div>
              <div className="me-4 text-center">
                <h5 className="fw-bold text-primary">{user.followers?.length || 0}</h5>
                <p className="text-light">Followers</p>
              </div>
              <div className="text-center">
                <h5 className="fw-bold text-primary">{user.following?.length || 0}</h5>
                <p className="text-light">Following</p>
              </div>
            </div>
            <button
              className={`btn ${isFollowing ? 'btn-danger' : 'btn-primary'} mt-3`}
              onClick={handleFollowToggle}
            >
              {isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          </div>
        </div>
      </div>

      {/* User Posts Section */}
      <div className="mt-5">
        <h4 className="fw-bold text-primary mb-4">User Posts</h4>
        <div className="row row-cols-1 row-cols-md-3 g-4">
          {user.posts?.length > 0 ? (
            user.posts.map((post, index) => (
              <div className="col" key={index}>
                <div className="card shadow-sm bg-secondary text-light border-0 h-100">
                  <img src={post.image} className="card-img-top rounded" alt="Post" />
                  <div className="card-body">
                    <p>{post.content}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-light text-center">No posts yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
