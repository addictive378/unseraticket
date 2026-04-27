'use client';

import { useEffect, useState } from 'react';
import styles from '../../admin.module.css';
import { Users, Clock, Calendar, CheckCircle2, Search, Store } from 'lucide-react';

export default function BazarAttendancePage() {
    const [attendance, setAttendance] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetch('/api/admin/bazars/scan')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setAttendance(data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Fetch attendance error:', err);
                setLoading(false);
            });
    }, []);

    const filtered = attendance.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.event?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className={styles.pageHeader}>
                <div>
                    <h1>Data Kehadiran Bazaar</h1>
                    <p>Daftar peserta bazaar yang sudah melakukan check-in di lokasi.</p>
                </div>
            </div>

            <div className="glass" style={{ borderRadius: '20px', padding: '2rem', marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} size={18} />
                        <input
                            type="text"
                            placeholder="Cari Peserta / Event..."
                            className={styles.input}
                            style={{ paddingLeft: '2.5rem', marginBottom: 0 }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Store size={18} className="text-primary" />
                            <strong>{attendance.length}</strong> Total Check-in
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className={styles.loading}>Memuat data kehadiran...</div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                        <Users size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                        <p>Belum ada peserta yang check-in atau data tidak ditemukan.</p>
                    </div>
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Pedagang / Brand</th>
                                    <th>Acara</th>
                                    <th>Tipe</th>
                                    <th>Waktu Check-in</th>
                                    <th>ID Registrasi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                                    <Store size={16} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{item.user?.name || item.user?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{item.event?.name}</td>
                                        <td>
                                            <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.9rem' }}>
                                                <CheckCircle2 size={14} />
                                                {new Date(item.checkedInAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                                                    ({new Date(item.checkedInAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', opacity: 0.5 }}>{item.id}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
