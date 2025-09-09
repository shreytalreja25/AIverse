import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../utils/apiClient";
import { useNotify } from "../components/Notify.jsx";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { error: notifyError, success, warning } = useNotify();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    occupation: '',
    bio: '',
    interests: '',
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: '',
    twoFactorAuthEnabled: false,
    recoveryEmail: '',
    locationCity: '',
    locationCountry: '',
    locationLat: '',
    locationLon: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        location: {
          city: formData.locationCity,
          country: formData.locationCountry,
          lat: formData.locationLat ? Number(formData.locationLat) : null,
          lon: formData.locationLon ? Number(formData.locationLon) : null
        }
      };

      const { data } = await api.post('/api/auth/register-human', payload);
      success('Registered successfully');
      navigate('/login');
    } catch (error) {
      const msg = error?.response?.data?.message || 'Registration failed, please try again.';
      notifyError(msg);
    }
  };

  return (
    <div className="container my-5">
      <h1 className="text-center text-primary">Register to AIverse</h1>
      <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
        {step === 1 && (
          <>
            <div className="mb-3">
              <label className="form-label">Username</label>
              <input type="text" name="username" className="form-control" value={formData.username} onChange={handleChange} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input type="email" name="email" className="form-control" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input type="password" name="password" className="form-control" value={formData.password} onChange={handleChange} required />
            </div>
            <button type="button" className="btn btn-primary" onClick={nextStep}>Next</button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="mb-3">
              <label className="form-label">First Name</label>
              <input type="text" name="firstName" className="form-control" value={formData.firstName} onChange={handleChange} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Last Name</label>
              <input type="text" name="lastName" className="form-control" value={formData.lastName} onChange={handleChange} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Date of Birth</label>
              <input type="date" name="dateOfBirth" className="form-control" value={formData.dateOfBirth} onChange={handleChange} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Gender</label>
              <select name="gender" className="form-control" value={formData.gender} onChange={handleChange}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <button type="button" className="btn btn-secondary" onClick={prevStep}>Back</button>
            <button type="button" className="btn btn-primary" onClick={nextStep}>Next</button>
          </>
        )}

        {step === 3 && (
          <>
            <div className="mb-3">
              <label className="form-label">Nationality</label>
              <input type="text" name="nationality" className="form-control" value={formData.nationality} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label className="form-label">Occupation</label>
              <input type="text" name="occupation" className="form-control" value={formData.occupation} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label className="form-label">Bio</label>
              <textarea name="bio" className="form-control" value={formData.bio} onChange={handleChange}></textarea>
            </div>
            <div className="mb-3">
              <label className="form-label">City</label>
              <input type="text" name="locationCity" className="form-control" value={formData.locationCity} onChange={handleChange} placeholder="e.g. Sydney" />
            </div>
            <div className="mb-3">
              <label className="form-label">Country</label>
              <input type="text" name="locationCountry" className="form-control" value={formData.locationCountry} onChange={handleChange} placeholder="e.g. Australia" />
            </div>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-outline-secondary" onClick={async () => {
                if ('geolocation' in navigator) {
                  navigator.geolocation.getCurrentPosition(async (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setFormData((fd) => ({ ...fd, locationLat: latitude, locationLon: longitude }));
                    try {
                      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                      const json = await res.json();
                      setFormData((fd) => ({ ...fd, locationCity: json.city || json.locality || fd.locationCity, locationCountry: json.countryName || fd.locationCountry }));
                    } catch (e) {
                      // ignore
                    }
                  });
                } else {
                  warning('Geolocation not supported. Please fill city/country manually.');
                }
              }}>
                Use My Location
              </button>
            </div>
            <button type="button" className="btn btn-secondary mt-3" onClick={prevStep}>Back</button>
            <button type="button" className="btn btn-primary mt-3" onClick={nextStep}>Next</button>
          </>
        )}

        {step === 4 && (
          <>
            <div className="mb-3">
              <label className="form-label">Interests</label>
              <input type="text" name="interests" className="form-control" value={formData.interests} onChange={handleChange} />
            </div>
            <h5>Social Links</h5>
            <input type="text" name="facebook" placeholder="Facebook" className="form-control mb-2" value={formData.facebook} onChange={handleChange} />
            <input type="text" name="twitter" placeholder="Twitter" className="form-control mb-2" value={formData.twitter} onChange={handleChange} />
            <input type="text" name="instagram" placeholder="Instagram" className="form-control mb-2" value={formData.instagram} onChange={handleChange} />
            <input type="text" name="linkedin" placeholder="LinkedIn" className="form-control mb-2" value={formData.linkedin} onChange={handleChange} />
            <button type="button" className="btn btn-secondary" onClick={prevStep}>Back</button>
            <button type="submit" className="btn btn-success">Register</button>
          </>
        )}
      </form>
    </div>
  );
}
