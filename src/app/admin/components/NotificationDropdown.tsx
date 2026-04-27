'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, Ticket, Store, Trophy, X, ExternalLink } from 'lucide-react';
import styles from '../admin.module.css';

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/notifications');
            const data = await res.json();
            setNotifications(data.items || []);
            setCount(data.count || 0);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Refresh every 2 minutes
        const interval = setInterval(fetchNotifications, 120000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'TICKET': return <Ticket size={16} />;
            case 'BAZAR': return <Store size={16} />;
            case 'COMPETITION': return <Trophy size={16} />;
            default: return <Bell size={16} />;
        }
    };

    const getIconClass = (type: string) => {
        switch (type) {
            case 'TICKET': return { background: 'rgba(255, 0, 204, 0.1)', color: 'var(--primary)' };
            case 'BAZAR': return { background: 'rgba(0, 242, 255, 0.1)', color: 'var(--secondary)' };
            case 'COMPETITION': return { background: 'rgba(250, 222, 91, 0.1)', color: '#facc15' };
            default: return { background: 'rgba(255, 255, 255, 0.05)', color: 'white' };
        }
    };

    return (
        <div className={styles.notifWrapper} ref={dropdownRef}>
            <button
                className={styles.iconBtn}
                onClick={() => setIsOpen(!isOpen)}
                title="Notifications"
            >
                <Bell size={20} />
                {count > 0 && <span className={styles.notifBadge}>{count > 9 ? '9+' : count}</span>}
            </button>

            {isOpen && (
                <div className={`${styles.notifDropdown} glass`}>
                    <div className={styles.notifHeader}>
                        <h3>Notifikasi</h3>
                        {count > 0 && <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{count} Menunggu</span>}
                    </div>

                    <div className={styles.notifList}>
                        {loading && notifications.length === 0 ? (
                            <div className={styles.emptyNotif}>Memuat...</div>
                        ) : notifications.length === 0 ? (
                            <div className={styles.emptyNotif}>Tidak ada notifikasi baru</div>
                        ) : (
                            notifications.map((notif) => (
                                <Link
                                    key={notif.id}
                                    href={notif.link}
                                    className={styles.notifItem}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <div
                                        className={styles.notifItemIcon}
                                        style={getIconClass(notif.type)}
                                    >
                                        {getIcon(notif.type)}
                                    </div>
                                    <div className={styles.notifItemContent}>
                                        <span className={styles.notifItemTitle}>{notif.title}</span>
                                        <div>
                                            <span className={styles.notifItemUser}>{notif.user}</span>
                                            <span className={styles.notifItemDetail}>• {notif.detail}</span>
                                        </div>
                                        <span className={styles.notifItemTime}>
                                            {new Date(notif.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <ExternalLink size={12} style={{ opacity: 0.3 }} />
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
