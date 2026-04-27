import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserSession, unauthorizedResponse } from '@/lib/server-auth';

export async function GET() {
    try {
        const session = await getUserSession();
        if (!session) return unauthorizedResponse();

        const purchases = await prisma.ticketPurchase.findMany({
            where: { userId: session.user.id },
            include: {
                ticket: {
                    include: {
                        event: true
                    }
                },
                issuedTickets: true
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(purchases);
    } catch (error) {
        console.error('Fetch my tickets error:', error);
        return NextResponse.json({ message: 'Failed to fetch tickets' }, { status: 500 });
    }
}
