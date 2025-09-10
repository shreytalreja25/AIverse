import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import profilePlaceholder from "../assets/user-profile.png";
import { usersAPI } from "../services/apiService";
import { useNotify } from "../components/Notify.jsx";
import { getValidToken, clearAuth } from "../utils/auth.js";

export default function EditProfilePage() {
  const { error: notifyError, warning, success } = useNotify();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    bio: '',
    email: '',
    location: {
      city: '',
      country: ''
    },
    occupation: '',
    interests: '',
    socialLinks: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: ''
    }
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const { data } = await usersAPI.getProfile(id);
        setFormData({
          username: data.username || '',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          bio: data.bio || '',
          email: data.email || '',
          location: {
            city: data.location?.city || '',
            country: data.location?.country || ''
          },
          occupation: data.occupation || '',
          interests: data.interests || '',
          socialLinks: {
            facebook: data.socialLinks?.facebook || '',
            twitter: data.socialLinks?.twitter || '',
            instagram: data.socialLinks?.instagram || '',
            linkedin: data.socialLinks?.linkedin || ''
          }
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
        notifyError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [id, notifyError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = getValidToken();
      if (!token) {
        warning("Please log in to edit your profile.");
        return;
      }

      // Update profile via API
      await usersAPI.updateProfile(id, formData);
      success("Profile updated successfully!");
      navigate(`/profile/${id}`);
    } catch (error) {
      if (error?.response?.status === 401) {
        notifyError('Session expired. Please log in again.');
        clearAuth();
        window.location.href = '/login';
      } else {
        notifyError(error?.response?.data?.message || "Failed to update profile");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/profile/${id}`);
  };

  if (loading) {
    return (
      <div className="container my-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-light">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container my-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold text-primary mb-0">Edit Profile</h3>
        <button
          className="btn btn-outline-secondary"
          onClick={handleCancel}
        >
          <i className="fas fa-arrow-left me-2"></i>
          Back to Profile
        </button>
      </div>

      <div className="card p-4 shadow-lg border-0 bg-dark text-light">
        <form onSubmit={handleSubmit}>
          <div className="row">
            {/* Profile Picture Section */}
            <div className="col-12 text-center mb-4">
              <img
                src={profilePlaceholder}
                alt="Profile"
                className="rounded-circle border border-3 border-primary mb-3"
                width="120"
                height="120"
              />
              <div>
                <button type="button" className="btn btn-outline-primary btn-sm" disabled>
                  <i className="fas fa-camera me-2"></i>
                  Change Photo
                </button>
                <p className="text-muted small mt-2">Profile photo editing coming soon!</p>
              </div>
            </div>

            {/* Basic Information */}
            <div className="col-md-6 mb-3">
              <label htmlFor="username" className="form-label">Username *</label>
              <input
                type="text"
                className="form-control bg-dark text-light border-secondary"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="email" className="form-label">Email *</label>
              <input
                type="email"
                className="form-control bg-dark text-light border-secondary"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="firstName" className="form-label">First Name</label>
              <input
                type="text"
                className="form-control bg-dark text-light border-secondary"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="lastName" className="form-label">Last Name</label>
              <input
                type="text"
                className="form-control bg-dark text-light border-secondary"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>

            <div className="col-12 mb-3">
              <label htmlFor="bio" className="form-label">Bio</label>
              <textarea
                className="form-control bg-dark text-light border-secondary"
                id="bio"
                name="bio"
                rows="3"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself..."
              />
            </div>

            {/* Location */}
            <div className="col-md-6 mb-3">
              <label htmlFor="location.city" className="form-label">City</label>
              <input
                type="text"
                className="form-control bg-dark text-light border-secondary"
                id="location.city"
                name="location.city"
                value={formData.location.city}
                onChange={handleChange}
                placeholder="Your city"
              />
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="location.country" className="form-label">Country</label>
              <input
                type="text"
                className="form-control bg-dark text-light border-secondary"
                id="location.country"
                name="location.country"
                value={formData.location.country}
                onChange={handleChange}
                placeholder="Your country"
              />
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="occupation" className="form-label">Occupation</label>
              <input
                type="text"
                className="form-control bg-dark text-light border-secondary"
                id="occupation"
                name="occupation"
                value={formData.occupation}
                onChange={handleChange}
                placeholder="Your job or profession"
              />
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="interests" className="form-label">Interests</label>
              <input
                type="text"
                className="form-control bg-dark text-light border-secondary"
                id="interests"
                name="interests"
                value={formData.interests}
                onChange={handleChange}
                placeholder="Your hobbies and interests"
              />
            </div>

            {/* Social Links */}
            <div className="col-12">
              <h5 className="text-primary mb-3">Social Links</h5>
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="socialLinks.facebook" className="form-label">
                <i className="fab fa-facebook text-primary me-2"></i>Facebook
              </label>
              <input
                type="url"
                className="form-control bg-dark text-light border-secondary"
                id="socialLinks.facebook"
                name="socialLinks.facebook"
                value={formData.socialLinks.facebook}
                onChange={handleChange}
                placeholder="https://facebook.com/yourusername"
              />
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="socialLinks.twitter" className="form-label">
                <i className="fab fa-twitter text-info me-2"></i>Twitter
              </label>
              <input
                type="url"
                className="form-control bg-dark text-light border-secondary"
                id="socialLinks.twitter"
                name="socialLinks.twitter"
                value={formData.socialLinks.twitter}
                onChange={handleChange}
                placeholder="https://twitter.com/yourusername"
              />
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="socialLinks.instagram" className="form-label">
                <i className="fab fa-instagram text-danger me-2"></i>Instagram
              </label>
              <input
                type="url"
                className="form-control bg-dark text-light border-secondary"
                id="socialLinks.instagram"
                name="socialLinks.instagram"
                value={formData.socialLinks.instagram}
                onChange={handleChange}
                placeholder="https://instagram.com/yourusername"
              />
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="socialLinks.linkedin" className="form-label">
                <i className="fab fa-linkedin text-primary me-2"></i>LinkedIn
              </label>
              <input
                type="url"
                className="form-control bg-dark text-light border-secondary"
                id="socialLinks.linkedin"
                name="socialLinks.linkedin"
                value={formData.socialLinks.linkedin}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/yourusername"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="d-flex gap-2 mt-4 pt-3 border-top border-secondary">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save me-2"></i>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
