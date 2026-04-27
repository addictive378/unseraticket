'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './tickets.module.css';
import { Calendar, MapPin, Ticket as TicketIcon } from 'lucide-react';

export default function TicketsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch('/api/events');
                const data = await res.json();
                setEvents(data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching events:', error);
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    if (loading) {
        return (
            <div className={styles.page}>
                <div className="container">
                    <p style={{ textAlign: 'center', marginTop: '5rem' }}>Memuat acara eksklusif...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className="container">
                    <div className={styles.titleWrapper}>
                        <span className={styles.getLabel}>GET</span>
                        <div className={styles.highlightBox}>YOUR TICKET</div>
                        <span className={styles.nowLabel}>NOW</span>
                    </div>
                </div>
            </header>

            <section className={styles.gridSection}>
                <div className="container">
                    <div className={styles.ticketGrid}>
                        {events.length === 0 ? (
                            <p style={{ textAlign: 'center', width: '100%', gridColumn: '1/-1' }}>Tidak ada acara mendatang ditemukan.</p>
                        ) : (
                            events.map((event) => {
                                const totalStock = event.tickets?.reduce((sum: number, t: any) => sum + t.stock, 0) || 0;
                                const isSoldOut = totalStock <= 0;
                                const firstTicket = event.tickets?.[0];
                                const allTicketsClosed = event.tickets?.every((t: any) => t.status === 'CLOSED');

                                return (
                                    <div key={event.id} className={styles.ticketCard}>
                                        <div className={styles.patternBg}></div>

                                        <div className={styles.cardTop}>
                                            <div className={styles.badgeRow}>
                                                <span className={styles.typeBadge}>{event.type || 'EVENT'}</span>
                                                {isSoldOut ? (
                                                    <span className={styles.statusBadge} style={{ background: '#ef4444' }}>SOLD OUT</span>
                                                ) : (
                                                    allTicketsClosed ? (
                                                        <span className={styles.statusBadge} style={{ background: '#6b7280' }}>CLOSED</span>
                                                    ) : (
                                                        <span className={styles.statusBadge}>AVAILABLE</span>
                                                    )
                                                )}
                                            </div>

                                            <h3 className={styles.eventName}>{event.name}</h3>

                                            <div className={styles.priceWrapper}>
                                                <span className={styles.startsFromLabel}>Starts From</span>
                                                <div className={styles.priceAmount}>
                                                    IDR {firstTicket?.price?.toLocaleString('id-ID') || 'N/A'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className={styles.cardStub}>
                                            <div className={`${styles.sideHole} ${styles.leftHole}`}></div>
                                            <div className={`${styles.sideHole} ${styles.rightHole}`}></div>

                                            {isSoldOut ? (
                                                <button className={styles.soldOutBtn}>SOLD OUT</button>
                                            ) : (
                                                allTicketsClosed ? (
                                                    <button className={styles.soldOutBtn} style={{ background: '#374151', color: '#9ca3af', borderColor: '#4b5563' }}>CLOSED</button>
                                                ) : (
                                                    <Link href={`/checkout/${event.id}`} className={styles.buyBtn}>
                                                        BUY TICKETS
                                                    </Link>
                                                )
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
