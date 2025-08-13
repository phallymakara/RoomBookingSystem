import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRooms } from '../api';

export default function Rooms() {
        const [q, setQ] = useState('');
        const [minCap, setMinCap] = useState('');
        const [loading, setLoading] = useState(false);
        const [rooms, setRooms] = useState([]);

        async function load() {
                setLoading(true);
                try {
                        const data = await getRooms({
                                q: q || undefined,
                                capacity_gte: minCap || undefined,
                                pageSize: 100
                        });
                        setRooms(data.items || []);
                } finally {
                        setLoading(false);
                }
        }

        useEffect(() => { load(); }, []);

        return (
                <>
                        <div className="d-flex flex-wrap gap-2 align-items-end mb-3">
                                <div>
                                        <label className="form-label">Search</label>
                                        <input className="form-control" value={q} onChange={e => setQ(e.target.value)} placeholder="Room or building" />
                                </div>
                                <div>
                                        <label className="form-label">Min capacity</label>
                                        <input className="form-control" type="number" min="1" value={minCap} onChange={e => setMinCap(e.target.value)} />
                                </div>
                                <button className="btn btn-primary" onClick={load} disabled={loading}>
                                        {loading && <span className="spinner-border spinner-border-sm me-2" />}Search
                                </button>
                        </div>

                        {rooms.length === 0 ? (
                                <div className="alert alert-secondary">No rooms found.</div>
                        ) : (
                                <div className="row g-3">
                                        {rooms.map(r => (
                                                <div className="col-12 col-md-6 col-lg-4" key={r.id}>
                                                        <div className="card h-100 shadow-sm">
                                                                {r.photoUrl && <img src={r.photoUrl} className="card-img-top" alt={r.name} />}
                                                                <div className="card-body d-flex flex-column">
                                                                        <h5 className="card-title mb-1">{r.name}</h5>
                                                                        <div className="text-secondary small mb-2">{r.building} · floor {r.floor}</div>
                                                                        <div className="mb-3"><span className="badge text-bg-light">Capacity: {r.capacity}</span></div>
                                                                        <div className="mt-auto d-grid gap-2">
                                                                                <Link className="btn btn-outline-primary" to={`/rooms/${r.id}/book`}>
                                                                                        <i className="bi bi-calendar-plus me-1"></i> Check availability
                                                                                </Link>
                                                                        </div>
                                                                </div>
                                                        </div>
                                                </div>
                                        ))}
                                </div>
                        )}
                </>
        );
}
