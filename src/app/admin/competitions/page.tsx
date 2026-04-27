'use client';

import { useEffect, useState } from 'react';
import styles from '../admin.module.css';
import { Plus, Edit, Trash2, X } from 'lucide-react';

const CATEGORIES = ['Music', 'Tech', 'Art', 'Sports', 'Science', 'Business', 'Other'];
const STATUSES = ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'];

interface CompetitionForm {
    name: string;
    regStart: string;
    regEnd: string;
    tmStart: string;
    perfStart: string;
    perfEnd: string;
    location: string;
    venue: string;
    description: string;
    image: string;
    moreInfoImage: string;
    category: string;
    registrationFee: string;
    status: string;
    contactPerson: string;
}

const emptyForm: CompetitionForm = {
    name: '',
    regStart: '',
    regEnd: '',
    tmStart: '',
    perfStart: '',
    perfEnd: '',
    location: '',
    venue: '',
    description: '',
    image: '',
    moreInfoImage: '',
    category: 'Tech',
    registrationFee: '0',
    status: 'UPCOMING',
    contactPerson: '',
};

export default function AdminCompetitionsPage() {
    const [competitions, setCompetitions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<CompetitionForm>(emptyForm);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [moreInfoFile, setMoreInfoFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        fetchCompetitions();
    }, []);

    const fetchCompetitions = async () => {
        try {
            const res = await fetch('/api/admin/competitions');
            const data = await res.json();
            if (Array.isArray(data)) {
                setCompetitions(data);
            } else {
                setCompetitions([]);
                if (data.error) setError(data.error);
            }
        } catch (error) {
            console.error('Error fetching competitions:', error);
            setError('Failed to load competitions');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData(emptyForm);
        setImageFile(null);
        setMoreInfoFile(null);
        setError('');
        setEditingId(null);
    };

    const handleEdit = (comp: any) => {
        const formatDateStr = (d: any, withTime = false) => {
            if (!d) return '';
            const iso = new Date(d).toISOString();
            return withTime ? iso.slice(0, 16) : iso.slice(0, 10);
        };
        setEditingId(comp.id);
        setFormData({
            name: comp.name,
            regStart: formatDateStr(comp.regStart),
            regEnd: formatDateStr(comp.regEnd),
            tmStart: formatDateStr(comp.tmStart, true),
            perfStart: formatDateStr(comp.perfStart),
            perfEnd: formatDateStr(comp.perfEnd),
            location: comp.location,
            venue: comp.venue || comp.location,
            description: comp.description || '',
            image: comp.image || '',
            moreInfoImage: comp.moreInfoImage || '',
            category: comp.category,
            registrationFee: comp.registrationFee?.toString() || '0',
            status: comp.status,
            contactPerson: comp.contactPerson || '',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setUploading(true);

        try {
            let imageUrl = formData.image;
            let moreInfoImageUrl = formData.moreInfoImage;

            if (imageFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', imageFile);
                const uploadRes = await fetch('/api/admin/upload', {
                    method: 'POST',
                    body: uploadFormData,
                });
                if (!uploadRes.ok) throw new Error('Main image upload failed');
                const uploadData = await uploadRes.json();
                imageUrl = uploadData.url;
            }

            if (moreInfoFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', moreInfoFile);
                const uploadRes = await fetch('/api/admin/upload', {
                    method: 'POST',
                    body: uploadFormData,
                });
                if (!uploadRes.ok) throw new Error('More info image upload failed');
                const uploadData = await uploadRes.json();
                moreInfoImageUrl = uploadData.url;
            }

            const url = editingId
                ? `/api/admin/competitions/${editingId}`
                : '/api/admin/competitions';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    image: imageUrl,
                    moreInfoImage: moreInfoImageUrl,
                }),
            });

            if (res.ok) {
                setIsModalOpen(false);
                resetForm();
                fetchCompetitions();
            } else {
                const errData = await res.json();
                setError(errData.error || `Failed to ${editingId ? 'update' : 'create'} competition`);
            }
        } catch (err: any) {
            console.error('Error:', err);
            setError(err.message || 'An error occurred');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this competition?')) return;
        try {
            await fetch(`/api/admin/competitions/${id}`, { method: 'DELETE' });
            fetchCompetitions();
        } catch (error) {
            console.error('Error deleting competition:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'UPCOMING': return { background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' };
            case 'ONGOING': return { background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' };
            case 'COMPLETED': return { background: 'rgba(107, 114, 128, 0.1)', color: '#6b7280' };
            case 'CANCELLED': return { background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' };
            default: return {};
        }
    };

    if (loading) return <div className={styles.loading}>Loading Competitions...</div>;

    return (
        <div>
            <div className={styles.pageHeader}>
                <div>
                    <h1>Kompetisi</h1>
                    <p>Buat dan kelola kompetisi mendatang.</p>
                </div>
                <button className="btn-primary" onClick={() => { resetForm(); setIsModalOpen(true); }}>
                    <Plus size={18} /> BUAT KOMPETISI
                </button>
            </div>

            <div className={styles.tableContainer} style={{ marginTop: '3rem' }}>
                <table className={`${styles.table} glass`}>
                    <thead>
                        <tr>
                            <th className={styles.th}>Nama</th>
                            <th className={styles.th}>Tanggal</th>
                            <th className={styles.th}>Kategori</th>
                            <th className={styles.th}>Status</th>
                            <th className={styles.th}>Biaya</th>
                            <th className={styles.th}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {competitions.length === 0 && (
                            <tr>
                                <td className={styles.td} colSpan={7} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                                    Belum ada kompetisi. Buat kompetisi pertama Anda di atas.
                                </td>
                            </tr>
                        )}
                        {competitions.map((comp) => (
                            <tr key={comp.id}>
                                <td className={styles.td}>{comp.name}</td>
                                <td className={styles.td}>{new Date(comp.date).toLocaleDateString()}</td>
                                <td className={styles.td}>
                                    <span className={styles.statusBadge} style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--primary)' }}>
                                        {comp.category}
                                    </span>
                                </td>
                                <td className={styles.td}>
                                    <span className={styles.statusBadge} style={getStatusColor(comp.status)}>
                                        {comp.status}
                                    </span>
                                </td>
                                <td className={styles.td}>Rp {comp.registrationFee?.toLocaleString()}</td>
                                <td className={styles.td}>
                                    <div className={styles.actions}>
                                        <button className={styles.iconBtn} onClick={() => handleEdit(comp)} title="Edit">
                                            <Edit size={16} />
                                        </button>
                                        <button className={styles.iconBtn} onClick={() => handleDelete(comp.id)} title="Delete">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* CREATE/EDIT COMPETITION MODAL */}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={`${styles.modal} glass`} style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className={styles.modalHeader}>
                            <h2>{editingId ? 'Edit Kompetisi' : 'Buat Kompetisi Baru'}</h2>
                            <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
                        </div>

                        {error && (
                            <div className={styles.errorBanner}>{error}</div>
                        )}

                        <form onSubmit={handleSubmit} className={styles.modalForm}>
                            <div className={styles.formSection}>
                                <h3 className={styles.sectionTitle}>Informasi Dasar</h3>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Nama Kompetisi</label>
                                    <input
                                        type="text"
                                        placeholder="Masukkan nama kompetisi"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className={styles.input}
                                    />
                                </div>
                                <div className={styles.row}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className={styles.input}
                                        >
                                            {CATEGORIES.map((cat) => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className={styles.input}
                                        >
                                            {STATUSES.map((s) => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.formSection}>
                                <h3 className={styles.sectionTitle}>Detail Lokasi</h3>
                                <div className={styles.row}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Venue / Lokasi Detail</label>
                                        <input
                                            type="text"
                                            placeholder="Nama Venue"
                                            value={formData.venue}
                                            onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                                            className={styles.input}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Kota / Lokasi Dasar</label>
                                        <input
                                            type="text"
                                            placeholder="Kota"
                                            required
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            className={styles.input}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.formSection}>
                                <h3 className={styles.sectionTitle}>Jadwal Pendaftaran</h3>
                                <div className={styles.row}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Mulai Pendaftaran</label>
                                        <input
                                            type="date"
                                            value={formData.regStart}
                                            onChange={(e) => setFormData({ ...formData, regStart: e.target.value })}
                                            className={styles.input}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Akhir Pendaftaran</label>
                                        <input
                                            type="date"
                                            value={formData.regEnd}
                                            onChange={(e) => setFormData({ ...formData, regEnd: e.target.value })}
                                            className={styles.input}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.formSection}>
                                <h3 className={styles.sectionTitle}>Jadwal Acara</h3>
                                <div className={styles.row}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Technical Meeting</label>
                                        <input
                                            type="datetime-local"
                                            value={formData.tmStart}
                                            onChange={(e) => setFormData({ ...formData, tmStart: e.target.value })}
                                            className={styles.input}
                                        />
                                    </div>
                                </div>
                                <div className={styles.row}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Hari Pelaksanaan (Mulai)</label>
                                        <input
                                            type="date"
                                            value={formData.perfStart}
                                            onChange={(e) => setFormData({ ...formData, perfStart: e.target.value })}
                                            className={styles.input}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Hari Pelaksanaan (Selesai)</label>
                                        <input
                                            type="date"
                                            value={formData.perfEnd}
                                            onChange={(e) => setFormData({ ...formData, perfEnd: e.target.value })}
                                            className={styles.input}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.formSection}>
                                <h3 className={styles.sectionTitle}>Biaya & Kontak</h3>
                                <div className={styles.row}>
                                    <div className={styles.formGroup} style={{ flex: 2 }}>
                                        <label className={styles.label}>Kontak Person</label>
                                        <input
                                            type="text"
                                            placeholder="Admin: 0812... / IG: @..."
                                            value={formData.contactPerson}
                                            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                            className={styles.input}
                                        />
                                    </div>
                                    <div className={styles.formGroup} style={{ flex: 1 }}>
                                        <label className={styles.label}>Biaya Daftar (Rp)</label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.registrationFee}
                                            onChange={(e) => setFormData({ ...formData, registrationFee: e.target.value })}
                                            className={styles.input}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.formSection}>
                                <h3 className={styles.sectionTitle}>Konten & Media</h3>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Deskripsi</label>
                                    <textarea
                                        placeholder="Masukkan deskripsi kompetisi..."
                                        required
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className={styles.textarea}
                                        rows={4}
                                    />
                                </div>
                                <div className={styles.row}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Gambar Banner Utama</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                                            className={styles.input}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Guidebook / Gambar Info Lanjut</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setMoreInfoFile(e.target.files ? e.target.files[0] : null)}
                                            className={styles.input}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={uploading} className="btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '1rem' }}>
                                {uploading
                                    ? (editingId ? 'Memperbarui...' : 'Membuat...')
                                    : (editingId ? 'Simpan Perubahan' : 'Buat Kompetisi')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
