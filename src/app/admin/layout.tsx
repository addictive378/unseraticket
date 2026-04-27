'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Calendar,
    Store,
    Users,
    Settings,
    LogOut,
    Bell,
    ShoppingCart,
    Trophy,
    ScanLine,
    ClipboardList,
    Globe,
    Menu,
    X
} from 'lucide-react';
import styles from './admin.module.css';
import { signOut } from 'next-auth/react';
import NotificationDropdown from './components/NotificationDropdown';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const isActive = (path: string) => pathname === path;

    // Close sidebar on route change (for mobile)
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    return (
        <div className={styles.wrapper}>
            {/* Sidebar Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    className={styles.sidebarOverlay}
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.logo}>
                    PANEL <span>ADM</span>
                    <button className={styles.closeBtn} onClick={() => setIsSidebarOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                <nav className={styles.nav}>
                    <Link
                        href="/admin"
                        className={`${styles.navLink} ${isActive('/admin') ? styles.active : ''}`}
                    >
                        <LayoutDashboard size={18} /> Dashboard
                    </Link>
                    <Link
                        href="/admin/events"
                        className={`${styles.navLink} ${isActive('/admin/events') ? styles.active : ''}`}
                    >
                        <Calendar size={18} /> Acara & Tiket
                    </Link>
                    <Link
                        href="/admin/sales"
                        className={`${styles.navLink} ${isActive('/admin/sales') ? styles.active : ''}`}
                    >
                        <ShoppingCart size={18} /> Pembayaran
                    </Link>
                    <Link
                        href="/admin/scan-ticket"
                        className={`${styles.navLink} ${isActive('/admin/scan-ticket') ? styles.active : ''}`}
                    >
                        <ScanLine size={18} /> Scan Tiket
                    </Link>
                    <Link
                        href="/admin/scan-log"
                        className={`${styles.navLink} ${isActive('/admin/scan-log') ? styles.active : ''}`}
                    >
                        <ClipboardList size={18} /> Log Scan
                    </Link>
                    <Link
                        href="/admin/users"
                        className={`${styles.navLink} ${isActive('/admin/users') ? styles.active : ''}`}
                    >
                        <Users size={18} /> Pengguna
                    </Link>
                    <Link
                        href="/admin/settings"
                        className={`${styles.navLink} ${isActive('/admin/settings') ? styles.active : ''}`}
                    >
                        <Settings size={18} /> Pengaturan
                    </Link>

                    <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
                        <Link
                            href="/"
                            className={styles.navLink}
                            style={{ color: 'var(--secondary)' }}
                        >
                            <Globe size={18} /> Lihat Website
                        </Link>
                    </div>
                </nav>

                <div className={styles.sidebarFooter}>
                    <button className={styles.logoutBtn} onClick={() => signOut({ callbackUrl: '/' })}>
                        <LogOut size={20} /> Keluar
                    </button>
                </div>
            </aside>

            <div className={styles.mainContent}>
                <header className={`${styles.topHeader} glass`}>
                    <div className={styles.headerLeft}>
                        <button
                            className={styles.menuBtn}
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu size={24} />
                        </button>
                        <h1>Admin Panel</h1>
                    </div>
                    <div className={styles.headerRight}>
                        <NotificationDropdown />
                        <div className={styles.adminProfile}>
                            <div className={styles.avatar}>A</div>
                            <span className={styles.adminRole}>Administrator</span>
                        </div>
                    </div>
                </header>

                <main className={styles.content}>
                    {children}
                </main>
            </div>
        </div>
    );
}
