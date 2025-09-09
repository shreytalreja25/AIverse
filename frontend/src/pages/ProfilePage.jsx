import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import profilePlaceholder from "../assets/user-profile.png";
import api from "../utils/apiClient";
import { useNotify } from "../components/Notify.jsx";
import { getValidToken, clearAuth } from "../utils/auth.js";

export default function ProfilePage() {
  const { error: notifyError, warning, success } = useNotify();
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchUserProfile = async () => {
      try {
        const { data } = await api.get(`/api/profile/${id}`);
        setUser({ ...data, profileImage: data.profileImage || profilePlaceholder });
        const loggedInUser = JSON.parse(localStorage.getItem("user"));
        if (loggedInUser) {
          setIsFollowing(data.followers.some((follower) => follower.userId === loggedInUser.id));
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserPosts = async () => {
      try {
        const { data } = await api.get(`/api/posts/user/${id}`);
        setUserPosts(data);
      } catch (error) {
        console.error("Error fetching user posts:", error);
      }
    };

    fetchUserProfile();
    fetchUserPosts();
  }, [id]);

  const handleFollowToggle = async () => {
    const token = getValidToken();
    if (!token) return warning("Please log in to follow users.");

    try {
      await api.post(`/api/users/${id}/${isFollowing ? "unfollow" : "follow"}`);
      setIsFollowing(!isFollowing);
      setUser((prevState) => ({
        ...prevState,
        followers: isFollowing
          ? prevState.followers.filter((f) => f.userId !== id)
          : [...prevState.followers, { userId: id, followedAt: new Date() }],
      }));
    } catch (error) {
      if (error?.response?.status === 401) {
        notifyError('Session expired. Please log in again.');
        clearAuth();
        window.location.href = '/login';
      } else {
        notifyError(error?.response?.data?.message || "Failed to update follow status");
      }
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
            <p className="text-light">{user.bio || "No bio available"}</p>
            <div className="d-flex justify-content-center justify-content-md-start">
              <div className="me-4 text-center">
                <h5 className="fw-bold text-primary">{userPosts.length}</h5>
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
            <div className="d-flex gap-2 mt-3">
              <button
                className={`btn ${isFollowing ? "btn-danger" : "btn-primary"}`}
                onClick={handleFollowToggle}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </button>
              <button
                className="btn btn-outline-success"
                onClick={() => {
                  // Prototype for messaging - show alert for now
                  alert("Direct messaging feature coming soon! This will allow you to send private messages to this user.");
                }}
              >
                <i className="fas fa-envelope"></i> DM
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <h4 className="fw-bold text-primary mb-4">User Posts</h4>
        <div className="row row-cols-1 row-cols-md-3 g-4">
          {userPosts.length > 0 ? (
            userPosts.map((post) => (
              <div className="col" key={post._id} onClick={() => navigate(`/post/${post._id}`)} style={{ cursor: "pointer" }}>
                <div className="card shadow-sm bg-secondary text-light border-0 h-100">
                  <img src={post.content.image || profilePlaceholder} className="card-img-top rounded" alt="Post" />
                  <div className="card-body">
                    <p>{post.content.text}</p>
                    <div className="d-flex justify-content-between">
                      <span>
                        <i className="fas fa-thumbs-up"></i> {post.likes.length} Likes
                      </span>
                      <span>
                        <i className="fas fa-comment"></i> {post.comments.length} Comments
                      </span>
                    </div>
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
