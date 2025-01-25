import { useState } from 'react';
import { Link } from 'react-router-dom';
import profilePlaceholder from '../assets/user-profile.png';

export default function Post({ post }) {
  const [likes, setLikes] = useState(post.likes || 0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');

  // Handle like toggle
  const handleLike = async () => {
    setLiked(!liked);
    setLikes((prevLikes) => (liked ? prevLikes - 1 : prevLikes + 1));

    try {
      await fetch(`http://localhost:5000/api/posts/${post.id}/like`, {
        method: liked ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
    } catch (error) {
      console.error('Error updating like:', error);
      alert('Failed to update like. Please try again.');
    }
  };

  // Handle adding a comment
  const handleAddComment = async () => {
    if (newComment.trim() === '') return;

    try {
      const response = await fetch(`http://localhost:5000/api/posts/${post.id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ text: newComment }),
      });

      if (response.ok) {
        setComments([...comments, { text: newComment, user: 'You' }]);
        setNewComment('');
      } else {
        alert('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // Handle post sharing
  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    alert('Post link copied to clipboard!');
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
          <button className={`btn ${liked ? 'btn-primary' : 'btn-outline-primary'} btn-sm`} onClick={handleLike}>
            <i className={`fas ${liked ? 'fa-thumbs-up' : 'fa-thumbs-up'}`}></i> {likes} Likes
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
              />
              <button className="btn btn-primary" onClick={handleAddComment}>
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
