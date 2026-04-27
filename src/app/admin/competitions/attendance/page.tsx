'use client';

import { useEffect, useState } from 'react';
import styles from '../../admin.module.css';
import { Users, Calendar, Trophy, Clock, CheckCircle2, Search, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CompetitionAttendancePage() {
    const [attendance, setAttendance] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        try {
            const res = await fetch('/api/admin/competitions/scan');
            const data = await res.json();
            if (res.ok) {
                setAttendance(Array.isArray(data) ? data : []);
            } else {
                console.error('Error fetching attendance:', data.error);
            }
        } catch (error) {
            console.error('Error fetching competition attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredAttendance = attendance.filter(reg =>
        reg.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.competition?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className={styles.loading}>Loading Attendance List...</div>;

    return (
        <div>
            <div className={styles.pageHeader}>
                <div>
                    <Link href="/admin/competitions/registrations" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', textDecoration: 'none', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600 }}>
                        <ArrowLeft size={14} /> KEMBALI KE REGISTRASI
                    </Link>
                    <h1>Daftar Kehadiran Peserta</h1>
                    <p>List peserta kompetisi yang sudah berhasil melakukan scan barcode.</p>
                </div>
            </div>

            <div className="glass" style={{ borderRadius: '16px', padding: '1.25rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Search size={20} style={{ opacity: 0.4 }} />
                <input
                    type="text"
                    placeholder="Cari nama peserta atau kompetisi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: '0.95rem' }}
                />
            </div>

            <div className={styles.tableContainer}>
                <table className={`${styles.table} glass`}>
                    <thead>
                        <tr>
                            <th className={styles.th}>Peserta</th>
                            <th className={styles.th}>Kompetisi</th>
                            <th className={styles.th}>Waktu Scan</th>
                            <th className={styles.th}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAttendance.length === 0 && (
                            <tr>
                                <td className={styles.td} colSpan={4} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '3rem' }}>
                                    {searchTerm ? 'Tidak ada peserta yang cocok dengan pencarian.' : 'Belum ada peserta yang melakukan scan.'}
                                </td>
                            </tr>
                        )}
                        {filteredAttendance.map((reg) => (
                            <tr key={reg.id}>
                                <td className={styles.td}>
                                    <div className={styles.userCell}>
                                        <div className={styles.avatar} style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}>
                                            {reg.buyerName.charAt(0)}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 700 }}>{reg.buyerName}</span>
                                            <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{reg.user?.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className={styles.td}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Trophy size={14} style={{ color: 'var(--primary)' }} />
                                        {reg.competition?.name}
                                    </div>
                                </td>
                                <td className={styles.td}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.8 }}>
                                        <Clock size={14} />
                                        {new Date(reg.checkedInAt).toLocaleString('id-ID', {
                                            day: '2-digit',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </td>
                                <td className={styles.td}>
                                    <span className={`${styles.statusBadge} approved`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <CheckCircle2 size={12} /> TERVERIFIKASI
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
