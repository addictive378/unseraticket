'use client';

import { useState, useEffect } from 'react';
import { Save, Upload, Globe, Layout, Info, MessageCircle, Mail, CheckCircle2, AlertCircle, Camera, User as UserIcon, Trash2, Image as ImageIcon } from 'lucide-react';
import styles from '../admin.module.css';

type SiteSettings = {
    siteName: string;
    logoText: string;
    logoSuffix: string;
    heroBadge: string;
    heroTitle: string;
    heroSubtitle: string;
    heroImage: string | null;
    galleryImages: string[];
    aboutTitle: string;
    aboutBadge: string;
    aboutText1: string;
    aboutText2: string;
    whatsapp: string | null;
    instagram: string | null;
    email: string | null;
};

type Tab = 'branding' | 'hero' | 'gallery' | 'about' | 'contact';

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('branding');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            setSettings(data);
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan!' });
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Gagal menyimpan pengaturan.' });
        } finally {
            setSaving(false);
            // Hide message after 3 seconds
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.url) {
                setSettings(prev => prev ? { ...prev, heroImage: data.url } : null);
                setMessage({ type: 'success', text: 'Gambar berhasil diunggah!' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Gagal mengunggah gambar.' });
        } finally {
            setUploading(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        const newImages = [...(settings?.galleryImages || [])];

        try {
            for (let i = 0; i < files.length; i++) {
                const formData = new FormData();
                formData.append('file', files[i]);
                const res = await fetch('/api/admin/upload', {
                    method: 'POST',
                    body: formData,
                });
                const data = await res.json();
                if (data.url) {
                    newImages.push(data.url);
                }
            }
            setSettings(prev => prev ? { ...prev, galleryImages: newImages } : null);
            setMessage({ type: 'success', text: `${files.length} gambar berhasil diunggah!` });
        } catch (error) {
            setMessage({ type: 'error', text: 'Gagal mengunggah beberapa gambar.' });
        } finally {
            setUploading(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleRemoveGalleryImage = (index: number) => {
        if (!settings) return;
        const newImages = [...settings.galleryImages];
        newImages.splice(index, 1);
        setSettings({ ...settings, galleryImages: newImages });
    };

    const handleRemoveImage = () => {
        if (!settings) return;
        setSettings({ ...settings, heroImage: null });
        setMessage({ type: 'success', text: 'Gambar hero dihapus (jangan lupa Simpan Perubahan).' });
    };

    if (loading) return <div className={styles.loading}>Memuat pengaturan...</div>;
    if (!settings) return <div className={styles.loading}>Gagal memuat data.</div>;

    const TabButton = ({ id, icon: Icon, label }: { id: Tab, icon: any, label: string }) => (
        <button
            className={`${styles.tabBtn} ${activeTab === id ? styles.active : ''}`}
            onClick={() => setActiveTab(id)}
        >
            <Icon size={18} /> {label}
        </button>
    );

    return (
        <div className={styles.settingsPage}>
            <div className={styles.pageHeader}>
                <div>
                    <h1>Pengaturan CMS</h1>
                    <p>Kustomisasi desain dan konten website secara real-time.</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                    style={{ minWidth: '160px' }}
                >
                    {saving ? 'MENYIMPAN...' : <><Save size={18} /> SIMPAN PERUBAHAN</>}
                </button>
            </div>

            {message && (
                <div className={`${styles.alert} ${styles[message.type]} animate-fadeIn`}>
                    {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    {message.text}
                </div>
            )}

            <div className={styles.settingsLayout}>
                {/* Tabs Sidebar */}
                <div className={`${styles.tabsSidebar} glass`}>
                    <TabButton id="branding" icon={Globe} label="Branding & Logo" />
                    <TabButton id="hero" icon={Layout} label="Beranda: Hero" />
                    <TabButton id="gallery" icon={ImageIcon} label="Beranda: Guest Stars" />
                    <TabButton id="about" icon={Info} label="Beranda: Tentang" />
                    <TabButton id="contact" icon={MessageCircle} label="Kontak & Sosial" />
                </div>

                {/* Content Area */}
                <div className={`${styles.settingsContent} glass`}>
                    {activeTab === 'branding' && (
                        <div className={styles.modalForm}>
                            <div className={styles.formSection}>
                                <h3 className={styles.sectionTitle}>Identitas Website</h3>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Nama Situs (Judul Browser)</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={settings.siteName}
                                        onChange={e => setSettings({ ...settings, siteName: e.target.value })}
                                    />
                                </div>
                                <div className={styles.row}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Logo Teks (Utama)</label>
                                        <input
                                            type="text"
                                            className={styles.input}
                                            value={settings.logoText}
                                            onChange={e => setSettings({ ...settings, logoText: e.target.value })}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Logo Teks (Suffix/Berwarna)</label>
                                        <input
                                            type="text"
                                            className={styles.input}
                                            value={settings.logoSuffix}
                                            onChange={e => setSettings({ ...settings, logoSuffix: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'hero' && (
                        <div className={styles.modalForm}>
                            <div className={styles.formSection}>
                                <h3 className={styles.sectionTitle}>Hero Section</h3>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Badge Teks (Info Tanggal/Lokasi)</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={settings.heroBadge}
                                        onChange={e => setSettings({ ...settings, heroBadge: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Judul Utama (Headline)</label>
                                    <textarea
                                        className={styles.textarea}
                                        value={settings.heroTitle}
                                        onChange={e => setSettings({ ...settings, heroTitle: e.target.value })}
                                        style={{ minHeight: '80px' }}
                                    />
                                    <p className={styles.fileHint}>Gunakan kata 'DENYUT' untuk efek gradien otomatis.</p>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Sub-headline (Deskripsi)</label>
                                    <textarea
                                        className={styles.textarea}
                                        value={settings.heroSubtitle}
                                        onChange={e => setSettings({ ...settings, heroSubtitle: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className={styles.formSection}>
                                <h3 className={styles.sectionTitle}>Background Hero</h3>
                                <div className={styles.imageUploadArea}>
                                    {settings.heroImage ? (
                                        <div className={styles.imagePreview}>
                                            <img src={settings.heroImage} alt="Hero Preview" />
                                            <div className={styles.imageActions}>
                                                <label className={styles.changeOverlay}>
                                                    <Camera size={20} />
                                                    Ganti
                                                    <input type="file" hidden onChange={handleFileUpload} accept="image/*" />
                                                </label>
                                                <button
                                                    className={styles.removeImageBtn}
                                                    onClick={handleRemoveImage}
                                                    title="Hapus Gambar"
                                                >
                                                    <Trash2 size={20} />
                                                    Hapus
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label className={styles.uploadPlaceholder}>
                                            <Upload size={32} />
                                            <span>Unggah Gambar Hero</span>
                                            <input type="file" hidden onChange={handleFileUpload} accept="image/*" />
                                        </label>
                                    )}
                                    {uploading && <div className={styles.uploadOverlay}>Mengunggah...</div>}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'gallery' && (
                        <div className={styles.tabContent}>
                            <div className={styles.sectionHeader}>
                                <div>
                                    <h3>Guest Stars</h3>
                                    <p>Kelola foto-foto guest star yang akan ditampilkan pada beranda.</p>
                                </div>
                                <label className="btn-primary" style={{ cursor: 'pointer' }}>
                                    <Upload size={18} /> UNGGAH FOTO
                                    <input type="file" multiple hidden onChange={handleGalleryUpload} accept="image/*" />
                                </label>
                            </div>

                            <div className={styles.galleryGrid}>
                                {(settings.galleryImages || []).map((url, index) => (
                                    <div key={index} className={styles.galleryItem}>
                                        <img src={url} alt={`Gallery ${index}`} />
                                        <button
                                            className={styles.removeGalleryBtn}
                                            onClick={() => handleRemoveGalleryImage(index)}
                                            title="Hapus"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                {(!settings.galleryImages || settings.galleryImages.length === 0) && (
                                    <div className={styles.emptyGallery}>
                                        <ImageIcon size={48} />
                                        <p>Belum ada foto guest star.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'about' && (
                        <div className={styles.modalForm}>
                            <div className={styles.formSection}>
                                <h3 className={styles.sectionTitle}>Section Tentang</h3>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Badge Section (misal: FunTastik)</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={settings.aboutBadge}
                                        onChange={e => setSettings({ ...settings, aboutBadge: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Judul Section</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={settings.aboutTitle}
                                        onChange={e => setSettings({ ...settings, aboutTitle: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Paragraf 1</label>
                                    <textarea
                                        className={styles.textarea}
                                        value={settings.aboutText1}
                                        onChange={e => setSettings({ ...settings, aboutText1: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Paragraf 2</label>
                                    <textarea
                                        className={styles.textarea}
                                        value={settings.aboutText2}
                                        onChange={e => setSettings({ ...settings, aboutText2: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'contact' && (
                        <div className={styles.modalForm}>
                            <div className={styles.formSection}>
                                <h3 className={styles.sectionTitle}>Media Sosial & Kontak</h3>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}><UserIcon size={14} style={{ marginRight: '5px' }} /> Instagram (URL/Username)</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        placeholder="@vibrantpulse"
                                        value={settings.instagram || ''}
                                        onChange={e => setSettings({ ...settings, instagram: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}><MessageCircle size={14} style={{ marginRight: '5px' }} /> WhatsApp (Nomor)</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        placeholder="628123456789"
                                        value={settings.whatsapp || ''}
                                        onChange={e => setSettings({ ...settings, whatsapp: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}><Mail size={14} style={{ marginRight: '5px' }} /> Email Kontak</label>
                                    <input
                                        type="email"
                                        className={styles.input}
                                        placeholder="hello@vibrantpulse.com"
                                        value={settings.email || ''}
                                        onChange={e => setSettings({ ...settings, email: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
