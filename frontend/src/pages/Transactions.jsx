import { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../components/Toast';
import { formatCurrency, formatDateTime } from '../utils';

export default function Transactions() {
    const [tab, setTab] = useState('deposit');
    const [accounts, setAccounts] = useState(null);
    const [selectedAccount, setSelectedAccount] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [recentTxns, setRecentTxns] = useState([]);
    const [successInfo, setSuccessInfo] = useState(null);
    const showToast = useToast();

    useEffect(() => {
        api.getAccounts()
            .then(data => {
                setAccounts(data);
                if (data.length > 0) setSelectedAccount(data[0].id);
            })
            .catch(err => showToast(err.detail || 'Failed to load accounts', 'error'));

        api.getTransactions()
            .then(data => setRecentTxns(Array.isArray(data) ? data.slice(0, 5) : []))
            .catch(() => {});
    }, []);

    const resetForm = () => {
        setAmount('');
        setDescription('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedAccount || !amount) return;

        setLoading(true);
        setSuccessInfo(null);
        try {
            const payload = {
                account_id: parseInt(selectedAccount),
                amount: parseFloat(amount),
                description: description || (tab === 'deposit' ? 'Cash Deposit' : 'Cash Withdrawal'),
            };
            const res = tab === 'deposit'
                ? await api.deposit(payload)
                : await api.withdraw(payload);

            showToast(res.detail, 'success');
            setSuccessInfo({
                type: tab,
                amount: payload.amount,
                newBalance: res.new_balance,
                txn: res.transaction,
            });
            resetForm();

            // Refresh accounts and transactions
            const [updatedAccounts, updatedTxns] = await Promise.all([
                api.getAccounts(),
                api.getTransactions(),
            ]);
            setAccounts(updatedAccounts);
            setRecentTxns(Array.isArray(updatedTxns) ? updatedTxns.slice(0, 5) : []);
        } catch (err) {
            showToast(err.detail || `${tab} failed`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const selectedAccObj = accounts?.find(a => a.id === parseInt(selectedAccount));

    if (!accounts) return <div className="loading-overlay"><div className="spinner"></div></div>;

    return (
        <>
            <div className="page-header">
                <h1>💸 Transact</h1>
                <p>Deposit or withdraw funds from your accounts</p>
            </div>

            {/* Tab Switcher */}
            <div className="txn-tabs">
                <button
                    className={`txn-tab ${tab === 'deposit' ? 'active deposit' : ''}`}
                    onClick={() => { setTab('deposit'); setSuccessInfo(null); }}
                >
                    <span className="txn-tab-icon">📥</span>
                    Deposit
                </button>
                <button
                    className={`txn-tab ${tab === 'withdraw' ? 'active withdraw' : ''}`}
                    onClick={() => { setTab('withdraw'); setSuccessInfo(null); }}
                >
                    <span className="txn-tab-icon">📤</span>
                    Withdraw
                </button>
            </div>

            <div className="txn-layout">
                {/* Form Card */}
                <div className={`txn-form-card ${tab}`}>
                    <div className="txn-form-header">
                        <h2>{tab === 'deposit' ? '📥 Deposit Funds' : '📤 Withdraw Funds'}</h2>
                        <p>{tab === 'deposit'
                            ? 'Add money to your account instantly'
                            : 'Withdraw money from your account'}</p>
                    </div>

                    {selectedAccObj && (
                        <div className="txn-balance-preview">
                            <span className="txn-balance-label">Current Balance</span>
                            <span className="txn-balance-value">{formatCurrency(selectedAccObj.balance)}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Select Account</label>
                            <select
                                value={selectedAccount}
                                onChange={e => setSelectedAccount(e.target.value)}
                                required
                            >
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.account_number} — {acc.account_type_display} ({formatCurrency(acc.balance)})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Amount (₹)</label>
                            <input
                                type="number"
                                min="1"
                                step="0.01"
                                placeholder="Enter amount"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Description (Optional)</label>
                            <input
                                type="text"
                                placeholder={tab === 'deposit' ? 'e.g. Salary credit' : 'e.g. ATM withdrawal'}
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                maxLength={255}
                            />
                        </div>

                        <button
                            type="submit"
                            className={`btn btn-primary txn-submit ${tab}`}
                            disabled={loading || !amount || !selectedAccount}
                        >
                            {loading
                                ? <><div className="spinner" style={{ width: 18, height: 18, margin: 0, borderWidth: 2 }}></div> Processing...</>
                                : tab === 'deposit' ? '📥 Deposit Now' : '📤 Withdraw Now'}
                        </button>
                    </form>
                </div>

                {/* Right Column: Success + Recent */}
                <div className="txn-right-col">
                    {/* Success Animation */}
                    {successInfo && (
                        <div className={`txn-success-card ${successInfo.type}`}>
                            <div className="txn-success-icon">
                                {successInfo.type === 'deposit' ? '✅' : '💰'}
                            </div>
                            <h3>{successInfo.type === 'deposit' ? 'Deposit Successful!' : 'Withdrawal Successful!'}</h3>
                            <div className="txn-success-amount">
                                {successInfo.type === 'deposit' ? '+' : '-'}{formatCurrency(successInfo.amount)}
                            </div>
                            <div className="txn-success-balance">
                                New Balance: <strong>{formatCurrency(successInfo.newBalance)}</strong>
                            </div>
                            {successInfo.txn && (
                                <div className="txn-success-ref">
                                    Ref: {successInfo.txn.reference_id}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Recent Transactions */}
                    <div className="glass-card">
                        <div className="card-header">
                            <div className="card-title">📜 Recent Transactions</div>
                        </div>
                        {recentTxns.length === 0 ? (
                            <div className="empty-state" style={{ padding: '24px 0' }}>
                                <div className="empty-icon">📭</div>
                                <p>No transactions yet</p>
                            </div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Type</th>
                                        <th>Amount</th>
                                        <th>Description</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentTxns.map(txn => (
                                        <tr key={txn.id}>
                                            <td>
                                                <span className={`badge badge-${txn.transaction_type}`}>
                                                    {txn.transaction_type === 'credit' ? '📥 Credit' : '📤 Debit'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`amount amount-${txn.transaction_type}`}>
                                                    {txn.transaction_type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                                                </span>
                                            </td>
                                            <td>{txn.description}</td>
                                            <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDateTime(txn.timestamp)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
