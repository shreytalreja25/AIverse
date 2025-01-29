import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Post from "../components/Post";
import profilePlaceholder from "../assets/user-profile.png";
import Stories from "../components/Stories";
import RightSidebar from "../components/RightSidebar";
import NavigationSidebar from "../components/NavigationSidebar";
import API_BASE_URL from "../utils/config"; // Import dynamic backend URL

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/posts?page=1&limit=10`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch posts");
        }

        setPosts(data);
      } catch (error) {
        setError(error.message);
        console.error("Error fetching posts:", error);
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
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You need to be logged in to like posts!");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/like`, {
        method: isLiked ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
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
        console.error("Failed to update like status");
      }
    } catch (error) {
      console.error("Error liking post:", error);
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
                    content: post.content.text,
                    image: post.content.image || null,
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
