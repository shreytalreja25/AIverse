import { useEffect, useRef } from "react";

// Prototype map: Leaflet if available, otherwise simple fallback
export default function ActivitiesMap({ items = [], city, country, selectedItem, lastMapView, onMapViewChange, visible = true }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const markerRefs = useRef([]);
  const placesLayerRef = useRef(null);
  const geocodeCacheRef = useRef(new Map());

  useEffect(() => {
    if (!containerRef.current) return;
    const L = window.L;
    if (!L) {
      // Fallback: prompt to include Leaflet or Google Maps later
      mapRef.current = null;
      return;
    }
    if (!mapRef.current) {
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

      // Ensure proper sizing when mounted in a hidden tab
      setTimeout(() => {
        try { mapRef.current.invalidateSize(true); } catch {}
      }, 0);

      // Resize handler
      const onResize = () => {
        try { mapRef.current.invalidateSize(true); } catch {}
      };
      window.addEventListener('resize', onResize);
      mapRef.current._onResize = onResize;
    }
    const startCenter = lastMapView?.center || [0, 0];
    const startZoom = lastMapView?.zoom || 2;
    mapRef.current.setView(startCenter, startZoom);

    // Attempt to center roughly on user's country via Nominatim (best-effort)
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${city || ''} ${country || ''}`)}`)
      .then(r => r.json()).then(arr => {
        if (Array.isArray(arr) && arr.length) {
          mapRef.current.setView([parseFloat(arr[0].lat), parseFloat(arr[0].lon)], 10);
        }
      }).catch(() => {});

    // Activities markers layer (single persistent layer)
    if (!mapRef.current._activitiesLayer) {
      mapRef.current._activitiesLayer = L.layerGroup().addTo(mapRef.current);
    }
    const activitiesLayer = mapRef.current._activitiesLayer;
    activitiesLayer.clearLayers();

    markerRefs.current = [];

    // Debounced, cached geocoding with sequential requests to avoid resource exhaustion
    const geocode = async (query) => {
      const cache = geocodeCacheRef.current;
      if (cache.has(query)) return cache.get(query);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
        const arr = await res.json();
        const value = (Array.isArray(arr) && arr.length)
          ? { lat: parseFloat(arr[0].lat), lon: parseFloat(arr[0].lon) }
          : null;
        cache.set(query, value);
        return value;
      } catch {
        cache.set(query, null);
        return null;
      }
    };

    (async () => {
      for (let idx = 0; idx < items.length; idx++) {
        const it = items[idx];
        const query = `${it.place}, ${city}, ${country}`;
        const loc = await geocode(query);
        if (loc) {
          const marker = L.marker([loc.lat, loc.lon]).addTo(activitiesLayer);
          markerRefs.current[idx] = marker;
          const q = encodeURIComponent(query);
          marker.bindPopup(`<strong>${it.title}</strong><br/>${it.place}<br/><a href="https://www.google.com/maps/search/?api=1&query=${q}" target="_blank">Directions</a>`);
        }
        // Small delay to play nice with free OSM service
        await new Promise(r => setTimeout(r, 120));
      }
    })();

    // Live flights overlay using Aviationstack proxy
    // Maintain a single flights layer across updates
    if (!mapRef.current._flightsLayer) {
      mapRef.current._flightsLayer = L.layerGroup().addTo(mapRef.current);
    }
    let flightsLayer = mapRef.current._flightsLayer;

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
        // Hardcoded direct call to Aviationstack per user instruction
        const url = `https://api.aviationstack.com/v1/flights?access_key=4c0ec2710326094c0375282f66666f5d&flight_status=active&limit=100`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        // Transform Aviationstack records to simplified format expected by renderFlights
        const flights = Array.isArray(json?.data) ? json.data : [];
        const simplified = flights
          .map((f) => {
            const live = f.live || {};
            const lat = live.latitude;
            const lon = live.longitude;
            if (typeof lat !== 'number' || typeof lon !== 'number') return null;
            return {
              id: `${f.airline?.iata || f.airline?.icao || 'XX'}-${f.flight?.number || f.flight?.iata || f.flight?.icao || Math.random().toString(36).slice(2)}`,
              airline: f.airline?.name || null,
              airlineIata: f.airline?.iata || null,
              flightNumber: f.flight?.number || f.flight?.iata || f.flight?.icao || null,
              status: f.flight_status || null,
              position: {
                latitude: lat,
                longitude: lon,
                direction: typeof live.direction === 'number' ? live.direction : null,
                speedKts: typeof live.speed_horizontal === 'number' ? live.speed_horizontal : null,
                altitudeFt: typeof live.altitude === 'number' ? live.altitude : null,
              },
              departure: {
                airport: f.departure?.airport || null,
                iata: f.departure?.iata || null,
                scheduled: f.departure?.scheduled || null,
              },
              arrival: {
                airport: f.arrival?.airport || null,
                iata: f.arrival?.iata || null,
                scheduled: f.arrival?.scheduled || null,
              },
            };
          })
          .filter(Boolean);

        if (!abort) renderFlights(simplified);
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
      // Do not remove the map; keep it mounted for SPA feel
      // Remove resize listener once
      try {
        if (mapRef.current && mapRef.current._onResize) {
          window.removeEventListener('resize', mapRef.current._onResize);
          delete mapRef.current._onResize;
        }
      } catch {}
    };
  }, [items, city, country]);

  // Invalidate size when tab toggles to visible
  useEffect(() => {
    const L = window.L;
    if (!L || !mapRef.current) return;
    if (visible) {
      setTimeout(() => {
        try { mapRef.current.invalidateSize(true); } catch {}
      }, 0);
    }
  }, [visible]);

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

  // Businesses layer from backend, fetched by current bounds
  useEffect(() => {
    const L = window.L;
    if (!L || !mapRef.current) return;
    if (!placesLayerRef.current) {
      placesLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }

    const renderPlaces = (arr = []) => {
      placesLayerRef.current.clearLayers();
      arr.forEach((p) => {
        if (!p?.location?.coordinates) return;
        const [lng, lat] = p.location.coordinates;
        const icon = L.divIcon({ className: 'place-emoji', html: `<div style="font-size:16px">🏷️</div>`, iconSize: [20, 20], iconAnchor: [10, 10] });
        const marker = L.marker([lat, lng], { icon }).addTo(placesLayerRef.current);
        const title = p.name || 'Business';
        const desc = p.description || '';
        const link = p.url ? `<br/><a href="${p.url}" target="_blank">Website</a>` : '';
        marker.bindPopup(`<strong>${title}</strong><br/>${desc}${link}`);
      });
    };

    let abort = false;
    const fetchPlaces = async () => {
      try {
        const b = mapRef.current.getBounds();
        const n = b.getNorth();
        const s = b.getSouth();
        const e = b.getEast();
        const w = b.getWest();
        const qs = new URLSearchParams({ bounds: `${n},${s},${e},${w}`, city: city || '', country: country || '' }).toString();
        const base = window.__API_BASE_URL || window.__BACKEND_URL || '';
        const res = await fetch(`${base}/api/places?${qs}`);
        if (!res.ok) return;
        const j = await res.json();
        if (!abort) renderPlaces(j.items || []);
      } catch {}
    };

    fetchPlaces();
    const t = setInterval(fetchPlaces, 45000);
    mapRef.current.on('moveend zoomend', fetchPlaces);
    return () => {
      clearInterval(t);
      if (mapRef.current) mapRef.current.off('moveend zoomend', fetchPlaces);
    };
  }, [city, country]);

  return (
    <div className={`w-100 position-relative ${visible ? '' : 'd-none'}`} style={{ height: window.innerWidth < 576 ? 420 : 520 }}>
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


