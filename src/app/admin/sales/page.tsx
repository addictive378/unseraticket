'use client';

import { useEffect, useState } from 'react';
import styles from '../admin.module.css';
import { Download, Check, X, Eye, Filter } from 'lucide-react';

export default function AdminSalesPage() {
    const [purchases, setPurchases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [proofModal, setProofModal] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectingId, setRejectingId] = useState<string | null>(null);

    const filtered = filter === 'ALL' ? purchases : purchases.filter(p => p.status === filter);

    useEffect(() => {
        fetchPurchases();
    }, []);

    const fetchPurchases = async () => {
        try {
            const res = await fetch('/api/admin/purchases');
            const data = await res.json();
            setPurchases(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        if (!confirm('Approve this payment? Ticket stock will be decremented.')) return;
        try {
            const res = await fetch(`/api/admin/purchases/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'approve' }),
            });
            if (res.ok) {
                fetchPurchases();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to approve');
            }
        } catch (error) {
            console.error('Approve error:', error);
        }
    };

    const handleReject = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/purchases/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reject', rejectedReason: rejectReason || 'Payment proof rejected' }),
            });
            if (res.ok) {
                setRejectingId(null);
                setRejectReason('');
                fetchPurchases();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to reject');
            }
        } catch (error) {
            console.error('Reject error:', error);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'CONFIRMED': return { background: 'rgba(16,185,129,0.1)', color: '#10b981' };
            case 'PENDING_PAYMENT': return { background: 'rgba(59,130,246,0.1)', color: '#3b82f6' };
            case 'PENDING_VALIDATION': return { background: 'rgba(245,158,11,0.1)', color: '#f59e0b' };
            case 'REJECTED': return { background: 'rgba(239,68,68,0.1)', color: '#ef4444' };
            case 'CANCELLED': return { background: 'rgba(107,114,128,0.1)', color: '#6b7280' };
            default: return {};
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PENDING_PAYMENT': return 'Menunggu Pembayaran';
            case 'PENDING_VALIDATION': return 'Menunggu Validasi';
            case 'CONFIRMED': return 'Terkonfirmasi';
            case 'REJECTED': return 'Ditolak';
            case 'CANCELLED': return 'Dibatalkan';
            default: return status;
        }
    };

    const handleExportCSV = () => {
        if (filtered.length === 0) return alert('Tidak ada data untuk diekspor');

        const headers = ['Tanggal', 'Pelanggan', 'Email', 'Acara', 'Tiket', 'Jumlah', 'Total Harga', 'Status'];
        const csvContent = [
            headers.join(','),
            ...filtered.map(p => [
                new Date(p.createdAt).toLocaleDateString('id-ID'),
                `"${p.buyerName || p.user?.name || '—'}"`,
                p.user?.email || '—',
                `"${p.ticket?.event?.name || '—'}"`,
                `"${p.ticket?.type || '—'}"`,
                p.quantity,
                p.totalPurchase,
                getStatusLabel(p.status)
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `penjualan-vibrant-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className={styles.loading}>Loading Sales Data...</div>;

    return (
        <div>
            <div className={styles.pageHeader}>
                <div>
                    <h1>Penjualan & Pembayaran</h1>
                    <p>Pantau penjualan tiket, validasi pembayaran, dan kelola transaksi.</p>
                </div>
                <button className="btn-primary" onClick={handleExportCSV}>
                    <Download size={18} /> EKSPOR CSV
                </button>
            </div>

            {/* Stats */}
            <div className={styles.statsGrid}>
                <div className={`${styles.statCard} glass`}>
                    <h4>Menunggu Validasi</h4>
                    <div className={styles.statValue} style={{ color: '#f59e0b' }}>
                        {purchases.filter(p => p.status === 'PENDING_VALIDATION').length}
                    </div>
                </div>
                <div className={`${styles.statCard} glass`}>
                    <h4>Terkonfirmasi</h4>
                    <div className={styles.statValue} style={{ color: '#10b981' }}>
                        {purchases.filter(p => p.status === 'CONFIRMED').length}
                    </div>
                </div>
                <div className={`${styles.statCard} glass`}>
                    <h4>Total Pendapatan</h4>
                    <div className={styles.statValue}>
                        Rp {purchases.filter(p => p.status === 'CONFIRMED').reduce((sum, p) => sum + p.totalPurchase, 0).toLocaleString('id-ID')}
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {['ALL', 'PENDING_VALIDATION', 'PENDING_PAYMENT', 'CONFIRMED', 'REJECTED'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 600,
                            background: filter === f ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                            color: filter === f ? 'white' : 'rgba(255,255,255,0.5)',
                            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                        }}
                    >
                        {f === 'ALL' ? 'All' : getStatusLabel(f)}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className={styles.tableContainer}>
                <table className={`${styles.table} glass`}>
                    <thead>
                        <tr>
                            <th className={styles.th}>Pelanggan</th>
                            <th className={styles.th}>Acara / Tiket</th>
                            <th className={styles.th}>Jml</th>
                            <th className={styles.th}>Total</th>
                            <th className={styles.th}>Status</th>
                            <th className={styles.th}>Bukti</th>
                            <th className={styles.th}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((p) => (
                            <tr key={p.id}>
                                <td className={styles.td}>
                                    <div style={{ fontWeight: 600 }}>{p.buyerName || p.user?.name || '—'}</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>{p.user?.email}</div>
                                </td>
                                <td className={styles.td}>
                                    <div>{p.ticket?.event?.name || '—'}</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>{p.ticket?.type}</div>
                                </td>
                                <td className={styles.td}>{p.quantity}</td>
                                <td className={styles.td}>Rp {p.totalPurchase.toLocaleString('id-ID')}</td>
                                <td className={styles.td}>
                                    <span className={styles.statusBadge} style={getStatusStyle(p.status)}>
                                        {getStatusLabel(p.status)}
                                    </span>
                                </td>
                                <td className={styles.td}>
                                    {p.paymentProof ? (
                                        <button
                                            className={styles.iconBtn}
                                            onClick={() => setProofModal(p.paymentProof)}
                                            title="Lihat Bukti"
                                            style={{ color: '#3b82f6' }}
                                        >
                                            <Eye size={16} />
                                        </button>
                                    ) : (
                                        <span style={{ fontSize: '0.8rem', opacity: 0.3 }}>—</span>
                                    )}
                                </td>
                                <td className={styles.td}>
                                    {p.status === 'PENDING_VALIDATION' && (
                                        <div className={styles.actions}>
                                            <button
                                                className={styles.iconBtn}
                                                onClick={() => handleApprove(p.id)}
                                                title="Setujui"
                                                style={{ color: '#10b981' }}
                                            >
                                                <Check size={18} />
                                            </button>
                                            <button
                                                className={styles.iconBtn}
                                                onClick={() => { setRejectingId(p.id); setRejectReason(''); }}
                                                title="Tolak"
                                                style={{ color: '#ef4444' }}
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    )}
                                    {p.status === 'CONFIRMED' && (
                                        <span style={{ fontSize: '0.75rem', color: '#10b981' }}>✓ Selesai</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={7} className={styles.td} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                                    Tidak ada data pembelian ditemukan
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Payment Proof Modal */}
            {proofModal && (
                <div className={styles.modalOverlay} onClick={() => setProofModal(null)}>
                    <div className={`${styles.modal} glass`} onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className={styles.modalHeader}>
                            <h2>Bukti Pembayaran</h2>
                            <button onClick={() => setProofModal(null)}><X size={24} /></button>
                        </div>
                        <img
                            src={proofModal}
                            alt="Payment Proof"
                            style={{ width: '100%', borderRadius: '12px', objectFit: 'contain', maxHeight: '70vh' }}
                        />
                    </div>
                </div>
            )}

            {/* Reject Reason Modal */}
            {rejectingId && (
                <div className={styles.modalOverlay}>
                    <div className={`${styles.modal} glass`} style={{ maxWidth: '450px' }}>
                        <div className={styles.modalHeader}>
                            <h2>Tolak Pembayaran</h2>
                            <button onClick={() => setRejectingId(null)}><X size={24} /></button>
                        </div>
                        <div className={styles.modalForm}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Alasan penolakan (opsional)</label>
                                <textarea
                                    className={styles.textarea}
                                    placeholder="misal: Bukti pembayaran tidak valid, jumlah transfer tidak sesuai..."
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    style={{ minHeight: '100px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    className="btn-primary"
                                    style={{ flex: 1, background: '#ef4444' }}
                                    onClick={() => handleReject(rejectingId)}
                                >
                                    TOLAK PEMBAYARAN
                                </button>
                                <button
                                    className="btn-outline"
                                    onClick={() => setRejectingId(null)}
                                >
                                    BATAL
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
