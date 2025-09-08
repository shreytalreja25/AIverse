import { useEffect, useMemo, useState } from "react";
import API_BASE_URL from "../utils/config";
import { generateActivities } from "../services/activities/geminiClient";
import ActivitiesList from "../components/activities/ActivitiesList";
import ActivitiesMap from "../components/activities/ActivitiesMap";

export default function Activities() {
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [items, setItems] = useState([]);
  const [view, setView] = useState("list");
  const [loading, setLoading] = useState(false);

  // Load user's stored location
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) return;
      fetch(`${API_BASE_URL}/api/profile/${user.id}`)
        .then(r => r.json())
        .then(data => {
          if (data?.location) {
            setCity(data.location.city || "");
            setCountry(data.location.country || "");
          }
        }).catch(() => {});
    } catch {}
  }, []);

  const timeOfDay = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
  }, []);

  const fetchActivities = async ({ hint } = {}) => {
    if (!city && !country) return;
    setLoading(true);
    try {
      // Basic weather placeholders for now; can expand to call weather API later
      const weatherText = "clear";
      const tempC = 24;
      const list = await generateActivities({ city, country, weatherText, tempC, timeOfDay, hint });
      setItems(list);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ((city || country) && items.length === 0) fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, country]);

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) return alert("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude, longitude } = pos.coords;
      try {
        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
        const json = await res.json();
        setCity(json.city || json.locality || "");
        setCountry(json.countryName || "");
      } catch {}
    });
  };

  return (
    <div className="container my-4">
      <div className="d-flex flex-wrap align-items-end gap-2 mb-3">
        <div>
          <label className="form-label mb-1">City</label>
          <input className="form-control" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Sydney" />
        </div>
        <div>
          <label className="form-label mb-1">Country</label>
          <input className="form-control" value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g. Australia" />
        </div>
        <div className="ms-auto d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={useMyLocation}><i className="fas fa-location-arrow"></i> Use My Location</button>
          <button className="btn btn-primary" disabled={loading} onClick={() => fetchActivities()}>{loading ? "Generating..." : "Generate"}</button>
        </div>
      </div>

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}>List</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${view === "map" ? "active" : ""}`} onClick={() => setView("map")}>Map (prototype)</button>
        </li>
      </ul>

      {view === "list" && <ActivitiesList items={items} city={city} country={country} onRefresh={fetchActivities} />}
      {view === "map" && <ActivitiesMap items={items} city={city} country={country} />}
    </div>
  );
}


