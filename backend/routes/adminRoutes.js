const express = require('express');
const { client } = require('../config/db');
const admin = require('../middlewares/adminMiddleware');

const router = express.Router();

// GET /api/admin/kpis
router.get('/kpis', admin, async (req, res) => {
  try {
    const db = client.db('AIverse');
    const users = await db.collection('users').countDocuments();
    const places = await db.collection('places').countDocuments();
    const activities = await db.collection('activities_cache').countDocuments();

    // 7 day series of activities cache writes
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const seriesAgg = await db.collection('activities_cache').aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();

    res.json({ users, places, activities, series: seriesAgg });
  } catch (e) {
    console.error('[admin] kpis error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});

// GET /api/admin/users?query=
router.get('/users', admin, async (req, res) => {
  try {
    const { query = '' , limit = '100'} = req.query;
    const db = client.db('AIverse');
    const q = query.trim();
    const filter = q ? { $or: [ { username: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } } ] } : {};
    const items = await db.collection('users').find(filter).project({ passwordHash: 0 }).limit(Math.min(parseInt(limit,10), 200)).toArray();
    res.json({ items });
  } catch (e) {
    console.error('[admin] users list error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});

// PATCH /api/admin/users/:id { status }
router.patch('/users/:id', admin, async (req, res) => {
  try {
    const { id } = req.params;
    const { ObjectId } = require('mongodb');
    const patch = {};
    if (req.body?.status) patch.status = String(req.body.status);
    const db = client.db('AIverse');
    const r = await db.collection('users').updateOne({ _id: new ObjectId(id) }, { $set: patch });
    res.json({ ok: r.matchedCount === 1 });
  } catch (e) {
    console.error('[admin] user patch error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});

// GET /api/admin/activities-cache
router.get('/activities-cache', admin, async (req, res) => {
  try {
    const db = client.db('AIverse');
    const items = await db.collection('activities_cache').find({}).sort({ createdAt: -1 }).limit(200).toArray();
    res.json({ items });
  } catch (e) {
    console.error('[admin] activities-cache list error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});

// DELETE /api/admin/activities-cache/:key
router.delete('/activities-cache/:key', admin, async (req, res) => {
  try {
    const db = client.db('AIverse');
    const r = await db.collection('activities_cache').deleteOne({ key: String(req.params.key) });
    res.json({ ok: r.deletedCount === 1 });
  } catch (e) {
    console.error('[admin] activities-cache delete error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;


