import { useEffect, useRef } from "react";
import API_BASE_URL from "../../utils/config";

// Prototype map: Leaflet if available, otherwise simple fallback
export default function ActivitiesMap({ items = [], city, country, selectedItem, lastMapView, onMapViewChange }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const markerRefs = useRef([]);

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
    const startCenter = lastMapView?.center || [0, 0];
    const startZoom = lastMapView?.zoom || 2;
    mapRef.current = L.map(containerRef.current).setView(startCenter, startZoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapRef.current);

    // Save view on moveend
    mapRef.current.on('moveend', () => {
      if (!onMapViewChange) return;
      const center = mapRef.current.getCenter();
      onMapViewChange({ center: [center.lat, center.lng], zoom: mapRef.current.getZoom() });
    });

    // Attempt to center roughly on user's country via Nominatim (best-effort)
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${city || ''} ${country || ''}`)}`)
      .then(r => r.json()).then(arr => {
        if (Array.isArray(arr) && arr.length) {
          mapRef.current.setView([parseFloat(arr[0].lat), parseFloat(arr[0].lon)], 10);
        }
      }).catch(() => {});

    markerRefs.current = [];
    items.forEach((it, idx) => {
      const q = encodeURIComponent(`${it.place}, ${city}, ${country}`);
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}`)
        .then(r => r.json()).then(arr => {
          if (Array.isArray(arr) && arr.length) {
            const lat = parseFloat(arr[0].lat);
            const lon = parseFloat(arr[0].lon);
            const marker = L.marker([lat, lon]).addTo(mapRef.current);
            markerRefs.current[idx] = marker;
            marker.bindPopup(`<strong>${it.title}</strong><br/>${it.place}<br/><a href="https://www.google.com/maps/search/?api=1&query=${q}" target="_blank">Directions</a>`);
          }
        }).catch(() => {});
    });

    // Live flights overlay using Aviationstack proxy
    let flightsLayer = L.layerGroup().addTo(mapRef.current);

    const getEmojiForAirline = (iata) => {
      if (!iata) return '✈️';
      const map = {
        MH: '🇲🇾✈️', // Malaysia Airlines
        WY: '🇴🇲✈️',
        UL: '🇱🇰✈️',
        TK: '🇹🇷✈️',
        TG: '🇹🇭✈️',
        QR: '🇶🇦✈️',
        CX: '🇭🇰✈️',
        SQ: '🇸🇬✈️',
      };
      return map[iata] || '✈️';
    };

    const renderFlights = (records = []) => {
      flightsLayer.clearLayers();
      records.forEach((f) => {
        const { latitude, longitude, direction } = f.position || {};
        if (typeof latitude !== 'number' || typeof longitude !== 'number') return;

        const emoji = getEmojiForAirline(f.airlineIata);
        const icon = L.divIcon({
          className: 'flight-emoji',
          html: `<div style="font-size:18px; transform: rotate(${direction || 0}deg); transform-origin: center;">${emoji}</div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const marker = L.marker([latitude, longitude], { icon }).addTo(flightsLayer);
        const title = `${f.airline || 'Unknown'} ${f.flightNumber || ''}`.trim();
        const dep = f.departure?.iata || f.departure?.airport || 'TBD';
        const arr = f.arrival?.iata || f.arrival?.airport || 'TBD';
        marker.bindPopup(`<strong>${title}</strong><br/>${dep} → ${arr}<br/>Status: ${f.status || 'unknown'}`);
      });
    };

    let abort = false;
    const fetchFlights = async () => {
      try {
        const url = `${API_BASE_URL}/api/flights/live?flight_status=active&limit=100`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!abort) renderFlights(json.data || []);
      } catch (e) {
        // silent fail for prototype
      }
    };

    // Initial fetch and periodic refresh every 30s
    fetchFlights();
    const t = setInterval(fetchFlights, 30000);

    return () => {
      clearInterval(t);
      abort = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [items, city, country, lastMapView, onMapViewChange]);

  // Focus selected item from list
  useEffect(() => {
    const L = window.L;
    if (!L || !mapRef.current || !selectedItem) return;
    const idx = items.findIndex(it => it.title === selectedItem.title && it.place === selectedItem.place);
    const marker = markerRefs.current[idx];
    if (marker) {
      mapRef.current.setView(marker.getLatLng(), Math.max(10, mapRef.current.getZoom()));
      marker.openPopup();
    }
  }, [selectedItem, items]);

  return (
    <div className="w-100 position-relative" style={{ height: window.innerWidth < 576 ? 360 : 500 }}>
      <div ref={containerRef} style={{ height: "100%", width: "100%", borderRadius: 8, overflow: "hidden" }} className="border"></div>
      {!window.L && (
        <div className="alert alert-info mt-2">
          Map prototype: Include Leaflet in index.html or provide a Google Maps key to enable full map rendering.
        </div>
      )}
      {markerRefs.current.length > 0 && (
        <button
          type="button"
          className="btn btn-primary position-absolute"
          style={{ right: 12, bottom: 12, borderRadius: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
          onClick={() => {
            const idx = Math.max(0, items.findIndex(it => it.title === selectedItem?.title && it.place === selectedItem?.place));
            const m = markerRefs.current[idx] || markerRefs.current[0];
            if (m && mapRef.current) {
              mapRef.current.setView(m.getLatLng(), Math.max(13, mapRef.current.getZoom()));
              m.openPopup();
            }
          }}
          aria-label="Focus selected marker"
          title="Focus selected marker"
        >
          <i className="fas fa-crosshairs"></i>
        </button>
      )}
    </div>
  );
}


