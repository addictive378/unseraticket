'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Menu, X } from 'lucide-react';
import styles from './Navbar.module.css';

export default function Navbar() {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const [branding, setBranding] = useState({ logoText: 'VIBRANT', logoSuffix: 'PULSE' });
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        fetch('/api/site-settings')
            .then(res => res.json())
            .then(data => {
                if (data.logoText) setBranding({
                    logoText: data.logoText,
                    logoSuffix: data.logoSuffix || ''
                });
            })
            .catch(err => console.error('Failed to fetch navbar branding:', err));
    }, []);

    // Close menu when route changes
    useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);

    // Jangan tampilkan navbar user di halaman admin
    if (pathname?.startsWith('/admin')) {
        return null;
    }

    return (
        <nav className={styles.navbar}>
            <div className={`${styles.container} container`}>
                <div className={styles.navLeft}>
                    <div className={styles.logo}>
                        <Link href="/">
                            {branding.logoText} <span className="gradient-text">{branding.logoSuffix}</span>
                        </Link>
                    </div>
                </div>

                <div className={styles.navCenter}>
                    <div className={styles.links}>
                        <Link href="/" className={`${styles.link} ${pathname === '/' ? styles.active : ''}`}>BERANDA</Link>
                        <Link href="/tickets" className={`${styles.link} ${pathname?.startsWith('/tickets') ? styles.active : ''}`}>TIKET</Link>
                        <Link href="/competitions" className={`${styles.link} ${pathname?.startsWith('/competitions') ? styles.active : ''}`}>KOMPETISI</Link>
                        <Link href="/bazar" className={`${styles.link} ${pathname?.startsWith('/bazar') ? styles.active : ''}`}>BAZAR</Link>
                    </div>
                </div>

                <div className={styles.navRight}>
                    <div className={styles.actions}>
                        {status === 'authenticated' ? (
                            <>
                                <div className={styles.userLinks}>
                                    {session?.user?.role === 'ADMIN' && (
                                        <Link href="/admin" className={styles.link} style={{ color: 'var(--primary)' }}>
                                            ADMIN PANEL
                                        </Link>
                                    )}
                                    <Link href="/my-tickets" className={styles.link}>TIKET SAYA</Link>
                                </div>
                                <div className={styles.profileArea}>
                                    <span className={styles.userName}>Hai, {session.user?.name?.split(' ')[0] || 'User'}</span>
                                    <button
                                        onClick={() => signOut({ callbackUrl: '/' })}
                                        className={styles.logoutBtn}
                                    >
                                        Keluar
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className={styles.authButtons}>
                                <Link href="/login" className={styles.loginBtn}>Masuk</Link>
                                <Link href="/signup" className="btn-primary" style={{ padding: '0.6rem 1.5rem' }}>Daftar</Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Hamburger Toggle */}
                <button className={styles.hamburger} onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {/* Mobile Menu Overlay */}
                {isMenuOpen && (
                    <div className={styles.mobileMenu}>
                        <Link href="/" className={`${styles.link} ${pathname === '/' ? styles.active : ''}`}>BERANDA</Link>
                        <Link href="/tickets" className={`${styles.link} ${pathname?.startsWith('/tickets') ? styles.active : ''}`}>TIKET</Link>
                        <Link href="/competitions" className={`${styles.link} ${pathname?.startsWith('/competitions') ? styles.active : ''}`}>KOMPETISI</Link>
                        <Link href="/bazar" className={`${styles.link} ${pathname?.startsWith('/bazar') ? styles.active : ''}`}>BAZAR</Link>

                        <div className={styles.mobileActions}>
                            {status === 'authenticated' ? (
                                <>
                                    {session?.user?.role === 'ADMIN' && (
                                        <Link href="/admin" className={styles.link} style={{ color: 'var(--primary)' }}>
                                            ADMIN PANEL
                                        </Link>
                                    )}
                                    <Link href="/my-tickets" className={styles.link}>TIKET SAYA</Link>
                                    <div style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                                        Hai, {session.user?.name}
                                    </div>
                                    <button
                                        onClick={() => signOut({ callbackUrl: '/' })}
                                        className={styles.logoutBtn}
                                        style={{ width: '100%', marginTop: '0.5rem' }}
                                    >
                                        KELUAR
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link href="/login" className="btn-outline" style={{ justifyContent: 'center' }}>Masuk</Link>
                                    <Link href="/signup" className="btn-primary" style={{ justifyContent: 'center' }}>Daftar</Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
