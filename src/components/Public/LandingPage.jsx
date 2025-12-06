import { Link } from 'react-router-dom';
import './PublicStyles.css';

export default function LandingPage() {
    return (
        <div>
            <section className="hero-section">
                <h1 className="hero-title">
                    The Purrfect Getaway<br />For Your Feline Friend
                </h1>
                <p className="hero-subtitle">
                    Professional care, cozy suites, and 24/7 monitoring.
                    Give your cat the vacation they deserve while you enjoy yours.
                </p>
                <div className="hero-actions">
                    <Link to="/book" className="btn-cta btn-primary-lg">
                        📅 Book a Visit
                    </Link>
                    <Link to="/login" className="btn-cta btn-secondary-lg">
                        👤 Staff Login
                    </Link>
                </div>
            </section>

            <section className="features-section">
                <div className="features-grid">
                    <div className="feature-card">
                        <span className="feature-icon">🏠</span>
                        <h3 className="feature-title">Private Suites</h3>
                        <p>Spacious, climate-controlled rooms with plenty of vertical space for climbing.</p>
                    </div>
                    <div className="feature-card">
                        <span className="feature-icon">📹</span>
                        <h3 className="feature-title">24/7 Monitoring</h3>
                        <p>Safety first. Our facility is monitored around the clock for your peace of mind.</p>
                    </div>
                    <div className="feature-card">
                        <span className="feature-icon">🧶</span>
                        <h3 className="feature-title">Daily Playtime</h3>
                        <p>Dedicated staff ensures your kitty gets plenty of love, attention, and exercise.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
