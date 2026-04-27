'use client';

import styles from './bazar.module.css';
import { Store, ArrowRight, ExternalLink } from 'lucide-react';

export default function BazarPage() {
    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className="container">
                    <h1 className="gradient-text">Bazar</h1>
                    <p>Tunjukkan Brand Anda di FUNTASTIK UNSERA.</p>
                </div>
            </header>

            <section className={styles.gridSection}>
                <div className="container">
                    <div className={`${styles.linkCard} glass`}>
                        <div className={styles.cardIcon}>
                            <Store size={48} className="gradient-text" />
                        </div>
                        <h2>Pendaftaran Slot Bazar</h2>
                        <p>
                            Seluruh pendaftaran dan informasi mengenai penyewaan slot bazar
                            FUNTASTIK UNSERA kini dikelola melalui platform Linktree kami.
                        </p>

                        <a
                            href="https://linktr.ee/funtastik.unsera"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary"
                            style={{
                                marginTop: '2rem',
                                padding: '1rem 2rem',
                                fontSize: '1.1rem',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}
                        >
                            BUKA LINKTREE <ExternalLink size={20} />
                        </a>

                        <div className={styles.notice}>
                            <p>Klik tombol di atas untuk melihat ketersediaan slot dan melakukan pendaftaran bazar.</p>
                        </div>
                    </div>
                </div>
            </section>

            <style jsx>{`
                .container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 0 1.5rem;
                    text-align: center;
                }
            `}</style>
        </div>
    );
}
