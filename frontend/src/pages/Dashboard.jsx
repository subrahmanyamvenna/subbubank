import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useToast } from '../components/Toast';
import { formatCurrency, formatDate, getGreeting } from '../utils';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const user = api.getUser();
    const showToast = useToast();

    useEffect(() => {
        api.getDashboardStats()
            .then(setStats)
            .catch(err => showToast(err.detail || 'Failed to load dashboard', 'error'));
    }, []);

    if (!stats) return <div className="loading-overlay"><div className="spinner"></div></div>;

    return (
        <>
            <div className="page-header">
                <h1>{getGreeting()}, {user.first_name || user.username}! 👋</h1>
                <p>
                    {user.role === 'superadmin' ? "Here's your system overview"
                        : user.role === 'rm' ? "Here's your customer portfolio overview"
                            : 'Welcome to your banking dashboard'}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {user.role === 'superadmin' && <AdminStats stats={stats} />}
                {user.role === 'rm' && <RMStats stats={stats} />}
                {user.role === 'customer' && <CustomerStats stats={stats} />}
            </div>

            {/* Quick Actions */}
            {user.role !== 'customer' && (
                <div className="glass-card">
                    <div className="card-header"><div className="card-title">⚡ Quick Actions</div></div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {user.role === 'superadmin' && (
                            <>
                                <Link to="/manage-users" className="btn btn-primary btn-sm">➕ Add Relationship Manager</Link>
                                <Link to="/all-customers" className="btn btn-secondary btn-sm">👥 View All Customers</Link>
                            </>
                        )}
                        {user.role === 'rm' && (
                            <Link to="/manage-users" className="btn btn-primary btn-sm">➕ Add New Customer</Link>
                        )}
                    </div>
                </div>
            )}

            {/* Customer: Recent Transactions */}
            {user.role === 'customer' && stats.recent_transactions?.length > 0 && (
                <div className="glass-card">
                    <div className="card-header">
                        <div className="card-title">📜 Recent Transactions</div>
                        <Link to="/statements" style={{ fontSize: 13 }}>View All →</Link>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr><th>Date</th><th>Description</th><th>Type</th><th>Amount</th></tr>
                        </thead>
                        <tbody>
                            {stats.recent_transactions.map(t => (
                                <tr key={t.id}>
                                    <td>{formatDate(t.timestamp)}</td>
                                    <td>{t.description}</td>
                                    <td><span className={`badge badge-${t.transaction_type}`}>{t.transaction_type}</span></td>
                                    <td className={`amount ${t.transaction_type === 'credit' ? 'amount-credit' : 'amount-debit'}`}>
                                        {t.transaction_type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}

function AdminStats({ stats }) {
    return (
        <>
            <StatCard icon="👔" value={stats.total_rms} label="Relationship Managers" />
            <StatCard icon="👥" value={stats.total_customers} label="Total Customers" teal />
            <StatCard icon="🏦" value={stats.total_accounts} label="Total Accounts" />
            <StatCard icon="💰" value={formatCurrency(stats.total_balance)} label="Total Deposits" teal />
        </>
    );
}

function RMStats({ stats }) {
    return (
        <>
            <StatCard icon="👤" value={stats.total_customers} label="My Customers" />
            <StatCard icon="🏦" value={stats.total_accounts} label="Total Accounts" teal />
            <StatCard icon="💰" value={formatCurrency(stats.total_balance)} label="AUM" />
            <StatCard icon="📋" value={stats.pending_services} label="Pending Requests" teal />
        </>
    );
}

function CustomerStats({ stats }) {
    return (
        <>
            <StatCard icon="🏦" value={stats.total_accounts} label="Active Accounts" />
            <StatCard icon="💰" value={formatCurrency(stats.total_balance)} label="Total Balance" teal />
            <StatCard icon="📋" value={stats.pending_services} label="Pending Requests" />
        </>
    );
}

function StatCard({ icon, value, label, teal }) {
    return (
        <div className={`stat-card ${teal ? 'teal' : ''}`}>
            <div className="stat-icon">{icon}</div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
        </div>
    );
}
