'use client';

import styles from './Hero.module.css';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface HeroProps {
    badge?: string;
    title?: string;
    subtitle?: string;
    image?: string | null;
}

export default function Hero({ badge, title, subtitle, image }: HeroProps) {
    const router = useRouter();
    const defaultBadge = "15-20 MARET, 2025 • ARENA PUSAT KOTA";
    const defaultTitle = <>RASAKAN <span className="gradient-text">DENYUT</span> MASA DEPAN</>;
    const defaultSubtitle = "Bergabunglah dengan 50.000 visioner teknologi, seniman, dan pelopor suara untuk enam hari pengalaman imersif dan koneksi bertegangan tinggi.";

    // Parse title to inject gradient-text if it contains "DENYUT"
    const renderTitle = (text: string | undefined) => {
        if (!text) return defaultTitle;
        if (!text.includes('DENYUT')) return text;

        const parts = text.split('DENYUT');
        return (
            <>
                {parts[0]}
                <span className="gradient-text">DENYUT</span>
                {parts[1]}
            </>
        );
    };

    return (
        <section className={styles.hero}>
            {image && (
                <div className={styles.heroBg}>
                    <img
                        src={image}
                        alt="Hero Background"
                        className={styles.bgImage}
                        style={{
                            objectFit: 'cover',
                            width: '100%',
                            height: '100%',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            filter: 'brightness(0.5)'
                        }}
                    />
                </div>
            )}
            <div className={styles.overlay}></div>
            <div className={`${styles.content} container animate-fadeIn`}>
                <div className={styles.badge}>
                    {badge || defaultBadge}
                </div>
                <h1 className={styles.title}>
                    {renderTitle(title)}
                </h1>
                <p className={styles.description}>
                    {subtitle || defaultSubtitle}
                </p>
                <div className={styles.ctas} style={{ position: 'relative', zIndex: 100 }}>
                    <Link href="/tickets" className="btn-primary" style={{ textDecoration: 'none' }}>
                        DAPATKAN TIKET <ArrowRight size={18} />
                    </Link>
                </div>
            </div>
        </section>
    );
}
