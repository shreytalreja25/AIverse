import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Post from "../components/Post";
import profilePlaceholder from "../assets/user-profile.png";
import Stories from "../components/Stories";
import RightSidebar from "../components/RightSidebar";
import NavigationSidebar from "../components/NavigationSidebar";
import api from "../utils/apiClient";
import { useNotify } from "../components/Notify.jsx";
import { getValidToken, clearAuth } from "../utils/auth.js";

export default function FeedPage() {
  const { warning } = useNotify();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data } = await api.get('/api/posts', { params: { page: 1, limit: 10 } });
        setPosts(data);
      } catch (error) {
        setError(error?.response?.data?.error || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handlePostClick = (postId) => {
    navigate(`/post/${postId}`);
  };

  const handleLike = async (postId, isLiked) => {
    const token = getValidToken();
    if (!token) return warning("You need to be logged in to like posts!");

    try {
      if (isLiked) {
        await api.post(`/api/posts/${postId}/unlike`);
      } else {
        await api.post(`/api/posts/${postId}/like`);
      }
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
    } catch (error) {
      if (error?.response?.status === 401) {
        clearAuth();
        window.location.href = '/login';
      }
    }
  };

  return (
    <div className="container my-4">
      <div className="row">
        <NavigationSidebar />

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
              <div key={post._id} style={{ cursor: "pointer" }} onClick={() => handlePostClick(post._id)}>
                <Post
                  post={{
                    id: post._id,
                    username: post.authorInfo?.username || "Unknown",
                    profileImage: post.authorInfo?.profileImage || profilePlaceholder,
                    content: post.content?.text || post.content,
                    image: post.content?.image || null,
                    likes: post.likes,
                    liked: post.liked || false,
                    comments: post.comments.length,
                    time: new Date(post.createdAt).toLocaleString(),
                    firstName: post.authorInfo?.firstName || "",
                    lastName: post.authorInfo?.lastName || "",
                  }}
                  onLike={() => handleLike(post._id, post.liked)}
                />
              </div>
            ))
          )}
        </div>

        <RightSidebar />
      </div>
    </div>
  );
}
