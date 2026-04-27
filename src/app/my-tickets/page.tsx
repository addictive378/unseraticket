'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Calendar, MapPin, Ticket as TicketIcon, Clock, CheckCircle2, XCircle, AlertCircle, Timer } from 'lucide-react';
import Link from 'next/link';
import QRCodeCanvas from '@/components/QRCodeCanvas';
import styles from './my-tickets.module.css';

const PAYMENT_DEADLINE_MS = 5 * 60 * 1000; // 5 minutes

function CountdownTimer({ createdAt, onExpire }: { createdAt: string; onExpire: () => void }) {
    const [timeLeft, setTimeLeft] = useState(() => {
        const deadline = new Date(createdAt).getTime() + PAYMENT_DEADLINE_MS;
        return Math.max(0, deadline - Date.now());
    });

    useEffect(() => {
        if (timeLeft <= 0) { onExpire(); return; }
        const interval = setInterval(() => {
            const deadline = new Date(createdAt).getTime() + PAYMENT_DEADLINE_MS;
            const remaining = Math.max(0, deadline - Date.now());
            setTimeLeft(remaining);
            if (remaining <= 0) { onExpire(); clearInterval(interval); }
        }, 1000);
        return () => clearInterval(interval);
    }, [createdAt, onExpire, timeLeft]);

    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    const isUrgent = timeLeft < 60000;

    return (
        <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', borderRadius: '10px',
            background: isUrgent ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.12)',
            border: `1px solid ${isUrgent ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.25)'}`,
            color: isUrgent ? '#f87171' : '#fbbf24',
            fontSize: '0.85rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums',
        }}>
            <Timer size={14} />
            {timeLeft <= 0 ? 'Expired' : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
        </div>
    );
}


export default function MyTicketsPage() {
    const router = useRouter();
    const { data: session, status: sessionStatus } = useSession();
    const [purchases, setPurchases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (sessionStatus === 'unauthenticated') {
            router.replace('/login?callbackUrl=/my-tickets');
        }
    }, [sessionStatus, router]);

    const fetchData = useCallback(() => {
        if (sessionStatus !== 'authenticated') return;
        fetch('/api/tickets/my-tickets')
            .then(res => res.json())
            .then(responseData => {
                if (Array.isArray(responseData)) {
                    setPurchases(responseData);
                } else if (responseData && responseData.purchases) {
                    setPurchases(responseData.purchases);
                } else {
                    setPurchases([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Fetch tickets error:', err);
                setPurchases([]);
                setLoading(false);
            });
    }, [sessionStatus]);

    useEffect(() => {
        if (sessionStatus === 'authenticated') {
            fetchData();
        }
    }, [fetchData, sessionStatus]);

    const handleCancel = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin membatalkan pesanan tiket ini?')) return;

        try {
            const res = await fetch(`/api/tickets/purchase/${id}/cancel`, { method: 'POST' });
            if (res.ok) {
                fetchData();
            } else {
                const data = await res.json();
                alert(data.message || 'Gagal membatalkan');
            }
        } catch {
            alert('Terjadi kesalahan');
        }
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'CONFIRMED':
                return { label: 'Terkonfirmasi', className: styles.statusConfirmed, icon: CheckCircle2 };
            case 'PENDING_PAYMENT':
                return { label: 'Menunggu Pembayaran', className: styles.statusWaiting, icon: Clock };
            case 'PENDING_VALIDATION':
                return { label: 'Menunggu Validasi', className: styles.statusPending, icon: AlertCircle };
            case 'REJECTED':
                return { label: 'Ditolak', className: styles.statusRejected, icon: XCircle };
            case 'CANCELLED':
                return { label: 'Dibatalkan', className: styles.statusRejected, icon: XCircle };
            default:
                return { label: status, className: styles.statusPending, icon: Clock };
        }
    };

    if (loading || sessionStatus === 'loading') {
        return (
            <div className={styles.page}>
                <div className="container" style={{ textAlign: 'center', marginTop: '5rem' }}>
                    <p style={{ color: 'rgba(255,255,255,0.6)' }}>Memuat tiket Anda...</p>
                </div>
            </div>
        );
    }

    const hasActivity = purchases.length > 0;

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className="container">
                    <h1 className="gradient-text">Tiket Saya</h1>
                    <p>Pantau tiket acara Anda dan akses kode QR Anda.</p>
                </div>
            </header>

            <section>
                <div className="container">
                    {!hasActivity ? (
                        <div className={styles.emptyState}>
                            <TicketIcon size={48} style={{ color: 'rgba(255,255,255,0.2)', marginBottom: '1rem' }} />
                            <h3>Tidak ada tiket ditemukan</h3>
                            <p>Jelajahi acara kami untuk memesan tiket pertama Anda.</p>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'center' }}>
                                <Link href="/tickets" className="btn-primary" style={{ textDecoration: 'none' }}>LIHAT TIKET</Link>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.ticketList}>
                            {purchases.map((purchase: any) => {
                                const statusInfo = getStatusInfo(purchase.status);
                                const StatusIcon = statusInfo.icon;
                                const issuedTickets = purchase.issuedTickets || [];

                                return (
                                    <div key={purchase.id} className={`${styles.ticketCard} glass`}>
                                        <div className={styles.cardInfo}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                                <span className={`${styles.statusBadge} ${statusInfo.className}`}>
                                                    <StatusIcon size={12} /> {statusInfo.label}
                                                </span>
                                            </div>

                                            <h3 className={styles.eventName}>{purchase.ticket?.event?.name || 'Nama acara tidak tersedia'}</h3>

                                            <div className={styles.meta}>
                                                {purchase.ticket?.event?.date && (
                                                    <span><Calendar size={14} /> {new Date(purchase.ticket.event.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                                )}
                                                {purchase.ticket?.event?.location && (
                                                    <span><MapPin size={14} /> {purchase.ticket.event.location}</span>
                                                )}
                                            </div>

                                            <div className={styles.detailRow}>
                                                <div className={styles.detailItem}>
                                                    <span className={styles.detailLabel}>Jenis Tiket</span>
                                                    <span className={styles.detailValue}>{purchase.ticket?.type}</span>
                                                </div>
                                                <div className={styles.detailItem}>
                                                    <span className={styles.detailLabel}>Jumlah</span>
                                                    <span className={styles.detailValue}>{purchase.quantity}x</span>
                                                </div>
                                                <div className={styles.detailItem}>
                                                    <span className={styles.detailLabel}>Total</span>
                                                    <span className={styles.detailValue}>Rp {purchase.totalPurchase?.toLocaleString('id-ID')}</span>
                                                </div>
                                                <div className={styles.detailItem}>
                                                    <span className={styles.detailLabel}>ID</span>
                                                    <span className={styles.detailValue}>{purchase.id.slice(0, 8)}...</span>
                                                </div>
                                            </div>

                                            {purchase.status === 'REJECTED' && purchase.rejectedReason && (
                                                <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.85rem', color: '#f87171' }}>
                                                    Alasan: {purchase.rejectedReason}
                                                </div>
                                            )}

                                            {purchase.status === 'PENDING_PAYMENT' && (
                                                <div style={{ marginTop: '1rem' }}>
                                                    <div style={{ marginBottom: '0.75rem' }}>
                                                        <CountdownTimer
                                                            createdAt={purchase.createdAt}
                                                            onExpire={fetchData}
                                                        />
                                                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginLeft: '0.5rem' }}>Batas waktu pembayaran</span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                                        <Link href={`/my-tickets/${purchase.id}/upload`} className="btn-primary" style={{ textDecoration: 'none', fontSize: '0.85rem' }}>
                                                            Selesaikan Pembayaran
                                                        </Link>
                                                        <button
                                                            onClick={() => handleCancel(purchase.id)}
                                                            className={styles.cancelButton}
                                                        >
                                                            Batalkan Pesanan
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {purchase.status === 'PENDING_VALIDATION' && (
                                                <div style={{ marginTop: '1rem' }}>
                                                    <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: '0.85rem', color: '#fbbf24', marginBottom: '0.75rem' }}>
                                                        ⏳ Bukti pembayaran sudah dikirim. Menunggu validasi admin. QR code tiket akan muncul setelah disetujui.
                                                    </div>
                                                    <button
                                                        onClick={() => handleCancel(purchase.id)}
                                                        className={styles.cancelButton}
                                                    >
                                                        Batalkan Pesanan
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {purchase.status === 'CONFIRMED' && issuedTickets.length > 0 && (
                                            <div className={styles.issuedSection}>
                                                <div className={styles.issuedHeader}>
                                                    <TicketIcon size={16} />
                                                    <span>Tiket Anda ({issuedTickets.length})</span>
                                                </div>
                                                <div className={styles.issuedGrid}>
                                                    {issuedTickets.map((issued: any, idx: number) => (
                                                        <div key={issued.id} className={styles.issuedCard}>
                                                            <div className={styles.issuedCardHeader}>
                                                                <span className={styles.issuedIndex}>#{idx + 1}</span>
                                                                <span className={styles.issuedType}>{purchase.ticket?.type}</span>
                                                            </div>
                                                            <div className={styles.qrSection}>
                                                                <QRCodeCanvas value={`VIBRANT-TICKET:${issued.id}`} size={150} />
                                                            </div>
                                                            <div className={styles.issuedDetails}>
                                                                <div className={styles.issuedName}>{issued.holderName}</div>
                                                                <div className={styles.issuedId}>{issued.id}</div>
                                                                {issued.isUsed && (
                                                                    <span className={styles.usedBadge}>SUDAH DIGUNAKAN</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
