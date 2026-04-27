import Link from "next/link";
import Image from "next/image";
import Hero from "@/components/Hero";
import styles from "./page.module.css";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const settings = await (prisma as any).siteSettings?.findUnique({
    where: { id: 'vibrant-pulse-settings' }
  }) || {
    heroBadge: "15-20 MARET, 2025 • ARENA PUSAT KOTA",
    heroTitle: "RASAKAN DENYUT MASA DEPAN",
    heroSubtitle: "Bergabunglah dengan 50.000 visioner teknologi, seniman, dan pelopor suara untuk enam hari pengalaman imersif dan koneksi bertegangan tinggi.",
    heroImage: null,
    aboutTitle: "Mendefinisikan Ulang Pengalaman Langsung",
    aboutBadge: "Akustik Season",
    aboutText1: "Vibrant Pulse lahir dari misi sederhana: untuk menjembatani kesenjangan antara koneksi manusia dan kemajuan teknologi. Kami percaya bahwa acara langsung adalah perbatasan terakhir dari pengalaman otentik.",
    aboutText2: "Sejak 2018, kami telah mengkurasi lingkungan tempat batas-batas memudar—antara artis dan penonton, digital dan fisik, harapan dan kenyataan. Tim insinyur kelas dunia dan direktur kreatif kami membangun dunia, bukan hanya panggung.",
    ctaTitle: "MASA DEPANMU MENANTI",
    ctaDescription: "Tiket early-bird terbatas kini tersedia. Jangan lewatkan kesempatan Anda untuk menjadi bagian dari acara budaya yang paling dinanti tahun ini.",
    logoText: "VIBRANT",
    logoSuffix: "PULSE",
  };

  const renderBadge = (text: string) => {
    if (!text) return "FunTastik";
    if (!text.includes("Season")) return text;

    const parts = text.split("Season");
    return (
      <>
        {parts[0]}<span style={{
          background: 'linear-gradient(135deg, #ff00cc 0%, #3333ff 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>Season</span>{parts[1]}
      </>
    );
  };

  return (
    <div className={styles.page}>
      <Hero
        badge={settings.heroBadge}
        title={settings.heroTitle}
        subtitle={settings.heroSubtitle}
        image={settings.heroImage}
      />

      <section className={styles.about}>
        <div className="container">
          <div className={styles.aboutHeader}>
            <div className={styles.sectionBadge}>
              {renderBadge(settings.aboutBadge || "FunTastik")}
            </div>
            <h2 className="gradient-text">{settings.aboutTitle}</h2>
            <div className={styles.aboutDesc}>
              <p>{settings.aboutText1}</p>
              <p>{settings.aboutText2}</p>
            </div>
          </div>

          <div className={styles.galleryContainer}>
            {settings.galleryImages && settings.galleryImages.length > 0 ? (
              <div className={styles.mainGalleryGrid}>
                {settings.galleryImages.map((url: string, index: number) => (
                  <div key={index} className={`${styles.galleryItem} glass animate-fadeIn`} style={{ animationDelay: `${index * 0.1}s` }}>
                    <Image
                      src={url}
                      alt={`Gallery Item ${index}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                ))}
                {/* Pad with placeholders if less than 6 and not empty */}
                {settings.galleryImages.length < 6 && [...Array(6 - settings.galleryImages.length)].map((_, i) => (
                  <div key={`pad-${i}`} className={`${styles.galleryItem} ${styles.placeholderSlot} glass`}>
                    <div className={styles.placeholderLabel}>COMING SOON</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.comingSoon}>
                <h3>COMING SOON</h3>
                <p>NANTIKAN GUEST STAR SPESIAL KAMI</p>
              </div>
            )}
          </div>

          {/* <div className={styles.stats}>
            <div className={styles.statItem}>
              <h3>99%</h3>
              <p>KEPUASAN</p>
            </div>
            <div className={styles.statItem}>
              <h3>12+</h3>
              <p>KOTA PENYELENGGARA</p>
            </div>
          </div> */}
        </div>
      </section>

      {/* <section className={styles.cta}>
        <div className={`${styles.ctaContent} glass container`}>
          <h2>{settings.ctaTitle}</h2>
          <p>{settings.ctaDescription}</p>
          <div className={styles.ctaButtons}>
            <Link href="/tickets" className="btn-primary" style={{ textDecoration: 'none' }}>PESAN TIKET SEKARANG</Link>
            <button className="btn-outline">LIHAT PETA ACARA</button>
          </div>
        </div>
      </section> */}

      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerTop}>
            <div className={styles.footerLogo}>
              {settings.logoText} <span>{settings.logoSuffix}</span>
            </div>
            <div className={styles.socialLink}>
              <a href="https://www.instagram.com/akustikseason/" target="_blank" rel="noopener noreferrer" title="Instagram @akustikseason">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p>© 2026 ADI SAPUTRA. HAK CIPTA DILINDUNGI UNDANG-UNDANG.</p>
          </div>
        </div>
      </footer>
    </div >
  );
}
