const express = require('express');
const axios = require('axios');

const router = express.Router();

// GET /api/flights/live
// Proxies Aviationstack flights endpoint to avoid CORS
// NOTE: Per request, the API key is hardcoded for both dev and prod
router.get('/live', async (req, res) => {
  try {
    // Hardcoded key per user instruction (visible in code intentionally)
    const key = '4c0ec2710326094c0375282f66666f5d';

    const baseUrl = 'https://api.aviationstack.com/v1/flights';

    // Forward selected query params for flexibility (e.g., flight_status, limit, offset)
    const params = { ...req.query, access_key: key };

    const { data } = await axios.get(baseUrl, { params, timeout: 15000 });

    // Normalize to a compact array with only records that have live coordinates
    const flights = Array.isArray(data?.data) ? data.data : [];

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

    res.json({ count: simplified.length, data: simplified });
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).json({ error: 'Failed to fetch flights', details: err.message });
  }
});

module.exports = router;


