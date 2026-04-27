'use client';

import styles from './competitions.module.css';
import { Trophy, ArrowRight, ExternalLink } from 'lucide-react';

export default function CompetitionsPage() {
    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className="container">
                    <h1 className="gradient-text">Kompetisi</h1>
                    <p>Tunjukkan bakatmu dan bersaing dengan yang terbaik.</p>
                </div>
            </header>

            <section className={styles.gridSection}>
                <div className="container">
                    <div className={`${styles.linkCard} glass`}>
                        <div className={styles.cardIcon}>
                            <Trophy size={48} className="gradient-text" />
                        </div>
                        <h2>Pendaftaran Kompetisi</h2>
                        <p>
                            Seluruh pendaftaran dan informasi mengenai kompetisi FUNTASTIK UNSERA
                            kini dikelola melalui platform Linktree kami.
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
                            <p>Klik tombol di atas untuk melihat daftar kompetisi yang tersedia dan melakukan pendaftaran.</p>
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
