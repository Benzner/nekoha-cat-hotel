import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './LoginScreen.css';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await login(email, password);

        if (!result.success) {
            setError(result.error); // Show error from Supabase
            // setTimeout(() => setError(''), 3000); // Keep error visible
            setLoading(false);
        } else {
            // Success handles redirection via AuthContext/App state
        }
    };

    return (
        <div className="login-screen">
            <div className="login-card">
                <div className="login-header">
                    <img src="/logo.png" alt="Nekoha Cat Hotel Logo" className="login-logo-img" />
                    <h1 className="login-title">NekohaCatHotel</h1>
                    <p className="login-subtitle">Room Reservation Management</p>
                </div>

                {error &&
                    <div className={`error-message ${error ? 'show' : ''}`}>
                        {error}
                    </div>
                }

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            className="form-input"
                            placeholder="Enter email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            className="form-input"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>

                    {/* Helper text for user since we switched to Supabase */}
                    <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.8rem', color: '#666' }}>
                        <p>Use your Supabase project credentials.</p>
                    </div>
                </form>
            </div>
        </div>
    );
}
