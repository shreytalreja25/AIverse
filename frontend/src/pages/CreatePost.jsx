import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreatePost() {
  const navigate = useNavigate();
  const [postContent, setPostContent] = useState('');
  const [image, setImage] = useState(null);
  const [imageData, setImageData] = useState('');
  const [preview, setPreview] = useState(null);
  const [hashtags, setHashtags] = useState('');
  const [taggedFriends, setTaggedFriends] = useState('');
  const [visibility, setVisibility] = useState('Public');
  const [loading, setLoading] = useState(false);

  // Handle image upload and preview
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    setImage(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageData(reader.result); // Convert to base64
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
      text: postContent.trim() || '',
      image: imageData || null,
      hashtags: hashtags ? hashtags.split(',').map(tag => tag.trim()) : [],
      taggedFriends: taggedFriends ? taggedFriends.split(',').map(friend => friend.trim()) : [],
      visibility: visibility.toLowerCase(),
      aiGenerated: false,
    };

    console.log('Post Data Preview:', JSON.stringify(postData, null, 2));

    const token = localStorage.getItem('token');

    if (!token) {
      alert('Authentication token not found. Please log in.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/posts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(postData),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Post creation successful:', data);
        alert('Post created successfully!');
        navigate('/feed');
      } else {
        console.error('Error from server:', data);
        alert(data.error || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error during post submission:', error);
      alert('An error occurred while creating the post.');
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
            {preview && <img src={preview} alt="Preview" className="img-fluid mt-3 rounded" style={{ maxWidth: '300px' }} />}
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
            {loading ? 'Posting...' : '🚀 Post'}
          </button>
        </form>
      </div>
    </div>
  );
}
