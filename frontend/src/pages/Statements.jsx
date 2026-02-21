import { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../components/Toast';
import { formatCurrency, formatDateTime } from '../utils';

export default function Statements() {
    const [txns, setTxns] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [filterType, setFilterType] = useState('');
    const [filterAccount, setFilterAccount] = useState('');
    const showToast = useToast();

    useEffect(() => {
        api.getAccounts().then(setAccounts).catch(() => { });
        loadTransactions();
    }, []);

    const loadTransactions = (type, account) => {
        const params = {};
        const t = type ?? filterType;
        const a = account ?? filterAccount;
        if (t) params.type = t;
        if (a) params.account = a;
        setTxns(null);
        api.getTransactions(params)
            .then(setTxns)
            .catch(err => showToast(err.detail || 'Failed to load transactions', 'error'));
    };

    return (
        <>
            <div className="page-header">
                <h1>📜 Account Statements</h1>
                <p>View your complete transaction history</p>
            </div>

            <div className="glass-card">
                <div className="card-header"><div className="card-title">🔍 Filter Transactions</div></div>
                <div className="filters-bar">
                    <select value={filterType} onChange={e => setFilterType(e.target.value)}>
                        <option value="">All Types</option>
                        <option value="credit">Credits Only</option>
                        <option value="debit">Debits Only</option>
                    </select>
                    <select value={filterAccount} onChange={e => setFilterAccount(e.target.value)}>
                        <option value="">All Accounts</option>
                        {accounts.map(a => (
                            <option key={a.id} value={a.id}>{a.account_number} ({a.account_type_display})</option>
                        ))}
                    </select>
                    <button className="btn btn-primary btn-sm" onClick={() => loadTransactions()}>Apply</button>
                </div>
            </div>

            <div className="glass-card">
                <div className="card-header">
                    <div className="card-title">💳 Transactions</div>
                    {txns && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{txns.length} transactions</span>}
                </div>

                {!txns ? (
                    <div className="loading-overlay"><div className="spinner"></div></div>
                ) : txns.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📭</div>
                        <h3>No Transactions Found</h3>
                        <p>No transactions match your current filters.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date & Time</th>
                                    <th>Reference</th>
                                    <th>Description</th>
                                    <th>Account</th>
                                    <th>Type</th>
                                    <th style={{ textAlign: 'right' }}>Amount</th>
                                    <th style={{ textAlign: 'right' }}>Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {txns.map(t => (
                                    <tr key={t.id}>
                                        <td>{formatDateTime(t.timestamp)}</td>
                                        <td><code style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.reference_id}</code></td>
                                        <td>{t.description}</td>
                                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.account_number}</td>
                                        <td><span className={`badge badge-${t.transaction_type}`}>{t.transaction_type}</span></td>
                                        <td className={`amount ${t.transaction_type === 'credit' ? 'amount-credit' : 'amount-debit'}`} style={{ textAlign: 'right' }}>
                                            {t.transaction_type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                                        </td>
                                        <td className="amount" style={{ textAlign: 'right' }}>{formatCurrency(t.balance_after)}</td>
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
