// src/api.js
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/* ---------- helpers ---------- */
async function handle(res) {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || data.message || res.statusText);
        return data;
}
function auth(token) {
        return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

/* ---------- auth ---------- */
export async function login(email, password) {
        const res = await fetch(`${BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
        });
        return handle(res); // { token, user }
}

export async function register(name, email, password) {
        const res = await fetch(`${BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Registration failed');
        return data;
}


/* ---------- rooms ---------- */
export async function getRooms(query = {}) {
        const qs = new URLSearchParams(query).toString();
        const res = await fetch(`${BASE}/rooms${qs ? `?${qs}` : ''}`);
        return handle(res);
}

export async function getRoom(id) {
        const res = await fetch(`${BASE}/rooms/${id}`);
        return handle(res);
}

export async function getAvailability(
        roomId,
        { date, duration = 60, step = 30, openStart = '08:00', openEnd = '22:00' }
) {
        const qs = new URLSearchParams({ date, duration, step, openStart, openEnd });
        const res = await fetch(`${BASE}/rooms/${roomId}/availability?${qs.toString()}`);
        return handle(res);
}

/* ---------- bookings (student) ---------- */
// Approval flow: students send a REQUEST (PENDING) with a reason
export async function requestBooking(token, { roomId, startTs, endTs, reason }) {
        const res = await fetch(`${BASE}/bookings/request`, {
                method: 'POST',
                headers: auth(token),
                body: JSON.stringify({ roomId, startTs, endTs, reason })
        });
        return handle(res); // returns the pending booking
}

export async function cancelBooking(token, bookingId, reason) {
        const res = await fetch(`${BASE}/bookings/${bookingId}/cancel`, {
                method: 'POST',
                headers: auth(token),
                body: JSON.stringify({ reason })
        });
        if (!res.ok && res.status !== 204) return handle(res);
        return true;
}

export async function getMyBookings(token) {
        const res = await fetch(`${BASE}/bookings/my/list`, { headers: { Authorization: `Bearer ${token}` } });
        return handle(res);
}

/* ---------- bookings (admin) ---------- */
// Optional: admin can still create a confirmed booking directly
export async function createBooking(token, { roomId, startTs, endTs }) {
        const res = await fetch(`${BASE}/bookings`, {
                method: 'POST',
                headers: auth(token),
                body: JSON.stringify({ roomId, startTs, endTs })
        });
        return handle(res);
}

export async function listBookingRequests(token, status = 'PENDING') {
        const qs = new URLSearchParams({ status });
        const res = await fetch(`${BASE}/bookings/admin/booking-requests?${qs.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
        });
        return handle(res);
}

export async function approveBookingRequest(token, id, note) {
        const res = await fetch(`${BASE}/bookings/admin/booking-requests/${id}/approve`, {
                method: 'POST',
                headers: auth(token),
                body: JSON.stringify(note ? { note } : {})
        });
        return handle(res);
}

export async function rejectBookingRequest(token, id, note) {
        const res = await fetch(`${BASE}/bookings/admin/booking-requests/${id}/reject`, {
                method: 'POST',
                headers: auth(token),
                body: JSON.stringify(note ? { note } : {})
        });
        return handle(res);
}

/* ---------- room schedule (admin) ---------- */
export async function setRoomOpenHours(token, roomId, hours /* [{weekday,startHHMM,endHHMM}] */) {
        const res = await fetch(`${BASE}/rooms/${roomId}/open-hours`, {
                method: 'PUT',
                headers: auth(token),
                body: JSON.stringify(hours)
        });
        if (!res.ok && res.status !== 204) return handle(res);
        return true;
}

export async function getRoomOpenHours(roomId) {
        const res = await fetch(`${BASE}/rooms/${roomId}/open-hours`);
        return handle(res);
}

export async function addRoomClosure(token, roomId, { startDate, endDate, reason }) {
        const res = await fetch(`${BASE}/rooms/${roomId}/closures`, {
                method: 'POST',
                headers: auth(token),
                body: JSON.stringify({ startDate, endDate, reason })
        });
        return handle(res);
}

export async function getRoomClosures(token, roomId, { from, to } = {}) {
        const qs = new URLSearchParams();
        if (from) qs.set('from', from);
        if (to) qs.set('to', to);
        const res = await fetch(`${BASE}/rooms/${roomId}/closures${qs.toString() ? `?${qs}` : ''}`, {
                headers: { Authorization: `Bearer ${token}` }
        });
        return handle(res);
}


/* ---------- admin rooms ---------- */
export async function adminCreateRoom(token, { name, building, floor, capacity, equipment = {}, photoUrl, isActive = true }) {
        const res = await fetch(`${BASE}/rooms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name, building, floor, capacity, equipment, photoUrl, isActive })
        });
        return handle(res);
}

export async function adminDeleteRoom(token, roomId, { hard = false } = {}) {
        const url = `${BASE}/rooms/${roomId}${hard ? '/hard' : ''}`;
        const res = await fetch(url, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok && res.status !== 204) return handle(res);
        return true;
}

/* ---------- floors & grouping ---------- */
export async function getGroupedRooms(building /* optional */) {
        const qs = new URLSearchParams();
        if (building) qs.set('building', building);
        const res = await fetch(`${BASE}/rooms/grouped${qs.toString() ? `?${qs}` : ''}`);
        return handle(res); // [{ building, floor, label, rooms: [...] }, ...]
}

export async function getFloorLabels(building) {
        const qs = new URLSearchParams({ building });
        const res = await fetch(`${BASE}/rooms/floor-labels?${qs.toString()}`);
        return handle(res); // { "1": "First Floor", ... } or {}
}

export async function setFloorLabels(token, building, labels /* [{level, label}] */) {
        const res = await fetch(`${BASE}/rooms/floor-labels`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ building, labels })
        });
        if (!res.ok && res.status !== 204) return handle(res);
        return true;
}

/* === Floors & Rooms (Admin) === */
function authJson(token) {
        return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

// floors
export async function listFloors(token) {
        const res = await fetch(`${BASE}/floors`, { headers: { Authorization: `Bearer ${token}` } });
        return handle(res);
}
export async function getFloorRooms(token, floorId) {
        const res = await fetch(`${BASE}/floors/${floorId}`, { headers: { Authorization: `Bearer ${token}` } });
        return handle(res);
}
export async function createFloor(token, { name }) {
        const res = await fetch(`${BASE}/floors`, {
                method: 'POST',
                headers: auth(token),
                body: JSON.stringify({ name })
        });
        return handle(res);
}
export async function updateFloor(token, id, { name }) {
        const res = await fetch(`${BASE}/floors/${id}`, {
                method: 'PUT',
                headers: auth(token),
                body: JSON.stringify({ name })
        });
        return handle(res);
}
export async function deleteFloor(token, id) {
        const res = await fetch(`${BASE}/floors/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 204) return true;
        return handle(res);
}

// rooms (under floor)
export async function createRoomInFloor(token, floorId, { name, capacity }) {
        const res = await fetch(`${BASE}/floors/${floorId}/rooms`, {
                method: 'POST',
                headers: auth(token),
                body: JSON.stringify({ name, capacity })
        });
        return handle(res);
}
export async function updateRoom(token, roomId, data) {
        const res = await fetch(`${BASE}/floors/rooms/${roomId}`, {
                method: 'PUT',
                headers: auth(token),
                body: JSON.stringify(data)
        });
        return handle(res);
}
export async function deleteRoom(token, roomId) {
        const res = await fetch(`${BASE}/floors/rooms/${roomId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 204) return true;
        return handle(res);
}
