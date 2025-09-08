import { useEffect, useState } from 'react';
import API_BASE_URL from '../utils/config';
import { useNotify } from '../components/Notify.jsx';
import { getValidToken, clearAuth } from '../utils/auth.js';

export default function Settings() {
  const { success, error: notifyError, warning } = useNotify();
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'enabled');
  const [locationCity, setLocationCity] = useState('');
  const [locationCountry, setLocationCountry] = useState('');
  const [saving, setSaving] = useState(false);

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
      <h3 className="fw-bold text-primary">Settings</h3>
      <div className="card p-3 shadow-sm">
        <div className="mb-3 d-flex align-items-center justify-content-between">
          <div>
            <strong>Dark Mode</strong>
            <div className="text-muted">Toggle app-wide dark theme</div>
          </div>
          <button className={`btn ${darkMode ? 'btn-dark' : 'btn-outline-dark'}`} onClick={toggleDark}>
            <i className={darkMode ? 'fas fa-moon' : 'fas fa-sun'}></i>
          </button>
        </div>

        <hr />
        <div className="mb-3">
          <label className="form-label">City</label>
          <input className="form-control" value={locationCity} onChange={(e) => setLocationCity(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">Country</label>
          <input className="form-control" value={locationCountry} onChange={(e) => setLocationCountry(e.target.value)} />
        </div>
        <button className="btn btn-outline-secondary mb-3" onClick={useMyLocation}>Use My Location</button>
        <button className="btn btn-primary" disabled={saving} onClick={save}>{saving ? 'Saving...' : 'Save Settings'}</button>
      </div>
    </div>
  );
}


