import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import profilePlaceholder from "../assets/user-profile.png";
import API_BASE_URL from "../utils/config"; // Import dynamic backend URL

export default function Post({ post }) {
  const [likes, setLikes] = useState(post.likes.length || 0);
  const [liked, setLiked] = useState(post.liked || false);
  const [comments, setComments] = useState(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if the current user has already liked the post
    const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user"))._id : null;
    if (currentUser && post.likes.some((like) => like.user === currentUser)) {
      setLiked(true);
    }
  }, [post.likes]);

  // Handle like/unlike toggle
  const handleLike = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You need to be logged in to like posts!");
      return;
    }

    setLiked(!liked);
    setLikes((prevLikes) => (liked ? prevLikes - 1 : prevLikes + 1));

    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${post.id}/like`, {
        method: liked ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to update like");
      }
    } catch (error) {
      console.error("Error updating like:", error);
      alert("Failed to update like. Please try again.");
      setLiked(!liked);
      setLikes((prevLikes) => (liked ? prevLikes + 1 : prevLikes - 1));
    }
  };

  // Handle adding a comment
  const handleAddComment = async () => {
    if (newComment.trim() === "") return;

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${post.id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ text: newComment }),
      });

      if (response.ok) {
        const newCommentData = await response.json();
        setComments([...comments, newCommentData]);
        setNewComment("");
      } else {
        alert("Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle post sharing
  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    alert("Post link copied to clipboard!");
  };

  return (
    <div className="card mb-4 shadow-sm border-0 bg-dark text-light">
      <div className="card-body">
        <div className="d-flex align-items-center mb-3">
          <img
            src={post.profileImage || profilePlaceholder}
            alt="Profile"
            className="rounded-circle border me-3"
            width="50"
            height="50"
          />
          <div>
            <Link to={`/user/${post.username}`} className="text-primary fw-bold text-decoration-none">
              {post.firstName} {post.lastName} (@{post.username})
            </Link>
            <small className="d-block text-muted">{post.time}</small>
          </div>
        </div>

        <p className="mb-3">{post.content}</p>
        {post.image && <img src={post.image} className="img-fluid rounded mb-3" alt="Post" />}

        <div className="d-flex justify-content-between align-items-center">
          <button className={`btn ${liked ? "btn-primary" : "btn-outline-primary"} btn-sm`} onClick={handleLike}>
            <i className={`fas ${liked ? "fa-thumbs-up" : "fa-thumbs-up"}`}></i> {likes} Likes
          </button>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowComments(!showComments)}>
            <i className="fas fa-comment"></i> {comments.length} Comments
          </button>
          <button className="btn btn-outline-info btn-sm" onClick={handleShare}>
            <i className="fas fa-share"></i> Share
          </button>
        </div>

        {showComments && (
          <div className="mt-3">
            <h6 className="text-primary">Comments</h6>
            {comments.length > 0 ? (
              comments.map((comment, index) => (
                <div key={index} className="border-bottom pb-2 mb-2">
                  <strong>{comment.user}:</strong> {comment.text}
                </div>
              ))
            ) : (
              <p className="text-muted">No comments yet.</p>
            )}

            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={loading}
              />
              <button className="btn btn-primary" onClick={handleAddComment} disabled={loading}>
                {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
