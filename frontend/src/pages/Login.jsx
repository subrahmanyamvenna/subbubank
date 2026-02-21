import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    if (api.isLoggedIn()) return <Navigate to="/dashboard" replace />;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.login(username.trim(), password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.detail || 'Invalid username or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="bg-animation"></div>
            <div className="login-container">
                <div className="login-card">
                    <div className="login-logo">
                        <div className="bank-icon">🏦</div>
                        <h1>Subbu Bank</h1>
                        <p>Secure Internet Banking</p>
                    </div>

                    {error && <div className="login-error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input
                                id="username" type="text" placeholder="Enter your username"
                                value={username} onChange={e => setUsername(e.target.value)} required autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                id="password" type="password" placeholder="Enter your password"
                                value={password} onChange={e => setPassword(e.target.value)} required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div style={{ marginTop: 24, textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Demo Credentials</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4 }}>
                            Admin: <code style={{ color: 'var(--gold)' }}>admin / admin123</code><br />
                            RM: <code style={{ color: 'var(--teal)' }}>rm_priya / rm123</code><br />
                            Customer: <code style={{ color: 'var(--green)' }}>cust_ravi / cust123</code>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
