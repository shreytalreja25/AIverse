import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../utils/config"; // Import dynamic backend URL
import { useNotify } from "../components/Notify.jsx";
import { getValidToken, clearAuth } from "../utils/auth.js";
import { compressImage, validateImageFile, formatFileSize, getBase64Size } from "../utils/imageUtils.js";

export default function CreatePost() {
  const navigate = useNavigate();
  const { error: notifyError, success, warning } = useNotify();
  const [postContent, setPostContent] = useState("");
  const [image, setImage] = useState(null);
  const [imageData, setImageData] = useState("");
  const [preview, setPreview] = useState(null);
  const [hashtags, setHashtags] = useState("");
  const [taggedFriends, setTaggedFriends] = useState("");
  const [visibility, setVisibility] = useState("Public");
  const [loading, setLoading] = useState(false);
  const [imageSize, setImageSize] = useState(null);


  // Handle image upload and preview
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Validate the image file
    const validation = validateImageFile(file, 10); // 10MB limit
    if (!validation.isValid) {
      notifyError(validation.error);
      return;
    }
    
    setImage(file);

    try {
      // Compress the image before converting to base64
      const compressedDataUrl = await compressImage(file);
      setImageData(compressedDataUrl);
      setPreview(compressedDataUrl);
      
      // Log compression info
      const originalSize = formatFileSize(file.size);
      const compressedSize = formatFileSize(getBase64Size(compressedDataUrl));
      console.log(`Image compressed: ${originalSize} → ${compressedSize}`);
      setImageSize({ original: originalSize, compressed: compressedSize });
    } catch (error) {
      console.error('Error compressing image:', error);
      // Fallback to original method if compression fails
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageData(reader.result);
      };
      reader.readAsDataURL(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // Handle post submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const postData = {
      text: postContent.trim() || "",
      image: imageData || null,
      hashtags: hashtags ? hashtags.split(",").map((tag) => tag.trim()) : [],
      taggedFriends: taggedFriends ? taggedFriends.split(",").map((friend) => friend.trim()) : [],
      visibility: visibility.toLowerCase(),
      aiGenerated: false,
    };

    console.log("Post Data Preview:", JSON.stringify(postData, null, 2));

    const token = getValidToken();

    if (!token) {
      warning("Authentication token not found. Please log in.");
      setLoading(false);
      return;
    }

    try {
      const url = `${API_BASE_URL}/api/posts/create`;
      console.log('[CreatePost] Creating post via:', url);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(postData),
      });

      const data = await response.json();
      console.log('[CreatePost] Response status:', response.status);

      if (response.ok) {
        console.log("Post creation successful:", data);
        success("Post created successfully!");
        navigate("/feed");
      } else {
        console.error("Error from server:", data);
        if (response.status === 401) {
          notifyError(data.message || "Session expired. Please log in again.");
          clearAuth();
          navigate('/login');
        } else {
          notifyError(data.error || "Failed to create post");
        }
      }
    } catch (error) {
      console.error("Error during post submission:", error);
      notifyError("An error occurred while creating the post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container my-5">
      <h2 className="text-center fw-bold text-primary">
        <i className="fas fa-edit"></i> Create a New Post
      </h2>
      <div className="card p-4 shadow-sm">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">
              <i className="fas fa-pen"></i> Post Content
            </label>
            <textarea
              className="form-control"
              rows="4"
              placeholder="📝 What's on your mind?"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              required
            ></textarea>
          </div>

          <div className="mb-3">
            <label className="form-label">
              <i className="fas fa-image"></i> Upload Image
            </label>
            <input type="file" className="form-control" accept="image/*" onChange={handleImageUpload} />
            {preview && (
              <div className="mt-3">
                <img src={preview} alt="Preview" className="img-fluid rounded" style={{ maxWidth: "300px" }} />
                {imageSize && (
                  <small className="text-muted d-block mt-2">
                    📏 Compressed: {imageSize.original}MB → {imageSize.compressed}MB
                  </small>
                )}
              </div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label">
              <i className="fas fa-hashtag"></i> Hashtags (comma-separated)
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. #AI, #Technology, #Innovation"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">
              <i className="fas fa-user-friends"></i> Tag Friends (comma-separated)
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. @john_doe, @jane_doe"
              value={taggedFriends}
              onChange={(e) => setTaggedFriends(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">
              <i className="fas fa-eye"></i> Post Visibility
            </label>
            <select className="form-select" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
              <option value="Public">🌍 Public</option>
              <option value="Private">🔒 Private</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? "Posting..." : "🚀 Post"}
          </button>
        </form>
      </div>
    </div>
  );
}
