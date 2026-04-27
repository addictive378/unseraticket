'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import styles from '../../admin.module.css';
import { ScanLine, CheckCircle2, XCircle, AlertTriangle, RotateCcw, Camera, CameraOff, Store } from 'lucide-react';

export default function ScanBazarRegistrationPage() {
    const scannerRef = useRef<any>(null);
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState<any>(null);
    const [processing, setProcessing] = useState(false);
    const [cameraError, setCameraError] = useState('');
    const [manualCode, setManualCode] = useState('');

    const startScanner = useCallback(async () => {
        setCameraError('');
        setScanResult(null);

        try {
            const { Html5Qrcode } = await import('html5-qrcode');
            const scanner = new Html5Qrcode('qr-reader');
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                async (decodedText: string) => {
                    // Stop scanning on first result
                    try { await scanner.stop(); } catch { }
                    setScanning(false);
                    handleScan(decodedText);
                },
                () => { } // ignore errors during scanning
            );

            setScanning(true);
        } catch (err: any) {
            setCameraError(err.message || 'Gagal mengakses kamera. Pastikan izin kamera diberikan.');
            setScanning(false);
        }
    }, []);

    const stopScanner = async () => {
        if (scannerRef.current) {
            try { await scannerRef.current.stop(); } catch { }
            setScanning(false);
        }
    };

    const handleScan = async (code: string) => {
        setProcessing(true);
        try {
            const res = await fetch('/api/admin/bazars/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketCode: code }),
            });
            const data = await res.json();
            setScanResult(data);
        } catch (error) {
            setScanResult({ valid: false, message: 'Gagal menghubungi server' });
        } finally {
            setProcessing(false);
        }
    };

    const handleManualScan = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualCode.trim()) {
            handleScan(manualCode.trim());
            setManualCode('');
        }
    };

    const resetScan = () => {
        setScanResult(null);
        startScanner();
    };

    useEffect(() => {
        return () => { stopScanner(); };
    }, []);

    return (
        <div>
            <div className={styles.pageHeader}>
                <div>
                    <h1>Scan Peserta Bazaar</h1>
                    <p>Scan QR code peserta untuk verifikasi booth dan kehadiran.</p>
                </div>
            </div>

            <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
                {/* Scanner Area */}
                {!scanResult && (
                    <div className="glass" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                        <div id="qr-reader" style={{ width: '100%', minHeight: scanning ? '300px' : '0' }}></div>

                        {!scanning && (
                            <div style={{ padding: '3rem', textAlign: 'center' }}>
                                <Store size={56} style={{ color: 'var(--primary)', marginBottom: '1.5rem' }} />
                                <h3 style={{ marginBottom: '0.75rem' }}>Bazaar QR Scanner</h3>
                                <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                                    Arahkan kamera ke QR code peserta (ELVIN-BAZAR:xxx)
                                </p>
                                <button onClick={startScanner} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Camera size={18} /> MULAI SCAN
                                </button>

                                {cameraError && (
                                    <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.85rem', color: '#f87171' }}>
                                        {cameraError}
                                    </div>
                                )}
                            </div>
                        )}

                        {scanning && (
                            <div style={{ padding: '1rem', textAlign: 'center' }}>
                                <button onClick={stopScanner} style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', padding: '0.5rem 1rem', borderRadius: '10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                                    <CameraOff size={16} /> Stop Camera
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Manual Input */}
                {!scanResult && (
                    <div className="glass" style={{ borderRadius: '16px', padding: '1.5rem', marginTop: '1.5rem' }}>
                        <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>Masukan kode manual:</h4>
                        <form onSubmit={handleManualScan} style={{ display: 'flex', gap: '0.75rem' }}>
                            <input
                                type="text"
                                value={manualCode}
                                onChange={(e) => setManualCode(e.target.value)}
                                placeholder="ELVIN-BAZAR:xxxxx"
                                className={styles.input}
                                style={{ flex: 1 }}
                            />
                            <button type="submit" className="btn-primary" disabled={processing}>
                                VERIFIKASI
                            </button>
                        </form>
                    </div>
                )}

                {/* Processing */}
                {processing && (
                    <div className="glass" style={{ borderRadius: '20px', padding: '3rem', textAlign: 'center', marginTop: '1.5rem' }}>
                        <div className={styles.loading}>Memverifikasi booth...</div>
                    </div>
                )}

                {/* Scan Result */}
                {scanResult && !processing && (
                    <div className="glass" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                        {/* Result Header */}
                        <div style={{
                            padding: '2.5rem',
                            textAlign: 'center',
                            background: scanResult.valid
                                ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))'
                                : 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
                        }}>
                            {scanResult.valid ? (
                                <CheckCircle2 size={64} style={{ color: '#10b981', marginBottom: '1rem' }} />
                            ) : (
                                <XCircle size={64} style={{ color: '#ef4444', marginBottom: '1rem' }} />
                            )}
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                                {scanResult.valid ? '✅ Booth Terdaftar' : '❌ Verifikasi Gagal'}
                            </h2>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem' }}>
                                {scanResult.message}
                            </p>
                        </div>

                        {/* Participant Details */}
                        {scanResult.registration && (
                            <div style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>ID Registrasi</span>
                                        <span style={{ fontFamily: 'monospace', color: 'var(--primary)', fontSize: '0.85rem' }}>{scanResult.registration.id}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Nama Brand / Toko</span>
                                        <span style={{ fontWeight: 600 }}>{scanResult.registration.buyerName}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Acara</span>
                                        <span style={{ fontWeight: 600 }}>{scanResult.registration.eventName}</span>
                                    </div>
                                    {scanResult.registration.status && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Status</span>
                                            <span style={{ fontWeight: 600, color: '#fbbf24' }}>{scanResult.registration.status}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                            <button onClick={resetScan} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                <RotateCcw size={16} /> SCAN PESERTA LAIN
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
