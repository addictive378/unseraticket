import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminSession, unauthorizedResponse } from '@/lib/server-auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getAdminSession();
    if (!session) return unauthorizedResponse();

    try {
        const { id } = await params;
        const { action, rejectedReason } = await req.json();

        const purchase = await prisma.ticketPurchase.findUnique({
            where: { id },
        });

        if (!purchase) {
            return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
        }

        if (purchase.status !== 'PENDING_VALIDATION') {
            return NextResponse.json({ error: 'Purchase is not pending validation' }, { status: 400 });
        }

        if (action === 'approve') {
            // Approve: set CONFIRMED + decrement stock + create individual issued tickets
            const updated = await prisma.$transaction(async (tx) => {
                const result = await tx.ticketPurchase.update({
                    where: { id },
                    data: {
                        status: 'CONFIRMED',
                        confirmedAt: new Date(),
                    },
                });

                // Decrement ticket stock
                await tx.ticket.update({
                    where: { id: purchase.ticketId },
                    data: {
                        stock: { decrement: purchase.quantity }
                    }
                });

                // Create individual IssuedTicket records — one per quantity unit
                const issuedTickets = [];
                for (let i = 0; i < purchase.quantity; i++) {
                    const issued = await tx.issuedTicket.create({
                        data: {
                            purchaseId: purchase.id,
                            userId: purchase.userId,
                            holderName: purchase.buyerName,
                        }
                    });
                    issuedTickets.push(issued);
                }

                return { ...result, issuedTickets };
            });

            return NextResponse.json(updated);
        } else if (action === 'reject') {
            const updated = await prisma.ticketPurchase.update({
                where: { id },
                data: {
                    status: 'REJECTED',
                    rejectedReason: rejectedReason || 'Payment proof rejected by admin',
                },
            });

            return NextResponse.json(updated);
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Validate purchase error:', error);
        return NextResponse.json({ error: 'Failed to validate purchase' }, { status: 500 });
    }
}
