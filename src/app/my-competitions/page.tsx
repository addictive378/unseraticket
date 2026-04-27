'use client';

import Link from 'next/link';
import { Trophy, ArrowRight } from 'lucide-react';
import styles from './my-competitions.module.css';

export default function MyCompetitionsPage() {
    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className="container">
                    <h1 className="gradient-text">Kompetisi Saya</h1>
                    <p>Informasi pendaftaran kompetisi Anda.</p>
                </div>
            </header>

            <section>
                <div className="container">
                    <div className={styles.emptyState}>
                        <Trophy size={48} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
                        <h3>Fitur Telah Dipindahkan</h3>
                        <p>
                            Manajemen pendaftaran kompetisi kini dilakukan secara terpusat melalui Linktree kami.
                            Silakan cek status Anda melalui kontak panitia yang tersedia di platform tersebut.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'center' }}>
                            <Link href="/competitions" className="btn-primary" style={{ textDecoration: 'none' }}>MENU KOMPETISI</Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
