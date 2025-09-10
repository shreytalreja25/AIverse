import { useState, useRef, useEffect } from "react";
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
  const [isDragOver, setIsDragOver] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [postContent]);

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    
    // Validate the image file
    const validation = validateImageFile(file, 10); // 10MB limit
    if (!validation.isValid) {
      notifyError(validation.error);
      return;
    }
    
    setImage(file);
    processImage(file);
  };

  const processImage = async (file) => {
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

  // Handle image upload and preview
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  // Remove image
  const removeImage = () => {
    setImage(null);
    setImageData("");
    setPreview(null);
    setImageSize(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Get character count color
  const getCharCountColor = () => {
    const length = postContent.length;
    if (length > 2000) return "text-danger";
    if (length > 1500) return "text-warning";
    return "text-muted";
  };

  // Format hashtags
  const formatHashtags = (text) => {
    return text.split(',').map(tag => {
      const trimmed = tag.trim();
      return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
    }).join(', ');
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
    <div className="create-post-container" style={{ minHeight: '100vh', backgroundColor: '#0a0a0a' }}>
      {/* Mobile Header */}
      <div className="d-flex d-md-none align-items-center justify-content-between p-3 border-bottom border-secondary" style={{ backgroundColor: '#1a1a1a' }}>
        <button 
          className="btn btn-link text-light p-0"
          onClick={() => navigate(-1)}
        >
          <i className="fas fa-arrow-left fs-4"></i>
        </button>
        <h5 className="text-light mb-0 fw-bold">Create Post</h5>
        <button 
          className="btn btn-link text-primary p-0"
          onClick={handleSubmit}
          disabled={loading || !postContent.trim()}
        >
          {loading ? (
            <div className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          ) : (
            <span className="fw-bold">Share</span>
          )}
        </button>
      </div>

      {/* Desktop Header */}
      <div className="d-none d-md-block text-center py-4">
        <h2 className="text-light fw-bold">
          <i className="fas fa-plus-circle text-primary me-2"></i>
          Create New Post
        </h2>
      </div>

      <div className="container-fluid px-0 px-md-3">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <form onSubmit={handleSubmit}>
              {/* Main Content Area */}
              <div className="bg-dark rounded-3 p-3 mb-3" style={{ minHeight: '200px' }}>
                {/* User Info */}
                <div className="d-flex align-items-center mb-3">
                  <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                    <i className="fas fa-user text-white"></i>
                  </div>
                  <div>
                    <div className="text-light fw-bold">You</div>
                    <div className="text-muted small">
                      <i className="fas fa-globe me-1"></i>
                      {visibility}
                    </div>
                  </div>
                </div>

                {/* Text Input */}
                <div className="mb-3">
                  <textarea
                    ref={textareaRef}
                    className="form-control bg-transparent text-light border-0 fs-5"
                    placeholder="What's on your mind?"
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    style={{ 
                      resize: 'none', 
                      minHeight: '120px',
                      fontSize: '18px',
                      lineHeight: '1.4'
                    }}
                    required
                  />
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <small className={`${getCharCountColor()}`}>
                      {postContent.length}/2000
                    </small>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                      >
                        <i className="fas fa-cog me-1"></i>
                        Options
                      </button>
                    </div>
                  </div>
                </div>

                {/* Image Preview */}
                {preview && (
                  <div className="position-relative mb-3">
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="img-fluid rounded-3 w-100" 
                      style={{ maxHeight: '400px', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2 rounded-circle"
                      onClick={removeImage}
                      style={{ width: '32px', height: '32px' }}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                    {imageSize && (
                      <div className="position-absolute bottom-0 start-0 m-2">
                        <span className="badge bg-dark text-light">
                          {imageSize.compressed}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Drag & Drop Area */}
                {!preview && (
                  <div
                    className={`border-2 border-dashed rounded-3 p-4 text-center ${
                      isDragOver ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{ 
                      borderStyle: 'dashed',
                      minHeight: '120px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <i className="fas fa-camera text-muted mb-2" style={{ fontSize: '2rem' }}></i>
                    <p className="text-muted mb-2">
                      {isDragOver ? 'Drop your image here' : 'Tap to add a photo'}
                    </p>
                    <small className="text-muted">or drag and drop</small>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="d-none"
                    />
                  </div>
                )}

                {/* Quick Actions */}
                <div className="d-flex gap-2 mt-3">
                  <button
                    type="button"
                    className="btn btn-outline-light btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <i className="fas fa-image me-1"></i>
                    Photo
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-light btn-sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    <i className="fas fa-hashtag me-1"></i>
                    Hashtags
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-light btn-sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    <i className="fas fa-users me-1"></i>
                    Tag Friends
                  </button>
                </div>
              </div>

              {/* Advanced Options */}
              {showAdvanced && (
                <div className="bg-dark rounded-3 p-3 mb-3">
                  <h6 className="text-light mb-3">
                    <i className="fas fa-cog me-2"></i>
                    Advanced Options
                  </h6>
                  
                  {/* Hashtags */}
                  <div className="mb-3">
                    <label className="form-label text-light small">
                      <i className="fas fa-hashtag me-1"></i>
                      Hashtags
                    </label>
                    <input
                      type="text"
                      className="form-control bg-dark text-light border-secondary"
                      placeholder="AI, Technology, Innovation"
                      value={hashtags}
                      onChange={(e) => setHashtags(e.target.value)}
                    />
                    <small className="text-muted">
                      Separate with commas. We'll add # automatically.
                    </small>
                  </div>

                  {/* Tag Friends */}
                  <div className="mb-3">
                    <label className="form-label text-light small">
                      <i className="fas fa-user-friends me-1"></i>
                      Tag Friends
                    </label>
                    <input
                      type="text"
                      className="form-control bg-dark text-light border-secondary"
                      placeholder="john_doe, jane_doe"
                      value={taggedFriends}
                      onChange={(e) => setTaggedFriends(e.target.value)}
                    />
                    <small className="text-muted">
                      Separate usernames with commas. We'll add @ automatically.
                    </small>
                  </div>

                  {/* Visibility */}
                  <div className="mb-3">
                    <label className="form-label text-light small">
                      <i className="fas fa-eye me-1"></i>
                      Who can see this?
                    </label>
                    <select 
                      className="form-select bg-dark text-light border-secondary" 
                      value={visibility} 
                      onChange={(e) => setVisibility(e.target.value)}
                    >
                      <option value="Public">
                        <i className="fas fa-globe me-1"></i>
                        Public - Anyone can see this
                      </option>
                      <option value="Private">
                        <i className="fas fa-lock me-1"></i>
                        Private - Only you can see this
                      </option>
                    </select>
                  </div>
                </div>
              )}

              {/* Desktop Submit Button */}
              <div className="d-none d-md-block">
                <button 
                  type="submit" 
                  className="btn btn-primary w-100 py-3 fs-5 fw-bold"
                  disabled={loading || !postContent.trim()}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Posting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane me-2"></i>
                      Share Post
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Spacer */}
      <div className="d-md-none" style={{ height: '80px' }}></div>
    </div>
  );
}
