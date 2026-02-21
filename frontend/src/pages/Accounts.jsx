import { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../components/Toast';
import { formatCurrency, formatDate } from '../utils';

export default function Accounts() {
    const [accounts, setAccounts] = useState(null);
    const showToast = useToast();

    useEffect(() => {
        api.getAccounts()
            .then(setAccounts)
            .catch(err => showToast(err.detail || 'Failed to load accounts', 'error'));
    }, []);

    if (!accounts) return <div className="loading-overlay"><div className="spinner"></div></div>;

    return (
        <>
            <div className="page-header">
                <h1>🏦 My Accounts</h1>
                <p>View your bank accounts and balances</p>
            </div>

            {accounts.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🏦</div>
                    <h3>No Accounts Found</h3>
                    <p>You don't have any bank accounts yet.</p>
                </div>
            ) : (
                <div className="accounts-grid">
                    {accounts.map(acc => (
                        <div className="account-card" key={acc.id}>
                            <div className="acc-number">{acc.account_number}</div>
                            <div className="acc-balance">{formatCurrency(acc.balance)}</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Available Balance</div>
                            <div className="acc-type">
                                <span className={`badge badge-${acc.account_type}`}>{acc.account_type_display}</span>
                                {acc.is_active
                                    ? <span className="badge badge-completed" style={{ marginLeft: 6 }}>Active</span>
                                    : <span className="badge badge-rejected" style={{ marginLeft: 6 }}>Inactive</span>}
                            </div>
                            <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                                Opened: {formatDate(acc.created_at)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
