import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import profilePlaceholder from "../assets/user-profile.png";
import { usersAPI, postsAPI } from "../services/apiService";
import { ProfileLoading } from "../components/LoadingSpinner";
import { ProfileSkeleton } from "../components/SkeletonLoader";
import { useNotify } from "../components/Notify.jsx";
import { getValidToken, clearAuth } from "../utils/auth.js";
import { useDataFetch } from "../hooks/usePageRefresh";

export default function ProfilePage() {
  const { error: notifyError, warning, success } = useNotify();
  const { id } = useParams();
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [showDMModal, setShowDMModal] = useState(false);

  const fetchUserProfile = async () => {
    try {
      const { data } = await usersAPI.getProfile(id);
      const userData = { ...data, profileImage: data.profileImage || profilePlaceholder };
      
      const loggedInUser = JSON.parse(localStorage.getItem("user"));
      if (loggedInUser) {
        // Check if this is the user's own profile
        setIsOwnProfile(loggedInUser.id === id);
        setIsFollowing(data.followers.some((follower) => follower.userId === loggedInUser.id));
      }
      
      return userData;
    } catch (error) {
      console.error("Error fetching profile:", error);
      throw error;
    }
  };

  const fetchUserPosts = async () => {
    try {
      const { data } = await postsAPI.getUserPosts(id);
      return data;
    } catch (error) {
      console.error("Error fetching user posts:", error);
      throw error;
    }
  };

  const { data: user, loading: userLoading, error: userError, refresh: refreshUser } = useDataFetch(fetchUserProfile, [id]);
  const { data: userPosts, loading: postsLoading, error: postsError, refresh: refreshPosts } = useDataFetch(fetchUserPosts, [id]);

  const loading = userLoading || postsLoading;
  const error = userError || postsError;

  const handleFollowToggle = async () => {
    const token = getValidToken();
    if (!token) return warning("Please log in to follow users.");

    try {
      if (isFollowing) {
        await usersAPI.unfollowUser(id);
      } else {
        await usersAPI.followUser(id);
      }
      
      setIsFollowing(!isFollowing);
      // Refresh user data to get updated follower count
      refreshUser();
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

  if (loading) return <ProfileSkeleton />;
  if (error) return <p className="text-center text-danger">{error.message}</p>;
  if (!user) return <p className="text-center text-danger">User not found.</p>;

  return (
    <div className="container my-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold text-primary mb-0">Profile</h3>
        <div className="btn-group" role="group">
          <button 
            className="btn btn-outline-primary btn-sm"
            onClick={refreshUser}
            disabled={userLoading}
            title="Refresh Profile"
          >
            <i className={`fas fa-sync-alt ${userLoading ? 'fa-spin' : ''}`}></i>
            {userLoading ? ' Refreshing...' : ' Refresh Profile'}
          </button>
          <button 
            className="btn btn-outline-secondary btn-sm"
            onClick={refreshPosts}
            disabled={postsLoading}
            title="Refresh Posts"
          >
            <i className={`fas fa-sync-alt ${postsLoading ? 'fa-spin' : ''}`}></i>
            {postsLoading ? ' Refreshing...' : ' Refresh Posts'}
          </button>
        </div>
      </div>
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
              {isOwnProfile ? (
                <button
                  className="btn btn-primary"
                  onClick={() => navigate(`/profile/${id}/edit`)}
                >
                  <i className="fas fa-edit"></i> Edit Profile
                </button>
              ) : (
                <>
                  <button
                    className={`btn ${isFollowing ? "btn-danger" : "btn-primary"}`}
                    onClick={handleFollowToggle}
                  >
                    {isFollowing ? "Unfollow" : "Follow"}
                  </button>
                  <button
                    className="btn btn-outline-success"
                    onClick={() => {
                      // Show DM prototype modal
                      setShowDMModal(true);
                    }}
                  >
                    <i className="fas fa-envelope"></i> DM
                  </button>
                </>
              )}
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

      {/* DM Prototype Modal */}
      {showDMModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-light">
              <div className="modal-header border-secondary">
                <h5 className="modal-title">
                  <i className="fas fa-envelope text-success me-2"></i>
                  Direct Message
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowDMModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="d-flex align-items-center mb-3">
                  <img
                    src={user.profileImage}
                    alt="Profile"
                    className="rounded-circle me-3"
                    width="50"
                    height="50"
                  />
                  <div>
                    <h6 className="mb-0 text-primary">{user.username}</h6>
                    <small className="text-muted">Online</small>
                  </div>
                </div>
                
                <div className="chat-container" style={{ height: '300px', overflowY: 'auto', border: '1px solid #444', borderRadius: '8px', padding: '15px', marginBottom: '15px' }}>
                  <div className="message received mb-3">
                    <div className="d-flex align-items-start">
                      <img
                        src={user.profileImage}
                        alt="Profile"
                        className="rounded-circle me-2"
                        width="30"
                        height="30"
                      />
                      <div className="bg-secondary p-2 rounded" style={{ maxWidth: '70%' }}>
                        <p className="mb-0">Hey! How are you doing?</p>
                        <small className="text-muted">2:30 PM</small>
                      </div>
                    </div>
                  </div>
                  
                  <div className="message sent mb-3">
                    <div className="d-flex align-items-start justify-content-end">
                      <div className="bg-primary p-2 rounded text-white" style={{ maxWidth: '70%' }}>
                        <p className="mb-0">I'm doing great! Thanks for asking. How about you?</p>
                        <small className="text-light">2:32 PM</small>
                      </div>
                      <img
                        src={profilePlaceholder}
                        alt="You"
                        className="rounded-circle ms-2"
                        width="30"
                        height="30"
                      />
                    </div>
                  </div>
                  
                  <div className="message received mb-3">
                    <div className="d-flex align-items-start">
                      <img
                        src={user.profileImage}
                        alt="Profile"
                        className="rounded-circle me-2"
                        width="30"
                        height="30"
                      />
                      <div className="bg-secondary p-2 rounded" style={{ maxWidth: '70%' }}>
                        <p className="mb-0">Pretty good! Just working on some new projects. What's new with you?</p>
                        <small className="text-muted">2:35 PM</small>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control bg-dark text-light border-secondary"
                    placeholder="Type a message..."
                    disabled
                  />
                  <button className="btn btn-primary" disabled>
                    <i className="fas fa-paper-plane"></i>
                  </button>
                </div>
                
                <div className="alert alert-info mt-3 mb-0">
                  <i className="fas fa-info-circle me-2"></i>
                  <strong>Prototype Notice:</strong> This is a preview of the direct messaging feature. Full functionality will be available soon!
                </div>
              </div>
              <div className="modal-footer border-secondary">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDMModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setShowDMModal(false);
                    success("Direct messaging feature coming soon!");
                  }}
                >
                  <i className="fas fa-bell me-2"></i>
                  Notify Me When Ready
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
