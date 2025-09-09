import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Post from "../components/Post";
import profilePlaceholder from "../assets/user-profile.png";
import Stories from "../components/Stories";
import RightSidebar from "../components/RightSidebar";
import NavigationSidebar from "../components/NavigationSidebar";
import { postsAPI } from "../services/apiService";
import { useNotify } from "../components/Notify.jsx";
import { getValidToken, clearAuth } from "../utils/auth.js";
import { useDataFetch } from "../hooks/usePageRefresh";

export default function FeedPage() {
  const { warning } = useNotify();
  const navigate = useNavigate();

  const fetchPosts = async () => {
    try {
      const { data } = await postsAPI.getPosts(1, 10);
      return data;
    } catch (error) {
      throw new Error(error?.response?.data?.error || error.message);
    }
  };

  const { data: posts, loading, error, refresh } = useDataFetch(fetchPosts);

  const handlePostClick = (postId) => {
    navigate(`/post/${postId}`);
  };

  const handleLike = async (postId, isLiked) => {
    const token = getValidToken();
    if (!token) return warning("You need to be logged in to like posts!");

    try {
      if (isLiked) {
        await postsAPI.unlikePost(postId);
      } else {
        await postsAPI.likePost(postId);
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
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold text-primary mb-0">Your Feed</h2>
            <button 
              className="btn btn-outline-primary btn-sm"
              onClick={refresh}
              disabled={loading}
            >
              <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
              {loading ? ' Refreshing...' : ' Refresh'}
            </button>
          </div>

          {loading ? (
            <p className="text-center">Loading posts...</p>
          ) : error ? (
            <p className="text-center text-danger">{error}</p>
          ) : posts.length === 0 ? (
            <p className="text-center">No posts available.</p>
          ) : (
            posts.map((post) => {
              // Defensive programming - ensure post has required properties
              if (!post || !post._id) {
                console.warn('Invalid post data:', post);
                return null;
              }
              
              return (
                <div key={post._id} style={{ cursor: "pointer" }} onClick={() => handlePostClick(post._id)}>
                  <Post
                    post={{
                      id: post._id,
                      _id: post._id, // Include both for compatibility
                      username: post.authorInfo?.username || "Unknown",
                      profileImage: post.authorInfo?.profileImage || profilePlaceholder,
                      content: post.content?.text || post.content,
                      image: post.content?.image || null,
                      likes: post.likes || [],
                      liked: post.liked || false,
                      comments: post.comments || [],
                      time: new Date(post.createdAt).toLocaleString(),
                      firstName: post.authorInfo?.firstName || "",
                      lastName: post.authorInfo?.lastName || "",
                    }}
                    onLike={() => handleLike(post._id, post.liked)}
                  />
                </div>
              );
            })
          )}
        </div>

        <RightSidebar />
      </div>
    </div>
  );
}
