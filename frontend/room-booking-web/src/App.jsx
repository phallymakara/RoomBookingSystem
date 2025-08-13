import { Routes, Route, Navigate, useNavigate, Outlet } from 'react-router-dom';
import NavBar from './components/NavBar.jsx';

import Login from './pages/Login.jsx';
import Rooms from './pages/Rooms.jsx';
import Booking from './pages/Booking.jsx';
import Register from './pages/Register.jsx';

import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminOverview from './pages/admin/Overview.jsx';
import AdminFloors from './pages/admin/AdminFloors.jsx';
import AdminVisualisation from './pages/admin/Visualisation.jsx';
import AdminRooms from './pages/admin/AdminRooms.jsx';
import AdminRequests from './pages/admin/AdminRequests.jsx';
import AdminSettings from './pages/admin/Settings.jsx';

function getToken() {
  return localStorage.getItem('token') || '';
}
function getUser() {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
}

function Protected({ children }) {
  const token = getToken();
  return token ? children : <Navigate to="/login" replace />;
}

function ProtectedAdmin({ children }) {
  const token = getToken();
  const user = getUser();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== 'ADMIN') return <Navigate to="/rooms" replace />;
  return children;
}

function ContainerLayout() {
  return (
    <div className="container py-4">
      <Outlet />
    </div>
  );
}

export default function App() {
  const token = getToken();
  const user = getUser();
  const navigate = useNavigate();

  const homePath = user?.role === 'ADMIN' ? '/admin/overview' : '/rooms'; // 👈 add this

  function onLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  }

  return (
    <div className="bg-body-tertiary min-vh-100">
      <NavBar authed={!!token} user={user} onLogout={onLogout} />
      <Routes>
        {/* Admin branch: full-bleed (no container) */}
        <Route
          path="/admin/*"
          element={
            <ProtectedAdmin>
              <AdminLayout />
            </ProtectedAdmin>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="overview" element={<AdminOverview />} />
          <Route path="visualisation" element={<AdminVisualisation />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="floors" element={<AdminFloors />} />
          <Route path="rooms" element={<AdminRooms />} />
          <Route path="requests" element={<AdminRequests />} />
        </Route>

        {/* All other pages get the container wrapper */}
        <Route element={<ContainerLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/rooms" element={<Protected><Rooms /></Protected>} />
          <Route path="/rooms/:id/book" element={<Protected><Booking /></Protected>} />
          <Route path="*" element={<Navigate to={token ? homePath : '/login'} replace />} /> {/* 👈 uses it here */}
        </Route>
      </Routes>
    </div>
  );
}
