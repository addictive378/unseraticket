'use client';

import Link from 'next/link';
import { Store, ArrowRight } from 'lucide-react';
import styles from './my-bazars.module.css';

export default function MyBazarsPage() {
    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className="container">
                    <h1 className="gradient-text">Bazar Saya</h1>
                    <p>Informasi pendaftaran bazar Anda.</p>
                </div>
            </header>

            <section>
                <div className="container">
                    <div className={styles.emptyState}>
                        <Store size={48} style={{ color: 'var(--primary)', marginBottom: '1.5rem' }} />
                        <h3>Fitur Telah Dipindahkan</h3>
                        <p>
                            Manajemen pendaftaran bazar kini dilakukan secara terpusat melalui Linktree kami.
                            Silakan cek status slot Anda melalui kontak panitia yang tersedia di platform tersebut.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'center' }}>
                            <Link href="/bazar" className="btn-primary" style={{ textDecoration: 'none' }}>MENU BAZAR</Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
