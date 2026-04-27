'use client';

import { useEffect, useState } from 'react';
import styles from '../admin.module.css';
import { User as UserIcon, Mail, Shield, Trash2, Edit, Plus, X, Lock, ShieldAlert } from 'lucide-react';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'USER'
    });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (user: any = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                name: user.name || '',
                email: user.email || '',
                password: '', // Don't show old password
                role: user.role || 'USER'
            });
        } else {
            setEditingUser(null);
            setFormData({
                name: '',
                email: '',
                password: '',
                role: 'USER'
            });
        }
        setError('');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const url = '/api/admin/users';
            const method = editingUser ? 'PATCH' : 'POST';
            const body = editingUser
                ? { id: editingUser.id, ...formData }
                : formData;

            // Simple validation
            if (!formData.name || !formData.email || (!editingUser && !formData.password)) {
                setError('Semua field wajib diisi');
                setSubmitting(false);
                return;
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (res.ok) {
                setIsModalOpen(false);
                fetchUsers();
            } else {
                setError(data.error || 'Terjadi kesalahan');
            }
        } catch (err) {
            setError('Gagal menghubungkan ke server');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus pengguna "${name}"?`)) return;
        try {
            const res = await fetch('/api/admin/users', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });

            if (res.ok) {
                setUsers(users.filter(u => u.id !== id));
            } else {
                const data = await res.json();
                alert(data.error || 'Gagal menghapus pengguna');
            }
        } catch (err) {
            alert('Gagal menghubungi server');
        }
    };

    if (loading && users.length === 0) return <div className={styles.loading}>Memuat Pengguna...</div>;

    return (
        <div>
            <div className={styles.pageHeader}>
                <div>
                    <h1>Direktori Pengguna</h1>
                    <p>Kelola akses akun dan peran pengguna (Admin/User).</p>
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={18} /> BUAT PENGGUNA BARU
                </button>
            </div>

            <div className={styles.tableContainer} style={{ marginTop: '2rem' }}>
                <table className={`${styles.table} glass`}>
                    <thead>
                        <tr>
                            <th className={styles.th}>Nama</th>
                            <th className={styles.th}>Email</th>
                            <th className={styles.th}>Peran</th>
                            <th className={styles.th}>Tgl Dibuat</th>
                            <th className={styles.th}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td className={styles.td}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            background: 'rgba(255,255,255,0.05)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <UserIcon size={16} />
                                        </div>
                                        {user.name}
                                    </div>
                                </td>
                                <td className={styles.td}>{user.email}</td>
                                <td className={styles.td}>
                                    <span className={`${styles.roleBadge} ${user.role === 'ADMIN' ? styles.admin : ''}`}>
                                        {user.role === 'ADMIN' ? <Shield size={12} style={{ marginRight: '5px' }} /> : null}
                                        {user.role}
                                    </span>
                                </td>
                                <td className={styles.td} style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                                    {new Date(user.createdAt).toLocaleDateString('id-ID')}
                                </td>
                                <td className={styles.td}>
                                    <div className={styles.actions}>
                                        <button onClick={() => handleOpenModal(user)} className={styles.iconBtn} title="Edit Pengguna">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(user.id, user.name)} className={styles.iconBtn} style={{ color: '#ff4444' }} title="Hapus Pengguna">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL CREATE/EDIT USER */}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={`${styles.modal} glass`} style={{ maxWidth: '450px' }}>
                        <div className={styles.modalHeader}>
                            <h2>{editingUser ? 'Edit Pengguna' : 'Buat Pengguna Baru'}</h2>
                            <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
                        </div>

                        {error && <div className={styles.errorBanner}>{error}</div>}

                        <form onSubmit={handleSubmit} className={styles.modalForm}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}><UserIcon size={14} /> Nama Lengkap</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="Masukkan nama"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}><Mail size={14} /> Email</label>
                                <input
                                    type="email"
                                    className={styles.input}
                                    placeholder="email@contoh.com"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}><Lock size={14} /> {editingUser ? 'Kata Sandi Baru (Opsional)' : 'Kata Sandi'}</label>
                                <input
                                    type="password"
                                    className={styles.input}
                                    placeholder={editingUser ? 'Kosongkan jika tidak ingin mengubah' : 'Min. 6 karakter'}
                                    required={!editingUser}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}><Shield size={14} /> Peran Pengguna</label>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                                    <button
                                        type="button"
                                        className={`${styles.tabBtn} ${formData.role === 'USER' ? styles.active : ''}`}
                                        style={{ flex: 1, padding: '10px' }}
                                        onClick={() => setFormData({ ...formData, role: 'USER' })}
                                    >
                                        USER
                                    </button>
                                    <button
                                        type="button"
                                        className={`${styles.tabBtn} ${formData.role === 'ADMIN' ? styles.active : ''}`}
                                        style={{ flex: 1, padding: '10px' }}
                                        onClick={() => setFormData({ ...formData, role: 'ADMIN' })}
                                    >
                                        <Shield size={14} style={{ marginRight: '5px' }} /> ADMIN
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginTop: '2rem' }}>
                                <button type="submit" disabled={submitting} className="btn-primary" style={{ width: '100%' }}>
                                    {submitting ? 'Menyimpan...' : (editingUser ? 'SIMPAN PERUBAHAN' : 'BUAT PENGGUNA')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
