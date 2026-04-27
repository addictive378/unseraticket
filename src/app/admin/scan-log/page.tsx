'use client';

import { useEffect, useState } from 'react';
import styles from '../admin.module.css';
import { ClipboardList, Search, Calendar, User, Ticket, Download } from 'lucide-react';

export default function ScanLogPage() {
    const [scans, setScans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [eventFilter, setEventFilter] = useState('ALL');

    const handleExportCSV = () => {
        if (filtered.length === 0) return alert('Tidak ada data untuk diekspor');

        const headers = ['Waktu Scan', 'ID Tiket', 'Pemegang', 'Email', 'Acara', 'Tipe Tiket'];
        const csvContent = [
            headers.join(','),
            ...filtered.map(s => [
                new Date(s.usedAt).toLocaleString('id-ID'),
                s.id,
                `"${s.holderName || '—'}"`,
                s.user?.email || '—',
                `"${s.purchase?.ticket?.event?.name || '—'}"`,
                `"${s.purchase?.ticket?.type || '—'}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `log-scan-vibrant-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        fetch('/api/admin/scan')
            .then(res => res.json())
            .then(data => {
                setScans(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    // Get unique events for filter
    const events = [...new Set(scans.map(s => s.purchase?.ticket?.event?.name).filter(Boolean))];

    const filtered = scans.filter(s => {
        const matchesSearch = !search ||
            s.holderName?.toLowerCase().includes(search.toLowerCase()) ||
            s.id?.toLowerCase().includes(search.toLowerCase()) ||
            s.user?.name?.toLowerCase().includes(search.toLowerCase());
        const matchesEvent = eventFilter === 'ALL' || s.purchase?.ticket?.event?.name === eventFilter;
        return matchesSearch && matchesEvent;
    });

    if (loading) return <div className={styles.loading}>Memuat data scan...</div>;

    return (
        <div>
            <div className={styles.pageHeader}>
                <div>
                    <h1>Log Scan</h1>
                    <p>Riwayat tiket yang sudah di-scan dan masuk ke acara.</p>
                </div>
                <button className="btn-primary" onClick={handleExportCSV}>
                    <Download size={18} /> EKSPOR CSV
                </button>
            </div>

            {/* Stats */}
            <div className={styles.statsGrid}>
                <div className={`${styles.statCard} glass`}>
                    <h4>Total Scan</h4>
                    <div className={styles.statValue} style={{ color: 'var(--success)' }}>{scans.length}</div>
                </div>
                <div className={`${styles.statCard} glass`}>
                    <h4>Acara</h4>
                    <div className={styles.statValue}>{events.length}</div>
                </div>
                <div className={`${styles.statCard} glass`}>
                    <h4>Hari Ini</h4>
                    <div className={styles.statValue} style={{ color: 'var(--primary)' }}>
                        {scans.filter(s => {
                            const today = new Date();
                            const scanDate = new Date(s.usedAt);
                            return scanDate.toDateString() === today.toDateString();
                        }).length}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                    <input
                        type="text"
                        placeholder="Cari nama atau ID tiket..."
                        className={styles.input}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: '36px', width: '100%' }}
                    />
                </div>
                <select
                    className={styles.input}
                    value={eventFilter}
                    onChange={(e) => setEventFilter(e.target.value)}
                    style={{ width: 'auto', minWidth: '150px' }}
                >
                    <option value="ALL">Semua Acara</option>
                    {events.map(event => (
                        <option key={event} value={event}>{event}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className={styles.tableContainer}>
                <table className={`${styles.table} glass`}>
                    <thead>
                        <tr>
                            <th className={styles.th}>ID Tiket</th>
                            <th className={styles.th}>Pemegang</th>
                            <th className={styles.th}>Acara</th>
                            <th className={styles.th}>Tipe</th>
                            <th className={styles.th}>Waktu Scan</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((scan) => (
                            <tr key={scan.id}>
                                <td className={styles.td}>
                                    <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--primary)' }}>
                                        {scan.id}
                                    </span>
                                </td>
                                <td className={styles.td}>
                                    <div style={{ fontWeight: 600 }}>{scan.holderName}</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>{scan.user?.email}</div>
                                </td>
                                <td className={styles.td}>{scan.purchase?.ticket?.event?.name || '—'}</td>
                                <td className={styles.td}>
                                    <span className={styles.statusBadge} style={{ background: 'rgba(250, 222, 91, 0.1)', color: 'var(--primary)' }}>
                                        {scan.purchase?.ticket?.type || '—'}
                                    </span>
                                </td>
                                <td className={styles.td}>
                                    {scan.usedAt ? new Date(scan.usedAt).toLocaleString('id-ID', {
                                        day: '2-digit', month: 'short', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                    }) : '—'}
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={5} className={styles.td} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                                    {scans.length === 0 ? 'Belum ada tiket yang di-scan' : 'Tidak ditemukan'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
