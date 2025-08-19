// src/pages/admin/AdminLayout.jsx
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const COLORS = { primary: '#272446', accent: '#c01d2e' };
const DUR = 280;
const EASE = 'cubic-bezier(.2,.8,.2,1)';
const SIDEBAR_W = 260;

export default function AdminLayout() {
        const [sidebarOpen, setSidebarOpen] = useState(true);

        return (
                // 👇 Admin shell: fill viewport minus navbar, NO outer scroll
                <div
                        className="container-fluid p-0"
                        style={{ height: 'calc(100vh - 56px)', overflow: 'hidden' }}
                >
                        <div className="d-flex h-100" style={{ overflow: 'hidden' }}>
                                {/* ==== Sidebar (collapses width and slides) ==== */}
                                <aside
                                        className="border-end bg-white position-relative"
                                        style={{
                                                width: sidebarOpen ? SIDEBAR_W : 0,
                                                flex: `0 0 ${sidebarOpen ? SIDEBAR_W : 0}px`,
                                                overflow: 'hidden',
                                                transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                                                transition: [
                                                        `transform ${DUR}ms ${EASE}`,
                                                        `width ${DUR}ms ${EASE}`,
                                                        `flex-basis ${DUR}ms ${EASE}`,
                                                ].join(', '),
                                                willChange: 'transform,width',
                                                zIndex: 1029,
                                                pointerEvents: sidebarOpen ? 'auto' : 'none',
                                        }}
                                        aria-hidden={!sidebarOpen}
                                >
                                        {/* Hide button */}
                                        <div className="d-flex justify-content-end p-2 border-bottom position-sticky top-0 bg-white" style={{ zIndex: 1 }}>
                                                <button
                                                        type="button"
                                                        className="btn d-inline-flex align-items-center justify-content-center rounded-circle"
                                                        onClick={() => setSidebarOpen(false)}
                                                        title="Hide sidebar"
                                                        aria-label="Hide sidebar"
                                                        style={{
                                                                width: 36, height: 36,
                                                                border: '1px solid rgba(0,0,0,.1)',
                                                                background: '#fff',
                                                                transition: `transform ${DUR}ms ${EASE}, box-shadow ${DUR}ms ${EASE}`,
                                                        }}
                                                        onMouseEnter={(e) => {
                                                                e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,.12)';
                                                                e.currentTarget.style.transform = 'translateX(0) scale(1.03)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                                e.currentTarget.style.boxShadow = 'none';
                                                                e.currentTarget.style.transform = 'none';
                                                        }}
                                                >
                                                        <i className="bi bi-chevron-left"></i>
                                                </button>
                                        </div>

                                        {/* Nav */}
                                        <nav className="nav flex-column p-3" style={{ gap: 6 }}>
                                                <AdminLink to="/admin/overview" icon="bi-speedometer2">Overview</AdminLink>
                                                <AdminLink to="/admin/floors" icon="bi-columns">Building</AdminLink>
                                                <AdminLink to="/admin/rooms" icon="bi-door-closed">Rooms</AdminLink>
                                                <AdminLink to="/admin/visualisation" icon="bi-bar-chart">Visualisation</AdminLink>
                                                <AdminLink to="/admin/requests" icon="bi-bell">Requests</AdminLink>
                                                <AdminLink to="/admin/settings" icon="bi-gear">Setting</AdminLink>
                                        </nav>

                                        <div className="text-secondary small px-3 pb-3 mt-auto">
                                                <span className="opacity-75">Room-Booking</span>
                                        </div>
                                </aside>

                                {/* ==== Main: no scroll here; child pages handle their own scrolling ==== */}
                                <main className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0, overflow: 'hidden' }}>
                                        {/* Optional sticky top area for page-level actions can go here */}
                                        <div className="flex-grow-1 d-flex flex-column" style={{ overflow: 'hidden' }}>
                                                {/* Outlet wrapper fills height & prevents outer scroll */}
                                                <div className="h-100" style={{ overflow: 'hidden' }}>
                                                        <Outlet />
                                                </div>
                                        </div>
                                </main>
                        </div>

                        {/* Floating reopen FAB */}
                        {!sidebarOpen && (
                                <button
                                        type="button"
                                        onClick={() => setSidebarOpen(true)}
                                        className="btn position-fixed d-flex align-items-center justify-content-center rounded-circle"
                                        title="Show sidebar"
                                        aria-label="Show sidebar"
                                        style={{
                                                top: 80,
                                                left: 12,
                                                width: 36,            // smaller
                                                height: 36,           // smaller
                                                zIndex: 1050,
                                                backgroundColor: COLORS.primary,
                                                borderColor: COLORS.primary,
                                                color: '#fff',
                                                opacity: 0.8,         // 80% opacity
                                                boxShadow: '0 8px 18px rgba(0,0,0,.16)',
                                                transition: `transform ${DUR}ms ${EASE}, box-shadow ${DUR}ms ${EASE}, opacity ${DUR}ms ${EASE}`,
                                        }}
                                        onMouseEnter={(e) => {
                                                e.currentTarget.style.opacity = '1';
                                                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,.22)';
                                                e.currentTarget.style.transform = 'translateY(-1px) scale(1.06)';
                                        }}
                                        onMouseLeave={(e) => {
                                                e.currentTarget.style.opacity = '0.8';
                                                e.currentTarget.style.boxShadow = '0 8px 18px rgba(117, 106, 106, 0.16)';
                                                e.currentTarget.style.transform = 'none';
                                        }}
                                >
                                        <i className="bi bi-layout-sidebar-inset"></i>
                                </button>
                        )}

                </div>
        );
}

function AdminLink({ to, icon, children }) {
        return (
                <NavLink
                        to={to}
                        className={({ isActive }) =>
                                'nav-link d-flex align-items-center px-3 py-2 rounded-3 ' + (isActive ? 'text-white shadow-sm' : '')
                        }
                        style={({ isActive }) => ({
                                color: isActive ? '#fff' : COLORS.primary,
                                backgroundColor: isActive ? COLORS.primary : 'transparent',
                                transition: `background-color ${DUR}ms ${EASE}, color ${DUR}ms ${EASE}, transform ${DUR}ms ${EASE}`,
                        })}
                        onMouseEnter={(e) => {
                                if (!e.currentTarget.classList.contains('text-white')) {
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.backgroundColor = 'rgba(39,36,70,.06)';
                                }
                        }}
                        onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'none';
                                if (!e.currentTarget.classList.contains('text-white')) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                }
                        }}
                >
                        <i className={`bi ${icon} me-2`}></i>
                        <span>{children}</span>
                </NavLink>
        );
}
