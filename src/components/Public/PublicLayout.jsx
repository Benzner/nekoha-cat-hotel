import { Link, Outlet } from 'react-router-dom';
import './PublicStyles.css';

export default function PublicLayout() {
    return (
        <div className="public-layout">
            <header className="public-header">
                <Link to="/" className="brand">
                    <img src="/logo.png" alt="Logo" width="40" height="40" />
                    <span className="brand-text">Nekoha Cat Hotel</span>
                </Link>
                <nav className="public-nav">
                    <Link to="/login" className="nav-link">Staff Login</Link>
                    <Link to="/book" className="btn-book">Book Now</Link>
                </nav>
            </header>

            <main style={{ flex: 1 }}>
                <Outlet />
            </main>

            <footer style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                © {new Date().getFullYear()} Nekoha Cat Hotel. All rights reserved.
            </footer>
        </div>
    );
}
