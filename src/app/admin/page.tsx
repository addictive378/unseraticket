'use client';

import { useEffect, useState } from 'react';
import styles from './admin.module.css';
import { TrendingUp, Ticket as TicketIcon, Store, Users } from 'lucide-react';
import RevenueChart from './components/RevenueChart';

export default function AdminDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/stats')
            .then(res => res.json())
            .then(data => {
                setData(data);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className={styles.loading}>Loading Dashboard...</div>;

    const stats = data?.stats || {};
    const recentBazars = data?.recentBazars || [];
    const revenueTrend = data?.revenueTrend || [];

    return (
        <div>
            <div className={styles.statsGrid}>
                <div className={`${styles.statCard} glass`}>
                    <h4>Total Pendapatan</h4>
                    <div className={styles.statValue}>Rp {stats.revenue?.toLocaleString()}</div>
                    <p className={styles.statTrend}><TrendingUp size={14} /> Total akumulasi</p>
                </div>
                <div className={`${styles.statCard} glass`}>
                    <h4>Acara Dibuat</h4>
                    <div className={styles.statValue}>{stats.events}</div>
                    <p className={styles.statTrend}>Program aktif</p>
                </div>
                <div className={`${styles.statCard} glass`}>
                    <h4>Pengguna Terdaftar</h4>
                    <div className={styles.statValue}>{stats.users}</div>
                    <p className={styles.statTrend}><TrendingUp size={14} /> Pengguna global</p>
                </div>
            </div>

            <div className={styles.dashboardGrid}>
                <div style={{ gridColumn: 'span 3' }}>
                    <RevenueChart data={revenueTrend} />
                </div>
            </div>
        </div>
    );
}
