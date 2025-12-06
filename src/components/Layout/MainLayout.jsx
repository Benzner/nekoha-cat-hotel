import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Dashboard from '../Dashboard/Dashboard';
import ReservationList from '../Reservations/ReservationList';
import HistoryList from '../History/HistoryList';

function MainLayout() {
    const { logout, user } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    // Handle scroll effect for header
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            logout();
        }
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    const handleNavClick = (tab) => {
        setActiveTab(tab);
        if (window.innerWidth < 768) {
            closeSidebar();
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <Dashboard />;
            case 'reservations':
                return <ReservationList />;
            case 'history':
                return <HistoryList />;
            default:
                return <Dashboard />;
        }
    };

    const getTitle = () => {
        switch (activeTab) {
            case 'dashboard': return 'Dashboard';
            case 'reservations': return 'Reservations';
            case 'history': return 'History';
            default: return 'Dashboard';
        }
    };

    return (
        <div className="app">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={closeSidebar}
                ></div>
            )}

            {/* Sidebar */}
            <aside className={`app-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <img src="/logo.png" alt="Nekoha Logo" className="app-logo-img" />
                    <span className="app-brand">Nekoha</span>
                </div>

                <nav className="sidebar-nav">
                    <button
                        className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => handleNavClick('dashboard')}
                    >
                        <span className="nav-icon">📊</span>
                        Dashboard
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'reservations' ? 'active' : ''}`}
                        onClick={() => handleNavClick('reservations')}
                    >
                        <span className="nav-icon">📅</span>
                        Reservations
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => handleNavClick('history')}
                    >
                        <span className="nav-icon">📜</span>
                        History
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-profile-mini" style={{ marginBottom: '1rem', padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {user?.username?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>{user?.username || 'Admin'}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Manager</span>
                        </div>
                    </div>
                    <button className="nav-item" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
                        <span className="nav-icon">🚪</span>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {/* Mobile Header */}
                <header className="mobile-header" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '2rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid var(--border-light)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                            className="hamburger-menu-btn"
                            onClick={toggleSidebar}
                            aria-label="Toggle menu"
                            style={{
                                display: 'none', // Hidden by default, shown in media query via CSS if needed, but we used fixed button in CSS. 
                                // Actually, let's use the CSS class we defined for the fixed button or integrate it here.
                                // The CSS defines .hamburger-menu as fixed. Let's keep that for now or adjust.
                                // If we want a proper header bar, we should probably remove the fixed hamburger and put it here.
                                // But for now, let's stick to the CSS plan which had a fixed hamburger.
                                // Wait, the CSS has .hamburger-menu as fixed.
                            }}
                        >
                            Menu
                        </button>
                        <div>
                            <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>{getTitle()}</h1>
                            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Welcome back, {user?.username || 'Manager'}</p>
                        </div>
                    </div>

                    <div className="header-actions" style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn btn-outline" style={{ padding: '0.5rem', borderRadius: '50%', width: '40px', height: '40px' }}>
                            🔔
                        </button>
                    </div>
                </header>

                {/* Fixed Hamburger for Mobile (matches CSS) */}
                <button
                    className="hamburger-menu"
                    onClick={toggleSidebar}
                    aria-label="Toggle menu"
                    style={{ display: window.innerWidth > 768 ? 'none' : 'flex' }} // Simple inline check, better handled via CSS media query
                >
                    <span className={`hamburger-line ${isSidebarOpen ? 'open' : ''}`}></span>
                    <span className={`hamburger-line ${isSidebarOpen ? 'open' : ''}`}></span>
                    <span className={`hamburger-line ${isSidebarOpen ? 'open' : ''}`}></span>
                </button>

                <div className="content-area animate-in">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}

export default MainLayout;
