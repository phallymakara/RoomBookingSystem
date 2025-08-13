// frontend/src/pages/admin/AdminRooms.jsx
import { useEffect, useMemo, useState } from 'react';
import {
        adminCreateRoom,
        getGroupedRooms,
        getFloorLabels,
        setFloorLabels,
} from '../../api';

const BRAND = '#272446';

export default function AdminRooms() {
        const token = localStorage.getItem('token') || '';
        const [building, setBuilding] = useState('Main');

        // data
        const [groups, setGroups] = useState([]);   // [{building,floor,label,rooms:[...]}]
        const [labels, setLabels] = useState({});   // {"1":"First Floor", ...}

        // ui
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState('');

        // floor creation form
        const [newLevel, setNewLevel] = useState(1);
        const [newLabel, setNewLabel] = useState('');

        // add room form
        const [roomName, setRoomName] = useState('');
        const [roomCap, setRoomCap] = useState(4);

        // floors to show (labels ∪ groups) so floors show even with 0 rooms
        const floorKeys = useMemo(() => {
                const set = new Set(Object.keys(labels || {}));
                groups.forEach(g => set.add(String(g.floor)));
                return Array.from(set).sort((a, b) => Number(a) - Number(b));
        }, [labels, groups]);

        // selected floor
        const [selectedKey, setSelectedKey] = useState('1');
        const selectedFloor = useMemo(() => Number(selectedKey || 0), [selectedKey]);

        // rooms on the selected floor
        const rooms = useMemo(() => {
                const g = groups.find(x => x.building === building && x.floor === selectedFloor);
                return g?.rooms || [];
        }, [groups, building, selectedFloor]);

        const selectedLabel = labels[selectedKey] || (selectedKey ? `Floor ${selectedKey}` : '');

        async function loadAll() {
                try {
                        setError('');
                        setLoading(true);
                        const [grp, lbl] = await Promise.all([
                                getGroupedRooms(building),
                                getFloorLabels(building).catch(() => ({})),
                        ]);
                        setGroups(Array.isArray(grp) ? grp : []);
                        setLabels(lbl || {});
                } catch (e) {
                        setError(e.message || 'Failed to load rooms');
                } finally {
                        setLoading(false);
                }
        }

        useEffect(() => {
                loadAll();
                // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [building]);

        // create floor (label)
        async function createFloor(e) {
                e.preventDefault();
                if (!newLevel) return;
                try {
                        // merge current labels + new one
                        const next = { ...labels, [String(newLevel)]: newLabel || `Floor ${newLevel}` };
                        const payload = Object.entries(next).map(([level, label]) => ({
                                level: Number(level),
                                label: String(label),
                        }));
                        await setFloorLabels(token, building, payload);
                        setLabels(next);
                        setSelectedKey(String(newLevel)); // jump to the new floor
                        setNewLabel('');
                } catch (e) {
                        alert(e.message || 'Failed to create floor');
                }
        }

        // add room into selected floor
        async function addRoom(e) {
                e.preventDefault();
                if (!selectedFloor) return alert('Create/select a floor first.');
                try {
                        await adminCreateRoom(token, {
                                name: roomName.trim(),
                                building,
                                floor: selectedFloor,
                                capacity: Number(roomCap),
                                equipment: {},
                        });
                        setRoomName('');
                        await loadAll(); // refresh count + list
                } catch (e) {
                        alert(e.message || 'Failed to add room');
                }
        }

        return (
                <div className="row g-3">
                        {/* Left: Floor management */}
                        <aside className="col-12 col-md-4 col-lg-3">
                                <div className="card border-0 shadow-sm">
                                        <div className="card-body">
                                                <div className="d-flex align-items-end justify-content-between mb-3">
                                                        <div>
                                                                <h2 className="h5 mb-1">Floors</h2>
                                                                <div className="text-secondary small">Create a floor, then add rooms.</div>
                                                        </div>
                                                        <div className="d-flex align-items-center">
                                                                <label className="form-label me-2 mb-0 small">Building</label>
                                                                <input
                                                                        className="form-control form-control-sm"
                                                                        style={{ width: 140 }}
                                                                        value={building}
                                                                        onChange={e => setBuilding(e.target.value || 'Main')}
                                                                />
                                                        </div>
                                                </div>

                                                {/* Existing floors */}
                                                <div className="list-group mb-3">
                                                        {loading ? (
                                                                <div className="d-flex align-items-center gap-2 px-3 py-2">
                                                                        <span className="spinner-border spinner-border-sm" />
                                                                        <span>Loading…</span>
                                                                </div>
                                                        ) : floorKeys.length === 0 ? (
                                                                <div className="text-secondary small px-3 py-2">No floors yet.</div>
                                                        ) : (
                                                                floorKeys.map(k => {
                                                                        const count =
                                                                                (groups.find(g => g.building === building && g.floor === Number(k))?.rooms || []).length;
                                                                        return (
                                                                                <button
                                                                                        key={k}
                                                                                        className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${selectedKey === k ? 'active' : ''
                                                                                                }`}
                                                                                        onClick={() => setSelectedKey(k)}
                                                                                        style={
                                                                                                selectedKey === k
                                                                                                        ? { backgroundColor: BRAND, borderColor: BRAND }
                                                                                                        : undefined
                                                                                        }
                                                                                >
                                                                                        <span>{labels[k] || `Floor ${k}`}</span>
                                                                                        <span className="badge bg-secondary">{count}</span>
                                                                                </button>
                                                                        );
                                                                })
                                                        )}
                                                </div>

                                                {/* Create floor */}
                                                <form className="border rounded-3 p-2" onSubmit={createFloor}>
                                                        <div className="row g-2">
                                                                <div className="col-4">
                                                                        <label className="form-label small mb-1">Level</label>
                                                                        <input
                                                                                type="number"
                                                                                className="form-control form-control-sm"
                                                                                value={newLevel}
                                                                                onChange={e => setNewLevel(Number(e.target.value || 0))}
                                                                                required
                                                                        />
                                                                </div>
                                                                <div className="col-8">
                                                                        <label className="form-label small mb-1">Label</label>
                                                                        <input
                                                                                className="form-control form-control-sm"
                                                                                value={newLabel}
                                                                                onChange={e => setNewLabel(e.target.value)}
                                                                                placeholder="First Floor"
                                                                        />
                                                                </div>
                                                                <div className="col-12">
                                                                        <button
                                                                                className="btn btn-sm text-white w-100"
                                                                                style={{ backgroundColor: BRAND, borderColor: BRAND }}
                                                                        >
                                                                                + Create Floor
                                                                        </button>
                                                                </div>
                                                        </div>
                                                </form>

                                                {error && <div className="alert alert-danger mt-3">{error}</div>}
                                        </div>
                                </div>
                        </aside>

                        {/* Right: Rooms in selected floor */}
                        <main className="col-12 col-md-8 col-lg-9">
                                <div className="card border-0 shadow-sm">
                                        <div className="card-body">
                                                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                                                        <div>
                                                                <h2 className="h5 mb-0">
                                                                        {selectedKey ? selectedLabel : 'No floor selected'}
                                                                </h2>
                                                                <div className="text-secondary small">{building}</div>
                                                        </div>
                                                        {/* Room count */}
                                                        <div
                                                                className="badge rounded-pill"
                                                                style={{
                                                                        backgroundColor: BRAND,
                                                                        color: '#fff',
                                                                        fontSize: '0.9rem',
                                                                        padding: '0.5rem 0.75rem'
                                                                }}
                                                                title="Number of rooms on this floor"
                                                        >
                                                                {rooms.length} room{rooms.length !== 1 ? 's' : ''}
                                                        </div>
                                                </div>

                                                {/* Add room (only if a floor is selected) */}
                                                {selectedKey ? (
                                                        <form className="row g-3 mb-3" onSubmit={addRoom}>
                                                                <div className="col-12 col-md-6 col-lg-5">
                                                                        <label className="form-label">Room name</label>
                                                                        <input
                                                                                className="form-control"
                                                                                value={roomName}
                                                                                onChange={e => setRoomName(e.target.value)}
                                                                                placeholder="A101"
                                                                                required
                                                                        />
                                                                </div>
                                                                <div className="col-6 col-md-3 col-lg-2">
                                                                        <label className="form-label">Capacity</label>
                                                                        <input
                                                                                type="number"
                                                                                className="form-control"
                                                                                value={roomCap}
                                                                                onChange={e => setRoomCap(e.target.value)}
                                                                                min={1}
                                                                                max={999}
                                                                                required
                                                                        />
                                                                </div>
                                                                <div className="col-12 col-md-3 col-lg-2 d-flex align-items-end">
                                                                        <button
                                                                                className="btn text-white w-100"
                                                                                style={{ backgroundColor: BRAND, borderColor: BRAND }}
                                                                        >
                                                                                + Add Room
                                                                        </button>
                                                                </div>
                                                        </form>
                                                ) : (
                                                        <div className="alert alert-light border">
                                                                Create or select a floor on the left to add rooms.
                                                        </div>
                                                )}

                                                {/* Rooms list */}
                                                <div className="table-responsive">
                                                        <table className="table table-striped table-hover align-middle">
                                                                <thead className="table-dark">
                                                                        <tr>
                                                                                <th style={{ width: 200 }}>Name</th>
                                                                                <th style={{ width: 120 }}>Capacity</th>
                                                                        </tr>
                                                                </thead>
                                                                <tbody>
                                                                        {rooms.length === 0 ? (
                                                                                <tr>
                                                                                        <td colSpan={2} className="text-secondary">
                                                                                                No rooms on this floor yet.
                                                                                        </td>
                                                                                </tr>
                                                                        ) : (
                                                                                rooms.map(r => (
                                                                                        <tr key={r.id}>
                                                                                                <td>{r.name}</td>
                                                                                                <td>{r.capacity}</td>
                                                                                        </tr>
                                                                                ))
                                                                        )}
                                                                </tbody>
                                                        </table>
                                                </div>

                                        </div>
                                </div>
                        </main>
                </div>
        );
}
