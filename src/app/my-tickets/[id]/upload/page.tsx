'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Upload, CheckCircle2, MessageCircle, ArrowRight, ChevronLeft, Clock, ShieldCheck, Timer, XCircle } from 'lucide-react';
import Link from 'next/link';

const PAYMENT_DEADLINE_MS = 5 * 60 * 1000;

export default function UploadProofPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session, status: sessionStatus } = useSession();
    const purchaseId = params.id as string;

    const [purchase, setPurchase] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploaded, setUploaded] = useState(false);
    const [error, setError] = useState('');
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [expired, setExpired] = useState(false);

    const waNumber = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || '6281908323126';

    useEffect(() => {
        if (sessionStatus === 'unauthenticated') {
            router.replace('/login?callbackUrl=/my-tickets');
        }
    }, [sessionStatus, router]);

    useEffect(() => {
        if (sessionStatus !== 'authenticated') return;
        fetch('/api/tickets/my-tickets')
            .then(res => res.json())
            .then(data => {
                const found = (Array.isArray(data) ? data : []).find((p: any) => p.id === purchaseId);
                setPurchase(found || null);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [sessionStatus, purchaseId]);

    // Countdown timer
    useEffect(() => {
        if (!purchase?.createdAt || purchase.status !== 'PENDING_PAYMENT') return;
        const deadline = new Date(purchase.createdAt).getTime() + PAYMENT_DEADLINE_MS;
        const remaining = Math.max(0, deadline - Date.now());
        if (remaining <= 0) { setExpired(true); return; }
        setTimeLeft(remaining);
        const interval = setInterval(() => {
            const r = Math.max(0, deadline - Date.now());
            setTimeLeft(r);
            if (r <= 0) { setExpired(true); clearInterval(interval); }
        }, 1000);
        return () => clearInterval(interval);
    }, [purchase]);

    const handleUpload = async () => {
        if (!proofFile || expired) return;
        setUploading(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('file', proofFile);
            const res = await fetch(`/api/tickets/purchase/${purchaseId}/upload-proof`, {
                method: 'POST',
                body: formData,
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Upload failed');
            }
            setUploaded(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    const isUrgent = timeLeft < 60000;

    if (loading || sessionStatus === 'loading') {
        return (
            <div style={{ paddingTop: '120px', textAlign: 'center' }}>
                <p style={{ color: 'rgba(255,255,255,0.6)' }}>Loading...</p>
            </div>
        );
    }

    if (!purchase) {
        return (
            <div style={{ paddingTop: '120px', textAlign: 'center' }}>
                <h2>Order tidak ditemukan</h2>
                <Link href="/my-tickets" className="btn-primary" style={{ marginTop: '1rem', textDecoration: 'none' }}>
                    Kembali ke My Tickets
                </Link>
            </div>
        );
    }

    if (expired || purchase.status === 'CANCELLED') {
        return (
            <div style={{ paddingTop: '120px', minHeight: '100vh' }}>
                <div className="container" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '3rem 1rem' }}>
                    <XCircle size={64} style={{ color: '#ef4444', marginBottom: '1.5rem' }} />
                    <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Order Kedaluwarsa</h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem', lineHeight: 1.7 }}>
                        Batas waktu 5 menit untuk pembayaran telah habis. Order ini otomatis dibatalkan. Silakan buat order baru.
                    </p>
                    <Link href="/tickets" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        BUAT ORDER BARU <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        );
    }

    if (uploaded) {
        return (
            <div style={{ paddingTop: '120px', minHeight: '100vh' }}>
                <div className="container" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '3rem 1rem' }}>
                    <CheckCircle2 size={64} style={{ color: '#10b981', marginBottom: '1.5rem' }} />
                    <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Bukti Pembayaran Terkirim!</h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem', lineHeight: 1.7 }}>
                        Admin akan memvalidasi pembayaran Anda. Setelah disetujui, tiket akan muncul dengan QR code unik di halaman <strong>My Tickets</strong>.
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginBottom: '2rem' }}>
                        Order ID: <code style={{ color: 'var(--primary)' }}>{purchaseId}</code>
                    </p>
                    <Link href="/my-tickets" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        KEMBALI KE MY TICKETS <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        );
    }

    const waMessage = encodeURIComponent(
        `Halo Admin, saya ingin melakukan pembayaran tiket:\n\n` +
        `📋 Order ID: ${purchase.id}\n` +
        `🎫 Event: ${purchase.ticket.event.name}\n` +
        `🏷️ Tipe: ${purchase.ticket.type}\n` +
        `👤 Nama: ${purchase.buyerName}\n` +
        `📦 Qty: ${purchase.quantity}\n` +
        `💰 Total: Rp ${purchase.totalPurchase.toLocaleString('id-ID')}\n\n` +
        `Mohon info rekening untuk transfer. Terima kasih!`
    );
    const waLink = `https://wa.me/${waNumber}?text=${waMessage}`;

    return (
        <div style={{ paddingTop: '120px', minHeight: '100vh' }}>
            <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <Link href="/my-tickets" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', textDecoration: 'none', marginBottom: '2rem', fontWeight: 600 }}>
                    <ChevronLeft size={16} /> KEMBALI KE MY TICKETS
                </Link>

                <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }} className="gradient-text">Upload Bukti Pembayaran</h1>
                <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>
                    {purchase.ticket.event.name} — {purchase.ticket.type} x{purchase.quantity}
                </p>

                {/* Countdown Timer */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '1.5rem',
                    background: isUrgent ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.1)',
                    border: `1px solid ${isUrgent ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.2)'}`,
                }}>
                    <Timer size={20} style={{ color: isUrgent ? '#f87171' : '#fbbf24' }} />
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', fontVariantNumeric: 'tabular-nums', color: isUrgent ? '#f87171' : '#fbbf24' }}>
                            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Sisa waktu untuk upload bukti pembayaran</div>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="glass" style={{ borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Order ID</span>
                        <span style={{ fontFamily: 'monospace', color: 'var(--primary)', fontSize: '0.85rem' }}>{purchase.id}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Buyer</span>
                        <span style={{ fontWeight: 600 }}>{purchase.buyerName}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Total</span>
                        <span style={{ fontWeight: 700, fontSize: '1.15rem', color: '#10b981' }}>Rp {purchase.totalPurchase.toLocaleString('id-ID')}</span>
                    </div>
                </div>

                {/* Step 1: WhatsApp */}
                <div style={{ marginBottom: '1.5rem', padding: '1.5rem', borderRadius: '16px', background: 'rgba(37, 211, 102, 0.08)', border: '1px solid rgba(37, 211, 102, 0.2)' }}>
                    <h4 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>1</span>
                        Hubungi Admin via WhatsApp
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>
                        Klik tombol di bawah untuk mengirim pesan ke admin dan mendapatkan nomor rekening.
                    </p>
                    <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                            background: '#25D366', color: 'white', padding: '0.85rem 1.5rem',
                            borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none',
                        }}
                    >
                        <MessageCircle size={20} /> Chat WhatsApp Admin
                    </a>
                </div>

                {/* Step 2: Upload */}
                <div style={{ padding: '1.5rem', borderRadius: '16px', background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                    <h4 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>2</span>
                        Upload Bukti Pembayaran
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>
                        Setelah transfer, upload foto/screenshot bukti pembayaran.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                            style={{
                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '10px', padding: '0.85rem', color: 'white', width: '100%',
                            }}
                        />
                        {proofFile && (
                            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                                Selected: {proofFile.name}
                            </p>
                        )}
                        <button
                            onClick={handleUpload}
                            disabled={!proofFile || uploading}
                            className="btn-primary"
                            style={{ opacity: !proofFile ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        >
                            {uploading ? 'Uploading...' : <><Upload size={16} /> UPLOAD BUKTI PEMBAYARAN</>}
                        </button>
                    </div>
                    {error && (
                        <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: '0.85rem' }}>
                            {error}
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '2rem', padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>
                    <ShieldCheck size={14} />
                    <span>Data pembayaran Anda aman dan terenkripsi.</span>
                </div>
            </div>
        </div>
    );
}
