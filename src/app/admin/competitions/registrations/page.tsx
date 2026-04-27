'use client';

import { useEffect, useState } from 'react';
import styles from '../../admin.module.css';
import { Check, X, Users, Trash2, ExternalLink, TrendingUp, Coins, Users2, AlertCircle, Ticket, ScanLine } from 'lucide-react';
import QRCodeCanvas from '@/components/QRCodeCanvas';
import Link from 'next/link';

export default function AdminCompetitionRegistrationsPage() {
    const [registrations, setRegistrations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRegistrations();
    }, []);

    const fetchRegistrations = async () => {
        try {
            const res = await fetch('/api/admin/competitions/registrations');
            const data = await res.json();
            if (res.ok) {
                setRegistrations(Array.isArray(data) ? data : []);
            } else {
                console.error('Error fetching registrations:', data.error);
                setRegistrations([]);
            }
        } catch (error) {
            console.error('Error fetching competition registrations:', error);
            setRegistrations([]);
        } finally {
            setLoading(false);
        }
    };

    // Calculate Stats
    const confirmedRegs = registrations.filter(r => r.status === 'CONFIRMED');
    const totalParticipants = confirmedRegs.length;
    const totalRevenue = confirmedRegs.reduce((sum, r) => sum + (r.competition?.registrationFee || 0), 0);
    const pendingValidations = registrations.filter(r => r.status === 'PENDING_VALIDATION').length;

    const handleUpdateStatus = async (id: string, status: 'CONFIRMED' | 'REJECTED') => {
        try {
            const res = await fetch('/api/admin/competitions/registrations', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status }),
            });
            if (res.ok) {
                fetchRegistrations();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating registration status:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this registration?')) return;
        try {
            const res = await fetch('/api/admin/competitions/registrations', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            if (res.ok) {
                fetchRegistrations();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete');
            }
        } catch (error) {
            console.error('Error deleting registration:', error);
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'CONFIRMED': return 'approved';
            case 'REJECTED': return 'rejected';
            case 'CANCELLED': return 'rejected';
            case 'PENDING_VALIDATION': return 'pending';
            case 'PENDING_PAYMENT': return 'waiting';
            default: return 'pending';
        }
    };

    if (loading) return <div className={styles.loading}>Loading Registrations...</div>;

    return (
        <div>
            <div className={styles.pageHeader}>
                <div>
                    <h1>Registrasi Kompetisi</h1>
                    <p>Tinjau dan validasi peserta untuk semua kompetisi.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link href="/admin/competitions/attendance" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.6rem 1.25rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600 }}>
                        <Users size={18} /> DAFTAR KEHADIRAN
                    </Link>
                    <Link href="/admin/competitions/scan" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                        <ScanLine size={18} /> SCAN PESERTA
                    </Link>
                </div>
            </div>

            <div className={styles.statsGrid}>
                <div className={`${styles.statCard} glass`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h4>Total Peserta</h4>
                            <div className={styles.statValue}>{totalParticipants}</div>
                            <div className={styles.statTrend} style={{ color: 'rgba(255,255,255,0.4)' }}>Pendaftaran disetujui</div>
                        </div>
                        <div className={styles.avatar} style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)' }}>
                            <Users2 size={20} />
                        </div>
                    </div>
                </div>

                <div className={`${styles.statCard} glass`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h4>Total Pendapatan</h4>
                            <div className={styles.statValue}>Rp {totalRevenue.toLocaleString('id-ID')}</div>
                            <div className={styles.statTrend} style={{ color: '#10b981' }}>
                                <TrendingUp size={12} /> Dari registrasi disetujui
                            </div>
                        </div>
                        <div className={styles.avatar} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                            <Coins size={20} />
                        </div>
                    </div>
                </div>

                <div className={`${styles.statCard} glass`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h4>Menunggu Aksi</h4>
                            <div className={styles.statValue}>{pendingValidations}</div>
                            <div className={styles.statTrend} style={{ color: '#f59e0b' }}>Perlu verifikasi</div>
                        </div>
                        <div className={styles.avatar} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                            <AlertCircle size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Competition Breakdown Section */}
            <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem', opacity: 0.8 }}>Pendapatan per Kompetisi</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {Object.entries(
                        confirmedRegs.reduce((acc: any, reg) => {
                            const name = reg.competition?.name || 'Unknown';
                            if (!acc[name]) acc[name] = { count: 0, revenue: 0 };
                            acc[name].count += 1;
                            acc[name].revenue += (reg.competition?.registrationFee || 0);
                            return acc;
                        }, {})
                    ).map(([name, data]: [string, any]) => (
                        <div key={name} className="glass" style={{ padding: '1.5rem', borderRadius: '15px' }}>
                            <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{name}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>{data.count} Peserta</span>
                                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Rp {data.revenue.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={`${styles.table} glass`}>
                    <thead>
                        <tr>
                            <th className={styles.th}>Peserta</th>
                            <th className={styles.th}>Kompetisi</th>
                            <th className={styles.th}>WhatsApp</th>
                            <th className={styles.th}>Bukti</th>
                            <th className={styles.th}>E-Tiket</th>
                            <th className={styles.th}>Status</th>
                            <th className={styles.th}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {registrations.length === 0 && (
                            <tr>
                                <td className={styles.td} colSpan={6} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                                    No registrations yet.
                                </td>
                            </tr>
                        )}
                        {registrations.map((reg) => (
                            <tr key={reg.id}>
                                <td className={styles.td}>
                                    <div className={styles.userCell}>
                                        <Users size={16} />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 700 }}>{reg.buyerName}</span>
                                            <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{reg.user?.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className={styles.td}>{reg.competition?.name || '-'}</td>
                                <td className={styles.td}>
                                    {reg.whatsapp}
                                </td>
                                <td className={styles.td}>
                                    {reg.paymentProof ? (
                                        <a href={reg.paymentProof} target="_blank" rel="noopener noreferrer" className={styles.viewProofBtn}>
                                            Lihat Bukti
                                        </a>
                                    ) : (
                                        <span style={{ opacity: 0.3 }}>-</span>
                                    )}
                                </td>
                                <td className={styles.td}>
                                    {reg.status === 'CONFIRMED' ? (
                                        <div style={{ padding: '4px', background: 'white', borderRadius: '4px', width: '48px', height: '48px' }}>
                                            <QRCodeCanvas value={`ELVIN-COMP:${reg.id}`} size={40} />
                                        </div>
                                    ) : (
                                        <span style={{ opacity: 0.3 }}>-</span>
                                    )}
                                </td>
                                <td className={styles.td}>
                                    <span className={`${styles.statusBadge} ${getStatusClass(reg.status)}`}>
                                        {reg.status.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td className={styles.td}>
                                    <div className={styles.actions}>
                                        {reg.status === 'PENDING_VALIDATION' && (
                                            <>
                                                <button
                                                    className={styles.iconBtn}
                                                    title="Approve"
                                                    onClick={() => handleUpdateStatus(reg.id, 'CONFIRMED')}
                                                >
                                                    <Check size={16} color="#10b981" />
                                                </button>
                                                <button
                                                    className={styles.iconBtn}
                                                    title="Reject"
                                                    onClick={() => handleUpdateStatus(reg.id, 'REJECTED')}
                                                >
                                                    <X size={16} color="#ef4444" />
                                                </button>
                                            </>
                                        )}
                                        <button
                                            className={styles.iconBtn}
                                            title="Delete"
                                            onClick={() => handleDelete(reg.id)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div >
    );
}
