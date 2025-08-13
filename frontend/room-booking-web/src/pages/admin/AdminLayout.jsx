import { NavLink, Outlet } from 'react-router-dom';

const COLORS = {
        primary: '#272446',
        accent: '#c01d2e',
};

export default function AdminLayout() {
        return (
                <div className="container-fluid">
                        <div className="row" style={{ minHeight: '100vh' }}>
                                {/* Sidebar */}
                                <aside className="col-12 col-md-3 col-lg-2 border-end" style={{ background: '#fff' }}>
                                        {/* header removed */}
                                        <nav className="nav flex-column p-3" style={{ gap: '6px' }}>
                                                <AdminLink to="/admin/overview" icon="bi-speedometer2">Overview</AdminLink>
                                                <AdminLink to="/admin/visualisation" icon="bi-bar-chart">Visualisation</AdminLink>
                                                <AdminLink to="/admin/rooms" icon="bi-door-closed">Rooms</AdminLink>
                                                <AdminLink to="/admin/floors" icon="bi-building">Floors</AdminLink>
                                                <AdminLink to="/admin/requests" icon="bi-inboxes">Request</AdminLink>
                                                <AdminLink to="/admin/settings" icon="bi-gear">Setting</AdminLink>
                                        </nav>

                                        <div className="text-secondary small px-3 pb-3 mt-auto">
                                                <span className="opacity-75">Room-Booking</span>
                                        </div>
                                </aside>

                                {/* Content */}
                                <main className="col-12 col-md-9 col-lg-10">
                                        <div className="p-3 p-md-4">
                                                <Outlet />
                                        </div>
                                </main>
                        </div>
                </div>
        );
}

function AdminLink({ to, icon, children }) {
        return (
                <NavLink
                        to={to}
                        className={({ isActive }) =>
                                'nav-link d-flex align-items-center px-3 py-2 rounded-3 ' + (isActive ? 'text-white' : '')
                        }
                        style={({ isActive }) => ({
                                color: isActive ? '#fff' : COLORS.primary,
                                backgroundColor: isActive ? COLORS.primary : 'transparent',
                        })}
                >
                        <i className={`bi ${icon} me-2`}></i>
                        <span>{children}</span>
                </NavLink>
        );
}
