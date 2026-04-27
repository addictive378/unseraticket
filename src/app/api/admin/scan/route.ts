import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminSession, unauthorizedResponse } from '@/lib/server-auth';

// POST — Scan/validate a ticket
export async function POST(req: Request) {
    const session = await getAdminSession();
    if (!session) return unauthorizedResponse();

    try {
        const { ticketCode } = await req.json();

        if (!ticketCode) {
            return NextResponse.json({ valid: false, message: 'No ticket code provided' }, { status: 400 });
        }

        // Extract ID from QR format "VIBRANT-TICKET:{id}"
        const ticketId = ticketCode.replace('VIBRANT-TICKET:', '');

        const issuedTicket = await prisma.issuedTicket.findUnique({
            where: { id: ticketId },
            include: {
                purchase: {
                    include: {
                        ticket: {
                            include: { event: true }
                        }
                    }
                },
                user: { select: { name: true, email: true } }
            }
        });

        if (!issuedTicket) {
            return NextResponse.json({
                valid: false,
                message: 'Tiket tidak ditemukan. QR code tidak valid.',
            });
        }

        if (issuedTicket.isUsed) {
            return NextResponse.json({
                valid: false,
                message: `Tiket sudah digunakan pada ${new Date(issuedTicket.usedAt!).toLocaleString('id-ID')}`,
                ticket: {
                    id: issuedTicket.id,
                    holderName: issuedTicket.holderName,
                    eventName: issuedTicket.purchase.ticket.event.name,
                    ticketType: issuedTicket.purchase.ticket.type,
                    usedAt: issuedTicket.usedAt,
                }
            });
        }

        if (issuedTicket.purchase.status !== 'CONFIRMED') {
            return NextResponse.json({
                valid: false,
                message: `Tiket belum dikonfirmasi. Status: ${issuedTicket.purchase.status}`,
            });
        }

        // Mark as used
        const updated = await prisma.issuedTicket.update({
            where: { id: ticketId },
            data: {
                isUsed: true,
                usedAt: new Date(),
            }
        });

        return NextResponse.json({
            valid: true,
            message: 'Tiket valid! Silakan masuk.',
            ticket: {
                id: issuedTicket.id,
                holderName: issuedTicket.holderName,
                eventName: issuedTicket.purchase.ticket.event.name,
                ticketType: issuedTicket.purchase.ticket.type,
                buyerName: issuedTicket.purchase.buyerName,
                usedAt: updated.usedAt,
            }
        });
    } catch (error) {
        console.error('Scan error:', error);
        return NextResponse.json({ valid: false, message: 'Terjadi kesalahan saat scan' }, { status: 500 });
    }
}

// GET — Fetch scan log (all used tickets)
export async function GET() {
    const session = await getAdminSession();
    if (!session) return unauthorizedResponse();

    try {
        const scannedTickets = await prisma.issuedTicket.findMany({
            where: { isUsed: true },
            include: {
                purchase: {
                    include: {
                        ticket: {
                            include: { event: { select: { name: true, id: true } } }
                        }
                    }
                },
                user: { select: { name: true, email: true } }
            },
            orderBy: { usedAt: 'desc' }
        });

        return NextResponse.json(scannedTickets);
    } catch (error) {
        console.error('Scan log error:', error);
        return NextResponse.json({ error: 'Failed to fetch scan log' }, { status: 500 });
    }
}
