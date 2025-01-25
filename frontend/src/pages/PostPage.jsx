import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import profilePlaceholder from '../assets/user-profile.png';

export default function PostPage() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [morePosts, setMorePosts] = useState([]);
  const [similarPosts, setSimilarPosts] = useState([]);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/posts/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch post');
        }
        const data = await response.json();
        setPost(data);
        setLikes(data.likes.length);
        setComments(data.comments);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchMorePosts = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/posts/user/${data.authorInfo._id}`);
        if (response.ok) {
          const data = await response.json();
          setMorePosts(data);
        }
      } catch (error) {
        console.error('Error fetching more posts:', error);
      }
    };

    const fetchSimilarPosts = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/posts/similar/${id}`);
        if (response.ok) {
          const data = await response.json();
          setSimilarPosts(data);
        }
      } catch (error) {
        console.error('Error fetching similar posts:', error);
      }
    };

    fetchPost();
    fetchMorePosts();
    fetchSimilarPosts();
  }, [id]);

  const handleLike = () => {
    setLikes(liked ? likes - 1 : likes + 1);
    setLiked(!liked);
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      setComments([...comments, { user: 'You', text: newComment }]);
      setNewComment('');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Post link copied to clipboard!');
  };

  if (loading) return <p className="text-center">Loading post...</p>;
  if (error) return <p className="text-center text-danger">{error}</p>;

  return (
    <div className="container my-4">
      <div className="row">
        {/* Main Post Section */}
        <div className="col-lg-8">
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
              <button
                className={`btn ${liked ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={handleLike}
              >
                <i className={`fas ${liked ? 'fa-thumbs-up' : 'fa-thumbs-up'}`}></i> {likes} Likes
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
                {comments.map((comment, index) => (
                  <div key={index} className="list-group-item border-0">
                    <strong>{comment.user}:</strong> {comment.text}
                  </div>
                ))}
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
            <h5 className="fw-bold text-primary mb-3">
              More from {post?.authorInfo?.firstName}
            </h5>
            <ul className="list-unstyled">
              {morePosts.length > 0 ? (
                morePosts.map((p) => (
                  <li key={p._id} className="mb-2">
                    <a href={`/post/${p._id}`} className="text-decoration-none text-dark">
                      {p.content.text}
                    </a>
                  </li>
                ))
              ) : (
                <p>No other posts found.</p>
              )}
            </ul>
          </div>

          {/* Similar Posts */}
          <div className="card shadow-sm border-0 p-4">
            <h5 className="fw-bold text-primary mb-3">Similar Posts</h5>
            <ul className="list-unstyled">
              {similarPosts.length > 0 ? (
                similarPosts.map((p) => (
                  <li key={p._id} className="mb-2">
                    <a href={`/post/${p._id}`} className="text-decoration-none text-dark">
                      {p.content.text}
                    </a>
                  </li>
                ))
              ) : (
                <p>No similar posts found.</p>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
