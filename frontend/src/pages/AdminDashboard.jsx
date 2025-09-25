import { useEffect, useMemo, useState } from 'react';
import API_BASE_URL from '../utils/config';

function useAdminGuard() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    try {
      const token = localStorage.getItem('admin:key');
      setOk(Boolean(token));
    } catch { setOk(false); }
  }, []);
  return ok;
}

export default function AdminDashboard() {
  const ok = useAdminGuard();
  const [tab, setTab] = useState('stats');
  const [places, setPlaces] = useState([]);
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const adminKey = useMemo(() => (typeof window !== 'undefined' ? (localStorage.getItem('admin:key') || '') : ''), []);
  // Login form state declared at top-level to avoid conditional hooks
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const login = (e) => {
    e.preventDefault();
    if (u === 'shreytalrejs25' && p === 'shrey9999') {
      try { localStorage.setItem('admin:key', 'local-admin'); } catch {}
      window.location.replace('/admin');
    } else {
      setErr('Invalid credentials');
    }
  };

  useEffect(() => {
    if (!ok || tab !== 'places') return;
    const fetchPlaces = async () => {
      try {
        const qs = new URLSearchParams({ city, country, bounds: '' }).toString();
        const res = await fetch(`${API_BASE_URL}/api/places?${qs}`);
        if (!res.ok) return;
        const j = await res.json();
        setPlaces(j.items || []);
      } catch {}
    };
    fetchPlaces();
  }, [ok, tab, city, country]);

  const filteredPlaces = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return places;
    return places.filter(p => (p.name || '').toLowerCase().includes(qq) || (p.category || '').toLowerCase().includes(qq));
  }, [q, places]);

  const createPlace = async (payload) => {
    await fetch(`${API_BASE_URL}/api/places`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey }, body: JSON.stringify(payload)
    });
    setTab('places');
  };

  const updatePlace = async (id, patch) => {
    await fetch(`${API_BASE_URL}/api/places/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey }, body: JSON.stringify(patch)
    });
  };

  const deletePlace = async (id) => {
    await fetch(`${API_BASE_URL}/api/places/${id}`, {
      method: 'DELETE', headers: { 'X-Admin-Key': adminKey }
    });
    setPlaces((arr) => arr.filter(p => String(p._id) !== String(id)));
  };

  if (!ok) {
    return (
      <div className="container py-5" style={{ maxWidth: 420 }}>
        <div className="card shadow-sm">
          <div className="card-body">
            <h4 className="mb-3">Admin Login</h4>
            {err && <div className="alert alert-danger py-2">{err}</div>}
            <form onSubmit={login}>
              <div className="mb-3">
                <label className="form-label">Username</label>
                <input className="form-control" value={u} onChange={e=>setU(e.target.value)} placeholder="Enter admin username" />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input type="password" className="form-control" value={p} onChange={e=>setP(e.target.value)} placeholder="Enter password" />
              </div>
              <button className="btn btn-primary w-100" type="submit">Login</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-3">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="m-0">AIVerse Admin</h3>
        <div className="d-flex gap-2">
          <button className={`btn btn-sm ${tab==='stats'?'btn-primary':'btn-outline-primary'}`} onClick={()=>setTab('stats')}>Stats</button>
          <button className={`btn btn-sm ${tab==='places'?'btn-primary':'btn-outline-primary'}`} onClick={()=>setTab('places')}>Places</button>
          <button className={`btn btn-sm ${tab==='activities'?'btn-primary':'btn-outline-primary'}`} onClick={()=>setTab('activities')}>Activities Cache</button>
          <button className={`btn btn-sm ${tab==='users'?'btn-primary':'btn-outline-primary'}`} onClick={()=>setTab('users')}>Users</button>
        </div>
      </div>

      {tab === 'stats' && (
        <Kpis />
      )}

      {tab === 'places' && (
        <div>
          <div className="d-flex flex-wrap gap-2 mb-2">
            <input className="form-control" placeholder="City" value={city} onChange={e=>setCity(e.target.value)} style={{maxWidth:200}} />
            <input className="form-control" placeholder="Country" value={country} onChange={e=>setCountry(e.target.value)} style={{maxWidth:200}} />
            <input className="form-control" placeholder="Search name/category" value={q} onChange={e=>setQ(e.target.value)} style={{maxWidth:280}} />
            <button className="btn btn-success ms-auto" onClick={()=>{
              const name = prompt('Name');
              if (!name) return;
              const lat = Number(prompt('Latitude'));
              const lng = Number(prompt('Longitude'));
              const url = prompt('Website URL') || '';
              const description = prompt('Description') || '';
              createPlace({ name, lat, lng, city, country, url, description });
            }}>+ Add Place</button>
          </div>
          <div className="table-responsive">
            <table className="table table-sm table-striped align-middle">
              <thead><tr><th>Name</th><th>Category</th><th>City</th><th>Country</th><th>Lat</th><th>Lng</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredPlaces.map(p => (
                  <tr key={p._id}>
                    <td>{p.name}</td>
                    <td>{p.category}</td>
                    <td>{p.city}</td>
                    <td>{p.country}</td>
                    <td>{p.location?.coordinates?.[1]}</td>
                    <td>{p.location?.coordinates?.[0]}</td>
                    <td className="d-flex gap-2">
                      <button className="btn btn-outline-secondary btn-sm" onClick={()=>{
                        const name = prompt('New name', p.name) || p.name;
                        updatePlace(p._id, { name });
                      }}>Edit</button>
                      <button className="btn btn-outline-danger btn-sm" onClick={()=>deletePlace(p._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {filteredPlaces.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-muted">No places found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'activities' && (
        <div>
          <p className="text-muted">Coming soon: view cached activities entries, delete/refresh.</p>
        </div>
      )}

      {tab === 'users' && (
        <UsersTable />
      )}
    </div>
  );
}

function Kpis() {
  const [kpis, setKpis] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const key = localStorage.getItem('admin:key') || '';
        const res = await fetch(`${API_BASE_URL}/api/admin/kpis`, { headers: { 'X-Admin-Key': key } });
        if (!res.ok) return;
        const j = await res.json();
        setKpis(j);
      } catch {}
    })();
  }, []);
  return (
    <div className="row g-3">
      <div className="col-6 col-md-3"><div className="card p-3"><div className="text-muted">Users</div><div className="fs-4">{kpis?.users ?? '—'}</div></div></div>
      <div className="col-6 col-md-3"><div className="card p-3"><div className="text-muted">Places</div><div className="fs-4">{kpis?.places ?? '—'}</div></div></div>
      <div className="col-6 col-md-3"><div className="card p-3"><div className="text-muted">Activities</div><div className="fs-4">{kpis?.activities ?? '—'}</div></div></div>
      <div className="col-12"><div className="card p-3"><div className="text-muted mb-2">Activities adds (7 days)</div>
        <div style={{height:120}}>
          {kpis?.series ? (
            <svg width="100%" height="100%" preserveAspectRatio="none">
              {(() => {
                const data = kpis.series;
                const max = Math.max(1, ...data.map(d => d.count));
                const stepX = 100 / Math.max(1, data.length - 1);
                let path = '';
                data.forEach((d, i) => {
                  const x = i * stepX;
                  const y = 100 - (d.count / max) * 100;
                  path += `${i===0?'M':' L'} ${x},${y}`;
                });
                return <path d={path} stroke="#4ade80" fill="none" strokeWidth="2" />;
              })()}
            </svg>
          ) : 'Loading...'}
        </div>
      </div></div>
    </div>
  );
}

function UsersTable() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const key = typeof window !== 'undefined' ? (localStorage.getItem('admin:key') || '') : '';
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users?query=${encodeURIComponent(q)}`, { headers: { 'X-Admin-Key': key } });
      if (!res.ok) return;
      const j = await res.json();
      setItems(j.items || []);
    } catch {}
  };
  useEffect(() => { fetchUsers(); }, []);
  return (
    <div>
      <div className="d-flex gap-2 mb-2">
        <input className="form-control" placeholder="Search username/email" value={q} onChange={e=>setQ(e.target.value)} style={{maxWidth:280}} />
        <button className="btn btn-outline-primary" onClick={fetchUsers}>Search</button>
      </div>
      <div className="table-responsive">
        <table className="table table-sm table-striped align-middle">
          <thead><tr><th>Username</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {items.map(u => (
              <tr key={u._id}>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>{u.status}</td>
                <td>
                  <button className="btn btn-outline-secondary btn-sm" onClick={async ()=>{
                    await fetch(`${API_BASE_URL}/api/admin/users/${u._id}`, { method:'PATCH', headers: { 'Content-Type':'application/json','X-Admin-Key': key }, body: JSON.stringify({ status: u.status === 'active' ? 'inactive' : 'active' }) });
                    fetchUsers();
                  }}>Toggle Active</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (<tr><td colSpan={4} className="text-center text-muted">No users</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}


