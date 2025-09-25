const express = require('express');
const { client } = require('../config/db');
const admin = require('../middlewares/adminMiddleware');

const router = express.Router();

async function ensureIndexes() {
  const db = client.db('AIverse');
  const col = db.collection('places');
  await col.createIndex({ location: '2dsphere' });
  await col.createIndex({ city: 1, country: 1 });
}

// GET /api/places?bounds=north,south,east,west&city=&country=&limit=200
router.get('/', async (req, res) => {
  try {
    await ensureIndexes();
    const { bounds, city, country, limit } = req.query;
    const db = client.db('AIverse');
    const col = db.collection('places');
    const q = {};
    if (city) q.city = String(city);
    if (country) q.country = String(country);
    if (bounds) {
      const [n, s, e, w] = String(bounds).split(',').map(Number);
      if ([n, s, e, w].every(Number.isFinite)) {
        q.location = {
          $geoWithin: {
            $box: [ [w, s], [e, n] ]
          }
        };
      }
    }
    const cursor = col.find(q).limit(Math.min(parseInt(limit || '200', 10), 500));
    const items = await cursor.toArray();
    res.json({ items });
  } catch (e) {
    console.error('[places] GET error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});

// POST /api/places (admin)
router.post('/', admin, async (req, res) => {
  try {
    await ensureIndexes();
    const { name, category, lat, lng, city, country, url, address, description, image } = req.body || {};
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ error: 'invalid_payload' });
    }
    const db = client.db('AIverse');
    const col = db.collection('places');
    const doc = {
      name, category: category || 'business', city: city || '', country: country || '',
      url: url || '', address: address || '', description: description || '', image: image || '',
      location: { type: 'Point', coordinates: [lng, lat] },
      createdAt: new Date(), updatedAt: new Date(), active: true
    };
    const result = await col.insertOne(doc);
    res.status(201).json({ id: result.insertedId, item: { ...doc, _id: result.insertedId } });
  } catch (e) {
    console.error('[places] POST error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});

// PUT /api/places/:id (admin)
router.put('/:id', admin, async (req, res) => {
  try {
    const { id } = req.params;
    const { ObjectId } = require('mongodb');
    const db = client.db('AIverse');
    const col = db.collection('places');
    const patch = { ...req.body, updatedAt: new Date() };
    if (patch.lat && patch.lng) {
      patch.location = { type: 'Point', coordinates: [Number(patch.lng), Number(patch.lat)] };
      delete patch.lat; delete patch.lng;
    }
    const result = await col.updateOne({ _id: new ObjectId(id) }, { $set: patch });
    res.json({ ok: result.matchedCount === 1 });
  } catch (e) {
    console.error('[places] PUT error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});

// DELETE /api/places/:id (admin)
router.delete('/:id', admin, async (req, res) => {
  try {
    const { id } = req.params;
    const { ObjectId } = require('mongodb');
    const db = client.db('AIverse');
    const col = db.collection('places');
    const result = await col.deleteOne({ _id: new ObjectId(id) });
    res.json({ ok: result.deletedCount === 1 });
  } catch (e) {
    console.error('[places] DELETE error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;


