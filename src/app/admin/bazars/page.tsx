'use client';

import { useEffect, useState } from 'react';
import styles from '../admin.module.css';
import { Check, X, Store, Trash2, Settings, Calendar, DollarSign, User, MapPin, Save, ScanLine, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AdminBazarPage() {
    const [bazars, setBazars] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [settings, setSettings] = useState({
        bazarRegStart: '',
        bazarRegEnd: '',
        bazarDate: '',
        bazarFee: '800000',
        bazarCP: '',
        bazarVenue: '',
        bazarRegEnabled: true
    });
    const [savingSettings, setSavingSettings] = useState(false);

    useEffect(() => {
        fetchBazars();
        fetchEvents();
    }, []);

    const fetchBazars = async () => {
        try {
            const res = await fetch('/api/admin/bazars');
            const data = await res.json();
            if (res.ok) {
                setBazars(Array.isArray(data) ? data : []);
            } else {
                setBazars([]);
            }
        } catch (error) {
            setBazars([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchEvents = async () => {
        try {
            const res = await fetch('/api/bazars'); // reusing public for base info
            const data = await res.json();
            if (res.ok) {
                setEvents(data);
                if (data.length > 0) {
                    setSelectedEventId(data[0].id);
                    updateSettingsFromEvent(data[0]);
                }
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const updateSettingsFromEvent = (event: any) => {
        setSettings({
            bazarRegStart: event.bazarRegStart ? new Date(event.bazarRegStart).toISOString().slice(0, 16) : '',
            bazarRegEnd: event.bazarRegEnd ? new Date(event.bazarRegEnd).toISOString().slice(0, 16) : '',
            bazarDate: event.bazarDate ? new Date(event.bazarDate).toISOString().slice(0, 16) : '',
            bazarFee: event.bazarFee?.toString() || '800000',
            bazarCP: event.bazarCP || '',
            bazarVenue: event.bazarVenue || '',
            bazarRegEnabled: event.bazarRegEnabled ?? true
        });
    };

    useEffect(() => {
        if (selectedEventId) {
            const event = events.find(e => e.id === selectedEventId);
            if (event) updateSettingsFromEvent(event);
        }
    }, [selectedEventId, events]);

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingSettings(true);
        try {
            const res = await fetch('/api/admin/bazars', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId: selectedEventId,
                    ...settings
                }),
            });
            if (res.ok) {
                alert('Bazar settings updated successfully!');
                fetchEvents(); // Refresh to get fresh data
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to update settings');
            }
        } catch (error) {
            alert('An error occurred');
        } finally {
            setSavingSettings(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: 'CONFIRMED' | 'REJECTED') => {
        try {
            const res = await fetch('/api/admin/bazars', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status }),
            });
            if (res.ok) {
                fetchBazars();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating bazar status:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this bazar application?')) return;
        try {
            const res = await fetch('/api/admin/bazars', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            if (res.ok) {
                fetchBazars();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete');
            }
        } catch (error) {
            console.error('Error deleting bazar:', error);
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

    if (loading) return <div className={styles.loading}>Loading Bazar Applications...</div>;

    // Report Calculations
    const totalApps = bazars.length;
    const confirmedApps = bazars.filter(b => b.status === 'CONFIRMED').length;
    const pendingApps = bazars.filter(b => b.status === 'PENDING_VALIDATION').length;
    const totalRevenue = bazars
        .filter(b => b.status === 'CONFIRMED')
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    return (
        <div>
            <div className={styles.pageHeader}>
                <div>
                    <h1>Manajemen Bazar</h1>
                    <p>Tinjau dan kelola pendaftaran bazar untuk semua acara.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link href="/admin/bazars/scan" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                        <ScanLine size={18} /> PINDAI KODE QR
                    </Link>
                    <Link href="/admin/bazars/attendance" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', background: 'rgba(255,255,255,0.05)', color: 'white', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Users size={18} /> DAFTAR KEHADIRAN
                    </Link>
                </div>
            </div>

            {/* Reports Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <div className="glass" style={{ padding: '1.5rem', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Pendaftar</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900 }}>{totalApps}</div>
                </div>
                <div className="glass" style={{ padding: '1.5rem', borderRadius: '15px', border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.03)' }}>
                    <div style={{ color: '#34d399', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Slot Terkonfirmasi</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#34d399' }}>{confirmedApps}</div>
                </div>
                <div className="glass" style={{ padding: '1.5rem', borderRadius: '15px', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <div style={{ color: '#fbbf24', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Menunggu Validasi</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fbbf24' }}>{pendingApps}</div>
                </div>
                <div className="glass" style={{ padding: '1.5rem', borderRadius: '15px', border: '1px solid var(--primary)', background: 'rgba(139, 92, 246, 0.05)' }}>
                    <div style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Pendapatan</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>Rp {totalRevenue.toLocaleString('id-ID')}</div>
                </div>
            </div>

            {/* Bazar CMS Settings */}
            <div className="glass" style={{ borderRadius: '20px', padding: '2rem', marginBottom: '3rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <Settings style={{ color: 'var(--primary)' }} size={24} />
                    <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Pengaturan CMS Bazar</h2>
                </div>

                <form onSubmit={handleSaveSettings}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                            <label className={styles.label}><Calendar size={14} /> Pilih Acara untuk Dikonfigurasi</label>
                            <select
                                className={styles.input}
                                value={selectedEventId}
                                onChange={(e) => setSelectedEventId(e.target.value)}
                                style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}
                            >
                                <option value="" disabled style={{ background: '#111' }}>Pilih Acara...</option>
                                {events.map(event => (
                                    <option key={event.id} value={event.id} style={{ background: '#111' }}>
                                        {event.name} ({new Date(event.date).toLocaleDateString('id-ID')})
                                    </option>
                                ))}
                            </select>
                            <p className={styles.fileHint}>Pengaturan di bawah ini hanya berlaku untuk acara yang dipilih.</p>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}><Calendar size={14} /> Tanggal Pelaksanaan Bazar</label>
                            <input
                                type="datetime-local"
                                className={styles.input}
                                value={settings.bazarDate}
                                onChange={(e) => setSettings({ ...settings, bazarDate: e.target.value })}
                            />
                        </div>

                        <div className={styles.formGroup} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <label className={styles.label}>Toggle Registrasi Manual</label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <input
                                    type="checkbox"
                                    checked={settings.bazarRegEnabled}
                                    onChange={(e) => setSettings({ ...settings, bazarRegEnabled: e.target.checked })}
                                    style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer', accentColor: 'var(--primary)' }}
                                />
                                <span style={{ fontWeight: 600, color: settings.bazarRegEnabled ? '#34d399' : '#f87171' }}>
                                    {settings.bazarRegEnabled ? 'PENDAFTARAN DIBUKA' : 'PENDAFTARAN DITUTUP'}
                                </span>
                            </label>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}><DollarSign size={14} /> Biaya Bazar (Rp)</label>
                            <input
                                type="number"
                                className={styles.input}
                                value={settings.bazarFee}
                                onChange={(e) => setSettings({ ...settings, bazarFee: e.target.value })}
                                placeholder="800000"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}><Calendar size={14} /> Mulai Pendaftaran</label>
                            <input
                                type="datetime-local"
                                className={styles.input}
                                value={settings.bazarRegStart}
                                onChange={(e) => setSettings({ ...settings, bazarRegStart: e.target.value })}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}><Calendar size={14} /> Akhir Pendaftaran</label>
                            <input
                                type="datetime-local"
                                className={styles.input}
                                value={settings.bazarRegEnd}
                                onChange={(e) => setSettings({ ...settings, bazarRegEnd: e.target.value })}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}><User size={14} /> Kontak Person</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={settings.bazarCP}
                                onChange={(e) => setSettings({ ...settings, bazarCP: e.target.value })}
                                placeholder="Admin (0812...)"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}><MapPin size={14} /> Lokasi Spesifik</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={settings.bazarVenue}
                                onChange={(e) => setSettings({ ...settings, bazarVenue: e.target.value })}
                                placeholder="Lobby Utama / Area Parkir B"
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" disabled={savingSettings} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Save size={18} /> {savingSettings ? 'MENYIMPAN...' : 'SIMPAN KONFIGURASI BAZAR'}
                        </button>
                    </div>
                </form>
            </div>

            <div className={styles.pageHeader} style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem' }}>Pendaftaran Bazar</h2>
                </div>
            </div>
            <table className={`${styles.table} glass`}>
                <thead>
                    <tr>
                        <th className={styles.th}>Nama Brand</th>
                        <th className={styles.th}>Pemilik</th>
                        <th className={styles.th}>Acara</th>
                        <th className={styles.th}>Jenis</th>
                        <th className={styles.th}>Bukti</th>
                        <th className={styles.th}>Status</th>
                        <th className={styles.th}>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {bazars.length === 0 && (
                        <tr>
                            <td className={styles.td} colSpan={7} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                                Belum ada pendaftaran bazar.
                            </td>
                        </tr>
                    )}
                    {bazars.map((bazar) => (
                        <tr key={bazar.id}>
                            <td className={styles.td}>
                                <div className={styles.userCell}>
                                    <Store size={16} />
                                    <span>{bazar.name}</span>
                                </div>
                            </td>
                            <td className={styles.td}>{bazar.user?.name || bazar.user?.email || '-'}</td>
                            <td className={styles.td}>{bazar.event?.name || '-'}</td>
                            <td className={styles.td}>{bazar.type}</td>
                            <td className={styles.td}>
                                {bazar.paymentProof ? (
                                    <a href={bazar.paymentProof} target="_blank" rel="noopener noreferrer" className={styles.viewProofBtn}>
                                        Lihat Bukti
                                    </a>
                                ) : (
                                    <span style={{ opacity: 0.3 }}>-</span>
                                )}
                            </td>
                            <td className={styles.td}>
                                <span className={`${styles.statusBadge} ${getStatusClass(bazar.status)}`}>
                                    {bazar.status.replace(/_/g, ' ')}
                                </span>
                            </td>
                            <td className={styles.td}>
                                <div className={styles.actions}>
                                    {bazar.status === 'PENDING_VALIDATION' && (
                                        <>
                                            <button
                                                className={styles.iconBtn}
                                                title="Approve"
                                                onClick={() => handleUpdateStatus(bazar.id, 'CONFIRMED')}
                                            >
                                                <Check size={16} color="#10b981" />
                                            </button>
                                            <button
                                                className={styles.iconBtn}
                                                title="Reject"
                                                onClick={() => handleUpdateStatus(bazar.id, 'REJECTED')}
                                            >
                                                <X size={16} color="#ef4444" />
                                            </button>
                                        </>
                                    )}
                                    <button
                                        className={styles.iconBtn}
                                        title="Delete"
                                        onClick={() => handleDelete(bazar.id)}
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
    );
}
