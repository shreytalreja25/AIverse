import { useEffect, useState } from 'react';
import API_BASE_URL from '../utils/config';
import { useNotify } from '../components/Notify.jsx';
import { getValidToken, clearAuth } from '../utils/auth.js';
import StatusDashboard from '../components/StatusDashboard';

export default function Settings() {
  const { success, error: notifyError, warning } = useNotify();
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'enabled');
  const [locationCity, setLocationCity] = useState('');
  const [locationCountry, setLocationCountry] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) return;
      const url = `${API_BASE_URL}/api/profile/${user.id}`;
      console.log('[Settings] Fetching profile from:', url);
      fetch(url)
        .then((r) => r.json())
        .then((data) => {
          if (data?.location) {
            setLocationCity(data.location.city || '');
            setLocationCountry(data.location.country || '');
          }
        })
        .catch(() => {});
    } catch (_) {}
  }, []);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.body.classList.toggle('dark-theme', next);
    localStorage.setItem('darkMode', next ? 'enabled' : 'disabled');
  };

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) return warning('Geolocation not supported');
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
        const json = await res.json();
        setLocationCity(json.city || json.locality || '');
        setLocationCountry(json.countryName || '');
      } catch (_) {}
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = getValidToken();
      if (!token) {
        notifyError('Session expired. Please log in again.');
        clearAuth();
        return;
      }
      const res = await fetch(`${API_BASE_URL}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          location: { city: locationCity, country: locationCountry }
        })
      });
      if (res.status === 401) {
        notifyError('Session expired. Please log in again.');
        clearAuth();
      } else {
        success('Settings saved');
      }
    } catch (e) {
      notifyError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container my-4">
      <h3 className="fw-bold text-primary mb-4">Settings</h3>
      
      {/* Tab Navigation */}
      <ul className="nav nav-tabs mb-4" id="settingsTabs" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
            type="button"
          >
            <i className="fas fa-cog me-2"></i>
            General
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'status' ? 'active' : ''}`}
            onClick={() => setActiveTab('status')}
            type="button"
          >
            <i className="fas fa-chart-line me-2"></i>
            Status
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="tab-content">
        {/* General Settings Tab */}
        {activeTab === 'general' && (
          <div className="card p-4 shadow-sm bg-dark text-light">
            <h5 className="text-light mb-4">
              <i className="fas fa-cog text-primary me-2"></i>
              General Settings
            </h5>
            
            <div className="mb-4 d-flex align-items-center justify-content-between">
              <div>
                <strong className="text-light">Dark Mode</strong>
                <div className="text-muted">Toggle app-wide dark theme</div>
              </div>
              <button 
                className={`btn ${darkMode ? 'btn-primary' : 'btn-outline-primary'}`} 
                onClick={toggleDark}
              >
                <i className={darkMode ? 'fas fa-moon' : 'fas fa-sun'}></i>
                {darkMode ? ' Dark' : ' Light'}
              </button>
            </div>

            <hr className="border-secondary" />
            
            <h6 className="text-light mb-3">
              <i className="fas fa-map-marker-alt text-primary me-2"></i>
              Location Settings
            </h6>
            
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label text-light">City</label>
                <input 
                  className="form-control bg-dark text-light border-secondary" 
                  value={locationCity} 
                  onChange={(e) => setLocationCity(e.target.value)}
                  placeholder="Enter your city"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label text-light">Country</label>
                <input 
                  className="form-control bg-dark text-light border-secondary" 
                  value={locationCountry} 
                  onChange={(e) => setLocationCountry(e.target.value)}
                  placeholder="Enter your country"
                />
              </div>
            </div>
            
            <div className="d-flex gap-2 mb-4">
              <button 
                className="btn btn-outline-primary" 
                onClick={useMyLocation}
              >
                <i className="fas fa-location-arrow me-2"></i>
                Use My Location
              </button>
              <button 
                className="btn btn-primary" 
                disabled={saving} 
                onClick={save}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-2"></i>
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Status Dashboard Tab */}
        {activeTab === 'status' && (
          <StatusDashboard />
        )}
      </div>
    </div>
  );
}


