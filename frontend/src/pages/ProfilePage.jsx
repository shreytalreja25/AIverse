import { useState, useEffect } from 'react';
import profilePlaceholder from '../assets/user-profile.png';

export default function ProfilePage() {
  const placeholderPosts = [
    {
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSvkUFmp5jSF-DhrD5102bzHU7RbidetfqYfA&s',
      content: 'AI is revolutionizing the future of technology!',
    },
    {
      image: 'https://timescale.ghost.io/blog/content/images/2024/07/A-Brief-History-of-AI_cover.jpg',
      content: 'A deep dive into the history of Artificial Intelligence!',
    },
    {
      image: 'https://cdn.britannica.com/47/246247-050-F1021DE9/AI-text-to-image-photo-robot-with-computer.jpg',
      content: 'The future of AI-powered automation is here.',
    },
  ];

  const [user, setUser] = useState({
    username: 'shreytalreja',
    email: 'user@example.com',
    firstName: 'Shrey',
    lastName: 'Talreja',
    profileImage: profilePlaceholder,
    followers: 245,
    following: 180,
    posts: placeholderPosts,
    bio: 'Passionate about AI and technology!',
    socialLinks: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: '',
    },
  });

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Load user data from localStorage if available
    const storedUser = JSON.parse(localStorage.getItem('user'));

    if (storedUser) {
      setUser({
        ...storedUser,
        profileImage: storedUser.profileImage || profilePlaceholder,
        followers: storedUser.followers?.length || 0,
        following: storedUser.following?.length || 0,
        posts: storedUser.posts?.length ? storedUser.posts : placeholderPosts,
        socialLinks: storedUser.socialLinks || {
          facebook: '',
          twitter: '',
          instagram: '',
          linkedin: '',
        },
      });
    }
  }, []);

  const handleChange = (e) => {
    setUser({
      ...user,
      [e.target.name]: e.target.value,
    });
  };

  const handleSocialChange = (e) => {
    setUser({
      ...user,
      socialLinks: { ...user.socialLinks, [e.target.name]: e.target.value },
    });
  };

  const handleUpdate = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(user),
      });

      const result = await response.json();
      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(user));
        setIsEditing(false);
        alert('Profile updated successfully');
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Failed to update profile');
    }
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUser({
        ...user,
        profileImage: URL.createObjectURL(file),
      });
    }
  };

  return (
    <div className="container my-5">
      <div className="card p-4 shadow-lg border-0 bg-dark text-light">
        {/* Profile Header Section */}
        <div className="row align-items-center">
          <div className="col-md-4 text-center">
            <img
              src={user.profileImage}
              alt="Profile"
              className="rounded-circle border border-3 border-primary"
              width="150"
              height="150"
            />
            {isEditing && (
              <input
                type="file"
                className="form-control mt-3"
                accept="image/*"
                onChange={handleProfileImageChange}
              />
            )}
          </div>
          <div className="col-md-8 text-center text-md-start">
            <h2 className="fw-bold text-primary">{user.username}</h2>
            <p className="text-light">{user.bio || 'No bio available'}</p>
            <div className="d-flex justify-content-center justify-content-md-start">
              <div className="me-4 text-center">
                <h5 className="fw-bold text-primary">{user.posts.length}</h5>
                <p className="text-light">Posts</p>
              </div>
              <div className="me-4 text-center">
                <h5 className="fw-bold text-primary">{user.followers}</h5>
                <p className="text-light">Followers</p>
              </div>
              <div className="text-center">
                <h5 className="fw-bold text-primary">{user.following}</h5>
                <p className="text-light">Following</p>
              </div>
            </div>
            {!isEditing && (
              <button className="btn btn-primary mt-3" onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Editable Form Section */}
        {isEditing && (
          <div className="mt-4">
            <h4 className="fw-bold text-primary">Edit Profile</h4>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  className="form-control"
                  value={user.firstName}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  className="form-control"
                  value={user.lastName}
                  onChange={handleChange}
                />
              </div>
              <div className="col-12 mb-3">
                <label className="form-label">Bio</label>
                <textarea
                  name="bio"
                  className="form-control"
                  value={user.bio}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>

            <div className="text-center">
              <button className="btn btn-success me-3" onClick={handleUpdate}>
                Save Changes
              </button>
              <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* User's Posts Section */}
        <div className="mt-5">
          <h4 className="fw-bold text-primary mb-4">User Posts</h4>
          <div className="row row-cols-1 row-cols-md-3 g-4">
            {user.posts.length > 0 ? (
              user.posts.map((post, index) => (
                <div className="col" key={index}>
                  <div className="card shadow-sm bg-secondary text-light border-0 h-100">
                    <img src={post.image} className="card-img-top rounded" alt="Post" />
                    <div className="card-body">
                      <p>{post.content}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-light text-center">No posts yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
