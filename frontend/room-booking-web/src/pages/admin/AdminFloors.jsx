import { useEffect, useMemo, useState } from 'react';
import {
        listFloors,
        createFloor,
        updateFloor,
        deleteFloor,
        getFloorRooms,
        createRoomInFloor,
        updateRoom,
        deleteRoom,
} from '../../api';

const BRAND = '#272446';

export default function AdminFloors() {
        const token = localStorage.getItem('token') || '';

        // floors
        const [floors, setFloors] = useState([]);
        const [editing, setEditing] = useState(false);

        const sortedFloors = useMemo(
                () => [...floors].sort((a, b) => a.name.localeCompare(b.name)),
                [floors]
        );


        // selection
        const [selId, setSelId] = useState('');
        const selected = useMemo(() => floors.find(f => f.id === selId) || null, [floors, selId]);


        // rooms of selected
        const [rooms, setRooms] = useState([]);
        const [loading, setLoading] = useState(true);
        const [err, setErr] = useState('');

        // create floor
        const [fLevel, setFLevel] = useState(1);
        const [fName, setFName] = useState('');

        // edit floor (right)
        const [efName, setEfName] = useState('');
        const [efLevel, setEfLevel] = useState(1);

        // create room
        const [rName, setRName] = useState('');
        const [rCap, setRCap] = useState(4);

        async function loadFloors() {
                try {
                        setErr('');
                        setLoading(true);
                        const data = await listFloors(token);
                        const onlyActive = (Array.isArray(data) ? data : []).filter(f => f.isActive !== false);
                        setFloors(onlyActive);

                        if (!selId && onlyActive.length) {
                                setSelId(onlyActive[0].id);
                        } else if (selId && !onlyActive.find(f => f.id === selId)) {
                                setSelId(onlyActive[0]?.id || '');
                        }
                } catch (e) {
                        setErr(e.message || 'Failed to load floors');
                } finally {
                        setLoading(false);
                }
        }



        async function loadRoomsForSelected(id) {
                if (!id) return setRooms([]);
                try {
                        const { floor, rooms } = await getFloorRooms(token, id);
                        setRooms(rooms || []);
                        setEfName(floor?.name || '');
                        setEfLevel(floor?.level ?? 1);
                } catch (e) {
                        setErr(e.message || 'Failed to load rooms');
                }
        }

        useEffect(() => { loadFloors(); }, []);
        useEffect(() => { loadRoomsForSelected(selId); }, [selId]);

        /* ---------- actions ---------- */

        async function onCreateFloor(e) {
                e.preventDefault();
                try {
                        const created = await createFloor(token, { name: (fName || '').trim() });
                        setFName('');
                        await loadFloors();
                        setSelId(created.id);
                } catch (e) {
                        alert(e.message || 'Create floor failed');
                }
        }


        async function onSaveFloor(e) {
                e.preventDefault();
                if (!selected) return;

                const newName = efName.trim();
                if (!newName) return alert('Floor name is required');

                try {
                        const updated = await updateFloor(token, selected.id, { name: newName });

                        // update left list immediately
                        setFloors(prev => prev.map(f => (f.id === selected.id ? { ...f, name: updated.name } : f)));

                        // refresh right pane
                        await loadRoomsForSelected(selected.id);

                        setEditing(false); // hide panel
                } catch (err) {
                        alert(err.message || 'Update floor failed');
                }
        }


        async function onDeleteFloor() {
                if (!selected) return;
                if (!window.confirm('Delete this floor?')) return;
                try {
                        await deleteFloor(token, selected.id);
                        setSelId('');
                        await loadFloors();
                        setRooms([]);
                } catch (e) {
                        alert(e.message || 'Delete floor failed');
                }
        }

        function onEditRow(f, e) {
                e.stopPropagation();
                setSelId(f.id);        // ensure a selection exists
                setEfName(f.name);     // preload current name
                setEditing(true);      // <-- show the edit panel
        }

        async function onDeleteRow(f, e) {
                e.stopPropagation();
                if (!window.confirm(`Delete floor "${f.name}"?`)) return;
                try {
                        await deleteFloor(token, f.id);
                        if (selId === f.id) {
                                setSelId('');
                                setRooms([]);
                        }
                        await loadFloors();
                } catch (er) {
                        alert(er.message || 'Delete floor failed');
                }
        }

        async function onCreateRoom(e) {
                e.preventDefault();
                if (!selected) return alert('Select a floor first');
                try {
                        await createRoomInFloor(token, selected.id, {
                                name: rName.trim(),
                                capacity: Number(rCap),
                        });
                        setRName('');
                        await loadRoomsForSelected(selected.id);
                } catch (e) {
                        alert(e.message || 'Create room failed');
                }
        }

        async function onRenameRoom(room) {
                const name = window.prompt('New room name:', room.name);
                if (!name) return;
                try {
                        await updateRoom(token, room.id, { name: name.trim() });
                        await loadRoomsForSelected(selected.id);
                } catch (e) {
                        alert(e.message || 'Rename failed');
                }
        }

        async function onChangeCap(room) {
                const cap = window.prompt('New capacity:', String(room.capacity));
                if (!cap) return;
                try {
                        await updateRoom(token, room.id, { capacity: Number(cap) });
                        await loadRoomsForSelected(selected.id);
                } catch (e) {
                        alert(e.message || 'Update capacity failed');
                }
        }

        async function onDeleteRoomClick(room) {
                if (!window.confirm(`Delete room "${room.name}"?`)) return;
                try {
                        await deleteRoom(token, room.id);
                        await loadRoomsForSelected(selected.id);
                } catch (e) {
                        alert(e.message || 'Delete room failed');
                }
        }

        /* ---------- render ---------- */

        return (
                <div className="row g-3">
                        {/* LEFT: Create floor (TOP) + Floor list (BOTTOM) */}
                        <aside className="col-12 col-md-4 col-lg-3">
                                <div className="card border-0 shadow-sm">
                                        <div className="card-body">

                                                {/* CREATE FLOOR — moved to top */}
                                                <form className="border rounded-3 p-2 mb-3" onSubmit={onCreateFloor}>
                                                        <div className="row g-2">
                                                                <div className="col-12">
                                                                        <label className="form-label small mb-1">Name</label>
                                                                        <input
                                                                                className="form-control form-control-sm"
                                                                                value={fName}
                                                                                onChange={e => setFName(e.target.value)}
                                                                                placeholder="First Floor"
                                                                                required
                                                                        />
                                                                </div>
                                                                <div className="col-12">
                                                                        <button className="btn btn-sm text-white w-100" style={{ backgroundColor: BRAND, borderColor: BRAND }}>
                                                                                + Create Floor
                                                                        </button>
                                                                </div>
                                                        </div>
                                                </form>


                                                {/* FLOOR LIST — moved below the form; no headings */}
                                                <div className="list-group">
                                                        {loading ? (
                                                                <div className="d-flex align-items-center gap-2 px-3 py-2">
                                                                        <span className="spinner-border spinner-border-sm" />
                                                                        <span>Loading…</span>
                                                                </div>
                                                        ) : sortedFloors.length === 0 ? (
                                                                <div className="text-secondary small px-3 py-2">No floors yet.</div>
                                                        ) : (
                                                                sortedFloors.map(f => (
                                                                        <div
                                                                                key={f.id}
                                                                                className={`list-group-item d-flex align-items-center justify-content-between ${selId === f.id ? 'active' : ''
                                                                                        }`}
                                                                                role="button"
                                                                                onClick={() => setSelId(f.id)}
                                                                                style={selId === f.id ? { backgroundColor: BRAND, borderColor: BRAND, color: '#fff' } : undefined}
                                                                        >
                                                                                <div className="me-2">
                                                                                        <div className="fw-semibold">{f.name}</div>
                                                                                        <div className="small opacity-75">Level {f.level}</div>
                                                                                </div>
                                                                                <div className="btn-group btn-group-sm">
                                                                                        <button
                                                                                                type="button"
                                                                                                className={`btn ${selId === f.id ? 'btn-light' : 'btn-outline-secondary'}`}
                                                                                                onClick={(e) => onEditRow(f, e)}
                                                                                        >
                                                                                                Edit
                                                                                        </button>

                                                                                        <button
                                                                                                type="button"
                                                                                                className={`btn ${selId === f.id ? 'btn-light' : 'btn-outline-danger'}`}
                                                                                                onClick={(e) => { e.stopPropagation(); onDeleteRow(f, e); }}
                                                                                        >
                                                                                                Delete
                                                                                        </button>

                                                                                </div>
                                                                        </div>
                                                                ))
                                                        )}
                                                </div>

                                                {err && <div className="alert alert-danger mt-3 mb-0">{err}</div>}
                                        </div>
                                </div>
                        </aside>

                        {/* RIGHT: Selected floor + rooms */}
                        <main className="col-12 col-md-8 col-lg-9">
                                <div className="card border-0 shadow-sm">
                                        <div className="card-body">
                                                {!selected ? (
                                                        <div className="alert alert-light border">Select a floor on the left.</div>
                                                ) : (
                                                        <>
                                                                {/* header + count */}
                                                                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                                                                        <div>
                                                                                <h2 className="h5 mb-0">{selected.name}</h2>
                                                                                <div className="text-secondary small">Level {selected.level}</div>
                                                                        </div>
                                                                        <div
                                                                                className="badge rounded-pill"
                                                                                style={{ backgroundColor: BRAND, color: '#fff', fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
                                                                        >
                                                                                {rooms.length} room{rooms.length !== 1 ? 's' : ''}
                                                                        </div>
                                                                </div>

                                                                {/* edit floor */}
                                                                {/* edit floor */}
                                                                {editing && (
                                                                        <form className="row g-2 align-items-end mb-3" onSubmit={onSaveFloor}>
                                                                                <div className="col-12 col-md-8 col-lg-6">
                                                                                        <label className="form-label">Edit name</label>
                                                                                        <input
                                                                                                className="form-control"
                                                                                                value={efName}
                                                                                                onChange={e => setEfName(e.target.value)}
                                                                                                required
                                                                                        />
                                                                                </div>

                                                                                <div className="col-12 col-md-4 col-lg-3 d-flex gap-2">
                                                                                        <button
                                                                                                type="submit"
                                                                                                className="btn text-white flex-fill"
                                                                                                style={{ backgroundColor: BRAND, borderColor: BRAND }}
                                                                                        >
                                                                                                Save
                                                                                        </button>
                                                                                        <button
                                                                                                type="button"
                                                                                                className="btn btn-outline-secondary flex-fill"
                                                                                                onClick={() => setEditing(false)}
                                                                                        >
                                                                                                Cancel
                                                                                        </button>
                                                                                </div>

                                                                                <div className="col-12 col-lg-3 text-lg-end">
                                                                                        <button
                                                                                                type="button"
                                                                                                className="btn btn-outline-danger w-100"
                                                                                                onClick={onDeleteFloor}
                                                                                        >
                                                                                                Delete floor
                                                                                        </button>
                                                                                </div>
                                                                        </form>
                                                                )}


                                                                {/* add room */}
                                                                <form className="row g-3 mb-3" onSubmit={onCreateRoom}>
                                                                        <div className="col-12 col-md-6 col-lg-5">
                                                                                <label className="form-label">Room name</label>
                                                                                <input className="form-control" value={rName} onChange={e => setRName(e.target.value)} placeholder="A101" required />
                                                                        </div>
                                                                        <div className="col-6 col-md-3 col-lg-2">
                                                                                <label className="form-label">Capacity</label>
                                                                                <input type="number" className="form-control" value={rCap} onChange={e => setRCap(e.target.value)} min={1} max={999} required />
                                                                        </div>
                                                                        <div className="col-12 col-md-3 col-lg-2 d-flex align-items-end">
                                                                                <button className="btn text-white w-100" style={{ backgroundColor: BRAND, borderColor: BRAND }}>
                                                                                        + Add Room
                                                                                </button>
                                                                        </div>
                                                                </form>

                                                                {/* rooms table */}
                                                                <div className="table-responsive">
                                                                        <table className="table table-striped table-hover align-middle">
                                                                                <thead className="table-dark">
                                                                                        <tr>
                                                                                                <th style={{ width: 220 }}>Name</th>
                                                                                                <th style={{ width: 140 }}>Capacity</th>
                                                                                                <th style={{ width: 220 }}></th>
                                                                                        </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                        {rooms.length === 0 ? (
                                                                                                <tr>
                                                                                                        <td colSpan={3} className="text-secondary">No rooms yet.</td>
                                                                                                </tr>
                                                                                        ) : (
                                                                                                rooms.map(r => (
                                                                                                        <tr key={r.id}>
                                                                                                                <td>{r.name}</td>
                                                                                                                <td>{r.capacity}</td>
                                                                                                                <td className="text-end">
                                                                                                                        <div className="btn-group btn-group-sm">
                                                                                                                                <button className="btn btn-outline-secondary" onClick={() => onRenameRoom(r)}>
                                                                                                                                        Rename
                                                                                                                                </button>
                                                                                                                                <button className="btn btn-outline-secondary" onClick={() => onChangeCap(r)}>
                                                                                                                                        Capacity
                                                                                                                                </button>
                                                                                                                                <button className="btn btn-outline-danger" onClick={() => onDeleteRoomClick(r)}>
                                                                                                                                        Delete
                                                                                                                                </button>
                                                                                                                        </div>
                                                                                                                </td>
                                                                                                        </tr>
                                                                                                ))
                                                                                        )}
                                                                                </tbody>
                                                                        </table>
                                                                </div>
                                                        </>
                                                )}
                                        </div>
                                </div>
                        </main>
                </div>
        );
}
