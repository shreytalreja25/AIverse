import { useEffect, useRef } from "react";

// Prototype map: Leaflet if available, otherwise simple fallback
export default function ActivitiesMap({ items = [], city, country }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const L = window.L;
    if (!L) {
      // Fallback: prompt to include Leaflet or Google Maps later
      mapRef.current = null;
      return;
    }
    if (mapRef.current) {
      mapRef.current.remove();
    }
    mapRef.current = L.map(containerRef.current).setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapRef.current);

    // Attempt to center roughly on user's country via Nominatim (best-effort)
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${city || ''} ${country || ''}`)}`)
      .then(r => r.json()).then(arr => {
        if (Array.isArray(arr) && arr.length) {
          mapRef.current.setView([parseFloat(arr[0].lat), parseFloat(arr[0].lon)], 10);
        }
      }).catch(() => {});

    items.forEach(it => {
      const q = encodeURIComponent(`${it.place}, ${city}, ${country}`);
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}`)
        .then(r => r.json()).then(arr => {
          if (Array.isArray(arr) && arr.length) {
            const lat = parseFloat(arr[0].lat);
            const lon = parseFloat(arr[0].lon);
            const marker = L.marker([lat, lon]).addTo(mapRef.current);
            marker.bindPopup(`<strong>${it.title}</strong><br/>${it.place}<br/><a href="https://www.google.com/maps/search/?api=1&query=${q}" target="_blank">Directions</a>`);
          }
        }).catch(() => {});
    });
  }, [items, city, country]);

  return (
    <div className="w-100" style={{ height: 500 }}>
      <div ref={containerRef} style={{ height: "100%", width: "100%", borderRadius: 8, overflow: "hidden" }} className="border"></div>
      {!window.L && (
        <div className="alert alert-info mt-2">
          Map prototype: Include Leaflet in index.html or provide a Google Maps key to enable full map rendering.
        </div>
      )}
    </div>
  );
}


