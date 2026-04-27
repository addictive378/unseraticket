'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Calendar, Ticket as TicketIcon, User, Minus, Plus, ChevronLeft, ArrowRight, CheckCircle2, ShieldCheck, Zap, MessageCircle, Upload, Clock } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './checkout.module.css';

export default function CheckoutPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session, status: sessionStatus } = useSession();
    const eventId = params.eventId as string;

    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedTierId, setSelectedTierId] = useState<string>('');
    const [quantity, setQuantity] = useState(1);
    const [buyerName, setBuyerName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1); // 1: Selection, 2: Details, 3: Payment

    // After order created
    const [purchaseId, setPurchaseId] = useState<string | null>(null);
    const [waLink, setWaLink] = useState<string>('');
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [uploadingProof, setUploadingProof] = useState(false);
    const [proofUploaded, setProofUploaded] = useState(false);

    useEffect(() => {
        if (sessionStatus === 'unauthenticated') {
            router.replace(`/login?callbackUrl=/checkout/${eventId}`);
        }
    }, [sessionStatus, router, eventId]);

    useEffect(() => {
        const fetchEventDetails = async () => {
            try {
                const res = await fetch(`/api/events`);
                const events = await res.json();
                const foundEvent = events.find((e: any) => e.id === eventId);
                if (!foundEvent) {
                    setError('Event not found');
                    setLoading(false);
                    return;
                }
                setEvent(foundEvent);
                if (foundEvent.tickets && foundEvent.tickets.length > 0) {
                    const firstAvailable = foundEvent.tickets.find((t: any) => t.stock > 0);
                    setSelectedTierId(firstAvailable?.id || '');
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching event details:', error);
                setError('Failed to load event details');
                setLoading(false);
            }
        };
        fetchEventDetails();
    }, [eventId]);

    // Check for existing pending orders
    useEffect(() => {
        if (sessionStatus === 'authenticated') {
            const checkPending = async () => {
                try {
                    const res = await fetch('/api/tickets/my-tickets');
                    const purchases = await res.json();
                    if (Array.isArray(purchases)) {
                        const pending = purchases.find(p => p.status === 'PENDING_PAYMENT');
                        if (pending) {
                            setError('Anda memiliki pesanan yang belum dibayar. Selesaikan pesanan Anda di My Tickets sebelum membuat pesanan baru.');
                        }
                    }
                } catch (error) {
                    console.error('Error checking purchases:', error);
                }
            };
            checkPending();
        }
    }, [sessionStatus]);

    useEffect(() => {
        if (session?.user) {
            setBuyerName(prev => prev === '' ? (session.user?.name || '') : prev);
        }
    }, [session]);

    const selectedTier = useMemo(() =>
        event?.tickets?.find((t: any) => t.id === selectedTierId)
        , [event, selectedTierId]);

    const subtotal = selectedTier ? selectedTier.price * quantity : 0;
    const total = subtotal;

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();

        if (step === 1) {
            setStep(2);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        if (step === 2) {
            if (!buyerName.trim()) {
                setError('Please fill in your name');
                return;
            }

            setSubmitting(true);
            setError('');

            try {
                const res = await fetch('/api/tickets/purchase', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ticketId: selectedTierId,
                        quantity,
                        buyerName: buyerName.trim(),
                    }),
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.message || 'Order failed');
                }

                const data = await res.json();
                setPurchaseId(data.purchase.id);
                setWaLink(data.waLink);
                setStep(3);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (err: any) {
                setError(err.message);
            } finally {
                setSubmitting(false);
            }
        }
    };

    const handleUploadProof = async () => {
        if (!proofFile || !purchaseId) return;

        setUploadingProof(true);
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

            setProofUploaded(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploadingProof(false);
        }
    };

    if (loading) return (
        <div className={styles.page}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
                <div className={styles.loadingSpinner}></div>
                <p style={{ marginTop: '1rem', opacity: 0.4 }}>Syncing secure checkout...</p>
            </div>
        </div>
    );

    if (error && !event) return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                    <ShieldCheck size={48} color="var(--accent)" style={{ marginBottom: '1.5rem' }} />
                    <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Access Denied</h2>
                    <p style={{ opacity: 0.6, marginBottom: '2rem' }}>{error}</p>
                    <Link href="/tickets" className="btn-primary">Return to Events</Link>
                </div>
            </div>
        </div>
    );

    const stepsList = [
        { id: 1, name: 'Selection', icon: TicketIcon },
        { id: 2, name: 'Details', icon: User },
        { id: 3, name: 'Payment', icon: MessageCircle }
    ];

    return (
        <div className={styles.page}>
            <div className={styles.ambientBg}>
                <div className={styles.glowTop}></div>
                <div className={styles.glowBottom}></div>
            </div>

            <div className={styles.container}>
                <Link href="/tickets" className={styles.backLink}>
                    <ChevronLeft size={16} /> LIHAT ACARA
                </Link>

                <header className={styles.header}>
                    <div className={styles.title}>
                        <h1 className="gradient-text">PEMBAYARAN</h1>
                        <p className={styles.subtitle}>{event.name}</p>
                    </div>

                    <div className={styles.steps}>
                        {stepsList.map((s, idx) => (
                            <div key={s.id} style={{ display: 'flex', alignItems: 'center' }}>
                                <div className={`${styles.step} ${step >= s.id ? styles.stepActive : ''}`}>
                                    <s.icon className={styles.stepIcon} />
                                    <span className={styles.stepText}>{s.name}</span>
                                </div>
                                {idx < stepsList.length - 1 && <div className={styles.stepDivider}></div>}
                            </div>
                        ))}
                    </div>
                </header>

                <div className={styles.mainGrid}>
                    <div className={styles.contentArea}>
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                >
                                    <div className={styles.sectionHeader}>
                                        <div className={`${styles.sectionNumber} ${styles.numberPurple}`}>1</div>
                                        <h3>Pilih Tiket</h3>
                                    </div>

                                    <div className={styles.tierGrid}>
                                        {event?.tickets?.map((tier: any) => {
                                            const isSoldOut = tier.stock <= 0;
                                            const isClosed = tier.status === 'CLOSED';
                                            const isDisabled = isSoldOut || isClosed;

                                            return (
                                                <div
                                                    key={tier.id}
                                                    onClick={() => !isDisabled && setSelectedTierId(tier.id)}
                                                    className={`${styles.tierCard} ${selectedTierId === tier.id ? styles.tierCardSelected : ''}`}
                                                    style={isDisabled ? { opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' as const } : {}}
                                                >
                                                    <div className={styles.tierHeader}>
                                                        <div className={styles.tierInfo}>
                                                            <h4>
                                                                {tier.type}
                                                                {tier.type.toLowerCase().includes('vip') && <span className={styles.premiumBadge}>PREMIUM</span>}
                                                                {isSoldOut && <span style={{ marginLeft: '0.5rem', padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>HABIS</span>}
                                                                {!isSoldOut && isClosed && <span style={{ marginLeft: '0.5rem', padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, background: 'rgba(100,100,100,0.2)', color: '#aaa', border: '1px solid rgba(100,100,100,0.3)' }}>CLOSED</span>}
                                                            </h4>
                                                            <div className={styles.stockInfo}>
                                                                <Zap className={styles.stockIcon} size={12} />
                                                                {isSoldOut ? 'Habis' : (isClosed ? 'Tiket Ditutup' : `${tier.stock} slot tersisa`)}
                                                            </div>
                                                        </div>
                                                        <div className={styles.tierPrice}>
                                                            <div className={styles.priceAmount}>Rp {tier.price.toLocaleString()}</div>
                                                            <div className={styles.priceLabel}>Per Tiket</div>
                                                        </div>
                                                    </div>
                                                    {tier.description && (
                                                        <div className={styles.tierDescription}>"{tier.description}"</div>
                                                    )}
                                                    {selectedTierId === tier.id && (
                                                        <div className={styles.checkMark}><CheckCircle2 size={16} /></div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className={styles.sectionHeader} style={{ marginTop: '3rem' }}>
                                        <div className={`${styles.sectionNumber} ${styles.numberPink}`}>2</div>
                                        <h3>Jumlah</h3>
                                    </div>

                                    <div className={styles.quantityCard}>
                                        <div className={styles.quantityLabel}>
                                            <p>Berapa banyak tiket?</p>
                                            <p>Bebas tanpa batas</p>
                                        </div>
                                        <div className={styles.quantityControls}>
                                            <button
                                                className={styles.qBtn}
                                                disabled={quantity <= 1}
                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            >
                                                <Minus size={20} />
                                            </button>
                                            <div className={styles.qValue}>{quantity}</div>
                                            <button
                                                className={styles.qBtn}
                                                onClick={() => setQuantity(quantity + 1)}
                                            >
                                                <Plus size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <button onClick={() => setStep(1)} className={styles.backLink} style={{ margin: '0 0 1.5rem 0', background: 'none', padding: 0 }}>
                                        <ChevronLeft size={16} /> UBAH PILIHAN
                                    </button>

                                    <div className={styles.sectionHeader}>
                                        <div className={`${styles.sectionNumber} ${styles.numberPurple}`}>3</div>
                                        <h3>Detail Pembeli</h3>
                                    </div>

                                    <div className={styles.formBox}>
                                        <div className={styles.inputGroup}>
                                            <label>Nama di bawah harus sesuai dengan nama yang digunakan untuk melakukan pembayaran</label>
                                            <div className={styles.inputWrapper}>
                                                <User className={styles.inputIcon} size={18} />
                                                <input
                                                    className={styles.inputField}
                                                    type="text"
                                                    value={buyerName}
                                                    onChange={(e) => setBuyerName(e.target.value)}
                                                    placeholder="Nama lengkap Anda"
                                                    required
                                                />
                                            </div>
                                            <p className={styles.inputHint}>Tiket akan diterbitkan atas nama ini.</p>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '2rem', padding: '1.25rem', borderRadius: '12px', background: 'rgba(250, 222, 91, 0.08)', border: '1px solid rgba(250, 222, 91, 0.2)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                            <MessageCircle size={18} style={{ color: '#25D366' }} />
                                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Pembayaran via WhatsApp</span>
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                                            Setelah konfirmasi, Anda akan diarahkan ke WhatsApp untuk menghubungi admin kami untuk detail pembayaran (transfer bank). Setelah transfer, unggah bukti pembayaran Anda di sini.
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    {proofUploaded ? (
                                        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                                            <CheckCircle2 size={64} style={{ color: '#10b981', marginBottom: '1.5rem' }} />
                                            <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Bukti Pembayaran Terkirim!</h2>
                                            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem', lineHeight: 1.7 }}>
                                                Admin akan memvalidasi pembayaran Anda. Setelah disetujui, tiket akan muncul di halaman <strong>My Tickets</strong> lengkap dengan QR code unik.
                                            </p>
                                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginBottom: '2rem' }}>
                                                Order ID: <code style={{ color: 'var(--primary)' }}>{purchaseId}</code>
                                            </p>
                                            <Link href="/my-tickets" className="btn-primary" style={{ textDecoration: 'none' }}>
                                                GO TO MY TICKETS <ArrowRight size={16} />
                                            </Link>
                                        </div>
                                    ) : (
                                        <>
                                            <div className={styles.sectionHeader}>
                                                <div className={`${styles.sectionNumber} ${styles.numberPurple}`}>
                                                    <MessageCircle size={16} />
                                                </div>
                                                <h3>Pembayaran via WhatsApp</h3>
                                            </div>

                                            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2rem', fontSize: '0.9rem', lineHeight: 1.7 }}>
                                                Order berhasil dibuat! Sekarang hubungi admin via WhatsApp untuk mendapatkan nomor rekening, lalu transfer dan upload bukti pembayaran di bawah.
                                            </p>

                                            {/* Step A: WhatsApp */}
                                            <div style={{ marginBottom: '2rem', padding: '1.5rem', borderRadius: '16px', background: 'rgba(37, 211, 102, 0.08)', border: '1px solid rgba(37, 211, 102, 0.2)' }}>
                                                <h4 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>1</span>
                                                    Hubungi Admin via WhatsApp
                                                </h4>
                                                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>
                                                    Klik tombol di bawah untuk mengirim pesan otomatis ke admin. Admin akan mengirimkan nomor rekening untuk transfer.
                                                </p>
                                                <a
                                                    href={waLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                                                        background: '#25D366', color: 'white', padding: '0.85rem 1.5rem',
                                                        borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem',
                                                        textDecoration: 'none', transition: 'all 0.2s',
                                                    }}
                                                >
                                                    <MessageCircle size={20} /> Chat WhatsApp Admin
                                                </a>
                                            </div>

                                            {/* Step B: Upload Proof */}
                                            <div style={{ padding: '1.5rem', borderRadius: '16px', background: 'rgba(250, 222, 91, 0.08)', border: '1px solid rgba(250, 222, 91, 0.2)' }}>
                                                <h4 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary)', color: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>2</span>
                                                    Upload Bukti Pembayaran
                                                </h4>
                                                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>
                                                    Setelah transfer, upload foto/screenshot bukti pembayaran di bawah ini.
                                                </p>
                                                <h4 style={{ color: 'var(--accent)', marginBottom: '1rem' }}> Gambar harus jelas tidak ada bagian yang terpotong!</h4>
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
                                                        onClick={handleUploadProof}
                                                        disabled={!proofFile || uploadingProof}
                                                        className="btn-primary"
                                                        style={{ opacity: !proofFile ? 0.5 : 1 }}
                                                    >
                                                        {uploadingProof ? 'Uploading...' : (
                                                            <><Upload size={16} /> UPLOAD BUKTI PEMBAYARAN</>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            {error && <div className={styles.errorToast} style={{ marginTop: '1.5rem' }}>{error}</div>}

                                            <div style={{ marginTop: '2rem', padding: '1.25rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                                                    <Clock size={14} />
                                                    <span>Order ID: <code style={{ color: 'var(--primary)' }}>{purchaseId}</code></span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <aside className={styles.sidebar}>
                        <div className={styles.summaryCard}>
                            <div className={styles.eventBanner}>
                                {event.image && <img src={event.image} alt="" className={styles.bannerImg} />}
                                <div className={styles.bannerOverlay}></div>
                                <div className={styles.bannerContent}>
                                    <div className={styles.dateInfo}>
                                        <Calendar className={styles.dateIcon} size={12} />
                                        {new Date(event.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                    </div>
                                    <div className={styles.eventName}>{event.name}</div>
                                </div>
                            </div>

                            {step < 3 && (
                                <form onSubmit={handleCreateOrder}>
                                    <div className={styles.lineItems}>
                                        <div className={styles.lineItem}>
                                            <span className={styles.itemLabel}>
                                                <div className={styles.dot} style={{ background: 'var(--primary)' }}></div>
                                                {selectedTier?.type} x{quantity}
                                            </span>
                                            <span className={styles.itemValue}>Rp {subtotal.toLocaleString()}</span>
                                        </div>
                                        <div className={styles.lineItem}>
                                            <span className={styles.itemLabel}>
                                                <div className={styles.dot} style={{ background: 'var(--accent)' }}></div>
                                                Platform Fee
                                            </span>
                                            <span className={styles.itemValue} style={{ color: '#22c55e' }}>FREE</span>
                                        </div>
                                    </div>

                                    <div className={styles.totalSection}>
                                        <div className={styles.totalLabel}>Grand Total</div>
                                        <div className={styles.totalValue}>Rp {total.toLocaleString()}</div>
                                    </div>

                                    <button
                                        className={styles.payButton}
                                        type="submit"
                                        disabled={submitting || (error !== '' && error.includes('belum dibayar'))}
                                    >
                                        {submitting ? <div className={styles.loadingSpinner} style={{ width: '1.5rem', height: '1.5rem' }}></div> : (
                                            <>
                                                {step === 1 ? 'CONTINUE' : 'PLACE ORDER'} <ArrowRight size={18} />
                                            </>
                                        )}
                                    </button>

                                    {error && step < 3 && <div className={styles.errorToast}>{error}</div>}
                                </form>
                            )}

                            {step === 3 && (
                                <div className={styles.lineItems}>
                                    <div className={styles.lineItem}>
                                        <span className={styles.itemLabel}>
                                            <div className={styles.dot} style={{ background: 'var(--primary)' }}></div>
                                            {selectedTier?.type} x{quantity}
                                        </span>
                                        <span className={styles.itemValue}>Rp {subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className={styles.totalSection}>
                                        <div className={styles.totalLabel}>Grand Total</div>
                                        <div className={styles.totalValue}>Rp {total.toLocaleString()}</div>
                                    </div>
                                </div>
                            )}

                            <div className={styles.trustBadges}>
                                <ShieldCheck size={20} />
                                <div className={styles.dividerSmall}></div>
                                <div className={styles.badgeIcons}>
                                    <MessageCircle size={18} />
                                    <Zap size={18} />
                                </div>
                            </div>
                        </div>

                        <div className={styles.securityFooter}>
                            <div className={styles.secIconBox}><ShieldCheck size={16} /></div>
                            <span className={styles.secText}>Secure WhatsApp Payment</span>
                        </div>
                    </aside>
                </div>
            </div>

            <style jsx>{`
                .gradient-text {
                    background: linear-gradient(135deg, #fff 0%, var(--primary) 50%, var(--accent) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
            `}</style>
        </div>
    );
}
