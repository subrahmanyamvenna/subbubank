import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../api';
import { useToast } from '../components/Toast';
import { formatDate } from '../utils';

export default function AllCustomers() {
    const user = api.getUser();
    const [customers, setCustomers] = useState(null);
    const showToast = useToast();

    if (user.role !== 'superadmin') return <Navigate to="/dashboard" replace />;

    useEffect(() => {
        api.getAllCustomers()
            .then(setCustomers)
            .catch(err => showToast(err.detail || 'Failed to load customers', 'error'));
    }, []);

    return (
        <>
            <div className="page-header">
                <h1>👥 All Customers</h1>
                <p>View all registered customers across all relationship managers</p>
            </div>

            <div className="glass-card">
                <div className="card-header">
                    <div className="card-title">👥 Customer Directory</div>
                    {customers && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{customers.length} customers</span>}
                </div>

                {!customers ? (
                    <div className="loading-overlay"><div className="spinner"></div></div>
                ) : customers.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">👥</div>
                        <h3>No Customers</h3>
                        <p>No customers have been created yet.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr><th>Name</th><th>Username</th><th>Email</th><th>Phone</th><th>Address</th><th>Status</th><th>Joined</th></tr>
                            </thead>
                            <tbody>
                                {customers.map(c => (
                                    <tr key={c.id}>
                                        <td style={{ fontWeight: 600 }}>{c.full_name}</td>
                                        <td><code style={{ color: 'var(--teal)' }}>{c.username}</code></td>
                                        <td>{c.email || '—'}</td>
                                        <td>{c.phone || '—'}</td>
                                        <td style={{ maxWidth: 200, color: 'var(--text-muted)', fontSize: 13 }}>{c.address || '—'}</td>
                                        <td>{c.is_active ? <span className="badge badge-completed">Active</span> : <span className="badge badge-rejected">Inactive</span>}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{formatDate(c.date_joined)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
