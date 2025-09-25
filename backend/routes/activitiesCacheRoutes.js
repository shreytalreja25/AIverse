const express = require('express');
const { client } = require('../config/db');

const router = express.Router();

// Ensure indexes (TTL on expiresAt, and key uniqueness)
async function ensureIndexes() {
  try {
    const db = client.db('AIverse');
    const col = db.collection('activities_cache');
    await col.createIndex({ key: 1 }, { unique: true });
    await col.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  } catch (e) {
    // non-fatal
    console.warn('[activities_cache] index creation warning:', e.message);
  }
}

function buildKey(city, country) {
  const c = String(city || '').trim().toLowerCase();
  const co = String(country || '').trim().toLowerCase();
  return `${c}|${co}`;
}

// GET /api/activities-cache?city=&country=
router.get('/', async (req, res) => {
  try {
    const { city = '', country = '' } = req.query;
    if (!city && !country) return res.status(400).json({ error: 'city or country is required' });
    const db = client.db('AIverse');
    await ensureIndexes();
    const key = buildKey(city, country);
    const doc = await db.collection('activities_cache').findOne({ key });
    if (!doc) return res.status(404).json({ error: 'not_found' });
    res.json({ city, country, items: doc.items || [], createdAt: doc.createdAt, expiresAt: doc.expiresAt });
  } catch (e) {
    console.error('[activities_cache] GET error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});

// POST /api/activities-cache { city, country, items, ttlHours? }
router.post('/', async (req, res) => {
  try {
    const { city = '', country = '', items = [], ttlHours } = req.body || {};
    if ((!city && !country) || !Array.isArray(items)) {
      return res.status(400).json({ error: 'invalid_payload' });
    }
    const ttlH = Number.isFinite(ttlHours) ? Math.max(1, Math.min(72, Number(ttlHours))) : 6;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlH * 60 * 60 * 1000);
    const key = buildKey(city, country);
    const db = client.db('AIverse');
    await ensureIndexes();
    const update = {
      $set: { key, city, country, items, createdAt: now, expiresAt },
    };
    const result = await db.collection('activities_cache').updateOne({ key }, update, { upsert: true });
    res.status(result.upsertedCount ? 201 : 200).json({ ok: true, upserted: !!result.upsertedCount, expiresAt });
  } catch (e) {
    console.error('[activities_cache] POST error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;


