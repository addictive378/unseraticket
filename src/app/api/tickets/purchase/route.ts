import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Please login first' }, { status: 401 });
        }

        const body = await request.json();
        const { ticketId, quantity, buyerName } = body;

        // Check for existing pending purchases
        const existingPending = await prisma.ticketPurchase.findFirst({
            where: {
                userId: session.user.id,
                status: 'PENDING_PAYMENT',
            }
        });

        if (existingPending) {
            return NextResponse.json({
                message: 'Anda masih memiliki pesanan tiket yang belum diselesaikan. Silakan lengkapi pembayaran pesanan sebelumnya atau hubungi admin.'
            }, { status: 400 });
        }

        if (!ticketId || !quantity || !buyerName) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const purchase = await prisma.$transaction(async (tx) => {
            const ticket = await tx.ticket.findUnique({
                where: { id: ticketId },
                include: { event: true }
            });

            if (!ticket) {
                throw new Error('Ticket tier not found');
            }

            if (ticket.stock < quantity) {
                throw new Error(`Insufficient stock. Only ${ticket.stock} tickets left.`);
            }

            const totalPurchase = ticket.price * quantity;
            const newPurchase = await tx.ticketPurchase.create({
                data: {
                    userId: session.user.id,
                    ticketId: ticket.id,
                    quantity,
                    totalPurchase,
                    buyerName,
                    status: 'PENDING_PAYMENT',
                },
                include: {
                    ticket: { include: { event: true } }
                }
            });

            return newPurchase;
        });

        // Build WhatsApp message
        const waMessage = encodeURIComponent(
            `Halo Admin, saya ingin melakukan pembayaran tiket:\n\n` +
            `📋 Order ID: ${purchase.id}\n` +
            `🎫 Event: ${purchase.ticket.event.name}\n` +
            `🏷️ Tipe: ${purchase.ticket.type}\n` +
            `👤 Nama: ${buyerName}\n` +
            `📦 Qty: ${quantity}\n` +
            `💰 Total: Rp ${purchase.totalPurchase.toLocaleString('id-ID')}\n\n` +
            `Mohon info rekening untuk transfer. Terima kasih!`
        );

        const waNumber = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || '6281908323126';
        const waLink = `https://wa.me/${waNumber}?text=${waMessage}`;

        return NextResponse.json({
            purchase,
            waLink,
        }, { status: 201 });
    } catch (error: any) {
        console.error('Purchase error:', error);
        return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
    }
}
