import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import Dashboard from '../Dashboard/Dashboard';
import ReservationList from '../Reservations/ReservationList';
import HistoryList from '../History/HistoryList';
import LanguageSwitcher from '../Common/LanguageSwitcher';

function MainLayout() {
    const { logout, user } = useAuth();
    const { t } = useTranslation();
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
        if (window.confirm(t('common.confirm_logout'))) {
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
            case 'dashboard': return t('dashboard.title');
            case 'reservations': return t('sidebar.reservations');
            case 'history': return t('sidebar.history');
            default: return t('dashboard.title');
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
                    <span className="app-brand">Nekoha Cat Hotel</span>
                </div>

                <nav className="sidebar-nav">
                    <button
                        className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => handleNavClick('dashboard')}
                    >
                        <span className="nav-icon">📊</span>
                        {t('sidebar.dashboard')}
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'reservations' ? 'active' : ''}`}
                        onClick={() => handleNavClick('reservations')}
                    >
                        <span className="nav-icon">📅</span>
                        {t('sidebar.reservations')}
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => handleNavClick('history')}
                    >
                        <span className="nav-icon">📜</span>
                        {t('sidebar.history')}
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <div style={{ marginBottom: '1rem', padding: '0 0.5rem' }}>
                        <LanguageSwitcher />
                    </div>

                    <div className="user-profile-mini" style={{ marginBottom: '1rem', padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {user?.username?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>{user?.username || 'Admin'}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('sidebar.manager')}</span>
                        </div>
                    </div>
                    <button className="nav-item" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
                        <span className="nav-icon">🚪</span>
                        {t('sidebar.logout')}
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
                                display: 'none',
                            }}
                        >
                            Menu
                        </button>
                        <div>
                            <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>{getTitle()}</h1>
                            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{t('app.welcome')} {user?.username || 'Manager'}</p>
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
