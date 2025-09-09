import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import profilePlaceholder from '../assets/user-profile.png';
import { postsAPI } from '../services/apiService';
import { PostLoading } from '../components/LoadingSpinner';
import { useNotify } from "../components/Notify.jsx";
import { getValidToken, clearAuth } from "../utils/auth.js";
import { useDataFetch } from '../hooks/usePageRefresh';

export default function PostPage() {
  const { warning, error: notifyError, success } = useNotify();
  const { id } = useParams();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [morePosts, setMorePosts] = useState([]);
  const [similarPosts, setSimilarPosts] = useState([]);

  const fetchPost = async () => {
    try {
      console.log('[PostPage] Fetching post with ID:', id);
      const { data } = await postsAPI.getPost(id);
      console.log('[PostPage] Post fetched successfully');
      
      const userData = JSON.parse(localStorage.getItem('user')) || {};
      const userId = userData.id;
      
      setLikes(data.likes?.length || 0);
      setComments(data.comments || []);
      setLiked(data.likes?.some((like) => like.user === userId) || false);

      // Fetch additional data
      if (userId) {
        try {
          const { data: moreData } = await postsAPI.getUserPosts(userId);
          setMorePosts(moreData || []);
        } catch (err) {
          console.error('Error fetching more posts:', err);
        }
      }

      try {
        const { data: similarData } = await postsAPI.getSimilarPosts(id);
        setSimilarPosts(similarData || []);
      } catch (err) {
        console.error('Error fetching similar posts:', err);
      }

      return data;
    } catch (err) {
      console.error('[PostPage] Error fetching post:', err);
      throw new Error(err?.response?.data?.error || err.message || 'Failed to fetch post');
    }
  };

  const { data: post, loading, error, refresh } = useDataFetch(fetchPost, [id]);

  const handleLike = async () => {
    const token = getValidToken();
    if (!token) return warning('You need to be logged in to like posts!');

    try {
      if (liked) {
        await postsAPI.unlikePost(id);
      } else {
        await postsAPI.likePost(id);
      }
      
      setLiked(!liked);
      setLikes((prevLikes) => (liked ? prevLikes - 1 : prevLikes + 1));
    } catch (error) {
      if (error?.response?.status === 401) {
        notifyError('Session expired. Please log in again.');
        clearAuth();
        window.location.href = '/login';
      } else {
        notifyError('Failed to update like.');
      }
      console.error('Error updating like:', error);
    }
  };

  const handleAddComment = async () => {
    if (newComment.trim()) {
      const token = getValidToken();
      if (!token) return warning('You need to be logged in to comment!');

      try {
        const { data } = await postsAPI.addComment(id, newComment);
        setComments([...comments, data]);
        setNewComment('');
      } catch (error) {
        if (error?.response?.status === 401) {
          notifyError('Session expired. Please log in again.');
          clearAuth();
          window.location.href = '/login';
        } else {
          notifyError('Failed to add comment');
        }
        console.error('Error adding comment:', error);
      }
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    success('Post link copied to clipboard!');
  };

  if (loading) return <PostLoading message="Loading post details..." />;
  if (error) return <p className="text-center text-danger">{error}</p>;

  return (
    <div className="container my-4">
      <div className="row">
        {/* Main Post Section */}
        <div className="col-lg-8">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="fw-bold text-primary mb-0">Post Details</h4>
            <button 
              className="btn btn-outline-primary btn-sm"
              onClick={refresh}
              disabled={loading}
            >
              <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
              {loading ? ' Refreshing...' : ' Refresh'}
            </button>
          </div>
          <div className="card shadow-sm border-0 p-4">
            <div className="d-flex align-items-center mb-3">
              <img
                src={post?.authorInfo?.profileImage || profilePlaceholder}
                alt="Profile"
                className="rounded-circle border me-3"
                width="50"
                height="50"
              />
              <div>
                <h5 className="fw-bold text-primary mb-0">
                  {post?.authorInfo?.firstName} {post?.authorInfo?.lastName}
                </h5>
                <small>{new Date(post?.createdAt).toLocaleString()}</small>
              </div>
            </div>

            <p className="lead">{post?.content?.text}</p>
            {post?.content?.image && (
              <img src={post.content.image} className="img-fluid rounded mb-3" alt="Post" />
            )}

            <div className="d-flex justify-content-between">
              <button className={`btn ${liked ? 'btn-primary' : 'btn-outline-primary'}`} onClick={handleLike}>
                <i className="fas fa-thumbs-up"></i> {likes} Likes
              </button>
              <button className="btn btn-outline-secondary">
                <i className="fas fa-comment"></i> {comments.length} Comments
              </button>
              <button className="btn btn-outline-info" onClick={handleShare}>
                <i className="fas fa-share"></i> Share
              </button>
            </div>

            {/* Comments Section */}
            <div className="mt-4">
              <h5>Comments</h5>
              <div className="list-group">
                {comments.length > 0 ? (
                  comments.map((comment, index) => (
                    <div key={index} className="list-group-item border-0">
                      <strong>
                        {comment.commenterInfo ? 
                          `${comment.commenterInfo.firstName} ${comment.commenterInfo.lastName} (@${comment.commenterInfo.username})` : 
                          comment.user
                        }:
                      </strong> {comment.text}
                    </div>
                  ))
                ) : (
                  <p className="text-muted">No comments yet.</p>
                )}
              </div>

              <div className="input-group mt-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button className="btn btn-primary" onClick={handleAddComment}>
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Sections */}
        <div className="col-lg-4">
          {/* More Posts by This User */}
          <div className="card shadow-sm border-0 p-4 mb-4">
            <h5 className="fw-bold text-primary mb-3">More from {post?.authorInfo?.firstName}</h5>
            <ul className="list-unstyled">
              {morePosts.map((p) => (
                <li key={p._id} className="mb-2">
                  <Link to={`/post/${p._id}`} className="text-decoration-none">
                    {p.content.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {/* Similar Posts Section */}
          <div className="card shadow-sm border-0 p-4">
            <h5 className="fw-bold text-primary mb-3">Similar Posts</h5>
            <ul className="list-unstyled">
              {similarPosts.length > 0 ? (
                similarPosts.map((p) => (
                  <li key={p._id} className="mb-2">
                    <Link to={`/post/${p._id}`} className="text-decoration-none">
                      {p.content.text}
                    </Link>
                  </li>
                ))
              ) : (
                <p>No similar posts available.</p>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
