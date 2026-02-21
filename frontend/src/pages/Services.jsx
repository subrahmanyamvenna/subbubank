import { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../components/Toast';
import { formatDate } from '../utils';

const SERVICE_NAMES = {
    cheque_book: 'New Cheque Book', address_change: 'Address Change',
    loan_enquiry: 'Loan Enquiry', card_block: 'Block Debit Card',
    fd_opening: 'Fixed Deposit Opening', statement_request: 'Physical Statement',
};

const SERVICES = [
    { type: 'cheque_book', icon: '📝', title: 'New Cheque Book', desc: 'Request a fresh cheque book for your savings or current account.' },
    { type: 'address_change', icon: '📍', title: 'Address Change', desc: 'Update your registered communication address on file.' },
    { type: 'loan_enquiry', icon: '💸', title: 'Loan Enquiry', desc: 'Get details about personal, home, or vehicle loan options.' },
    { type: 'card_block', icon: '🔒', title: 'Block Debit Card', desc: 'Instantly block your debit card in case of loss or theft.' },
    { type: 'fd_opening', icon: '🏛️', title: 'Fixed Deposit', desc: 'Open a new fixed deposit and earn higher interest rates.' },
    { type: 'statement_request', icon: '📄', title: 'Physical Statement', desc: 'Request a printed account statement by mail to your address.' },
];

export default function Services() {
    const [requests, setRequests] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState('');
    const [remarks, setRemarks] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const showToast = useToast();

    const loadRequests = () => {
        api.getServices().then(setRequests).catch(err => showToast(err.detail || 'Failed to load', 'error'));
    };

    useEffect(() => { loadRequests(); }, []);

    const openModal = (type) => {
        setSelectedService(type);
        setRemarks('');
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await api.createService({ service_type: selectedService, remarks });
            setModalOpen(false);
            showToast(`${SERVICE_NAMES[selectedService]} request submitted successfully!`);
            loadRequests();
        } catch (err) {
            showToast(err.detail || 'Failed to submit request', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className="page-header">
                <h1>🛎️ Banking Services</h1>
                <p>Apply for banking services and track your requests</p>
            </div>

            <div className="glass-card">
                <div className="card-header"><div className="card-title">✨ Available Services</div></div>
                <div className="services-grid">
                    {SERVICES.map(s => (
                        <div className="service-card" key={s.type} onClick={() => openModal(s.type)}>
                            <div className="service-icon">{s.icon}</div>
                            <h3>{s.title}</h3>
                            <p>{s.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="glass-card">
                <div className="card-header"><div className="card-title">📋 My Service Requests</div></div>
                {!requests ? (
                    <div className="loading-overlay"><div className="spinner"></div></div>
                ) : requests.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📭</div>
                        <h3>No Requests Yet</h3>
                        <p>Click on any service above to submit a request.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead><tr><th>Date</th><th>Service</th><th>Status</th><th>Remarks</th></tr></thead>
                            <tbody>
                                {requests.map(r => (
                                    <tr key={r.id}>
                                        <td>{formatDate(r.created_at)}</td>
                                        <td>{r.service_type_display}</td>
                                        <td><span className={`badge badge-${r.status}`}>{r.status_display}</span></td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{r.remarks || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Request: {SERVICE_NAMES[selectedService]}</h2>
                            <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
                            Would you like to submit a "{SERVICE_NAMES[selectedService]}" request? Our team will process it within 2-3 business days.
                        </p>
                        <div className="form-group">
                            <label>Additional Remarks (Optional)</label>
                            <textarea rows={3} placeholder="Any additional details..." value={remarks} onChange={e => setRemarks(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)}>Cancel</button>
                            <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={submitting}>
                                {submitting ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
