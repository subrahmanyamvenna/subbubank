import { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../components/Toast';
import { formatDate } from '../utils';

export default function ManageUsers() {
    const user = api.getUser();
    const isSuperAdmin = user.role === 'superadmin';
    const [users, setUsers] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ first_name: '', last_name: '', username: '', email: '', phone: '', password: '', address: '' });
    const showToast = useToast();

    const loadUsers = () => {
        const fetcher = isSuperAdmin ? api.getManagers() : api.getCustomers();
        fetcher.then(setUsers).catch(err => showToast(err.detail || 'Failed to load', 'error'));
    };

    useEffect(() => { loadUsers(); }, []);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            if (isSuperAdmin) {
                await api.createManager(form);
                showToast('Relationship Manager created successfully!');
            } else {
                await api.createCustomer(form);
                showToast('Customer created successfully! A savings account was auto-created.');
            }
            setModalOpen(false);
            setForm({ first_name: '', last_name: '', username: '', email: '', phone: '', password: '', address: '' });
            loadUsers();
        } catch (err) {
            const msg = err.username?.[0] || err.email?.[0] || err.detail || 'Failed to create user';
            showToast(msg, 'error');
        } finally {
            setCreating(false);
        }
    };

    const label = isSuperAdmin ? 'Relationship Manager' : 'Customer';

    return (
        <>
            <div className="page-header">
                <h1>{isSuperAdmin ? '👔 Manage Relationship Managers' : '👤 My Customers'}</h1>
                <p>{isSuperAdmin ? 'Create and manage relationship managers' : 'Manage your assigned customers'}</p>
            </div>

            <div className="glass-card">
                <div className="card-header">
                    <div className="card-title">{isSuperAdmin ? '👔 Relationship Managers' : '👤 Customers'}</div>
                    <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
                        ➕ Add {label}
                    </button>
                </div>

                {!users ? (
                    <div className="loading-overlay"><div className="spinner"></div></div>
                ) : users.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">{isSuperAdmin ? '👔' : '👤'}</div>
                        <h3>No {label}s Yet</h3>
                        <p>Click the button above to add your first {label.toLowerCase()}.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr><th>Name</th><th>Username</th><th>Email</th><th>Phone</th><th>Status</th><th>Joined</th></tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                                        <td><code style={{ color: 'var(--teal)' }}>{u.username}</code></td>
                                        <td>{u.email || '—'}</td>
                                        <td>{u.phone || '—'}</td>
                                        <td>{u.is_active ? <span className="badge badge-completed">Active</span> : <span className="badge badge-rejected">Inactive</span>}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{formatDate(u.date_joined)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {modalOpen && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create {label}</h2>
                            <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>First Name</label>
                                    <input name="first_name" value={form.first_name} onChange={handleChange} required placeholder="First name" />
                                </div>
                                <div className="form-group">
                                    <label>Last Name</label>
                                    <input name="last_name" value={form.last_name} onChange={handleChange} required placeholder="Last name" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Username</label>
                                <input name="username" value={form.username} onChange={handleChange} required placeholder="Login username" />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="Email address" />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="Phone number" />
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <input name="password" type="password" value={form.password} onChange={handleChange} required placeholder="Set password" minLength={4} />
                            </div>
                            {!isSuperAdmin && (
                                <div className="form-group">
                                    <label>Address</label>
                                    <textarea name="address" rows={2} value={form.address} onChange={handleChange} placeholder="Full address" />
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary btn-sm" disabled={creating}>
                                    {creating ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
