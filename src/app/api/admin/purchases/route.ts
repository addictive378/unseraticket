import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminSession, unauthorizedResponse } from '@/lib/server-auth';

export async function GET() {
    const session = await getAdminSession();
    if (!session) return unauthorizedResponse();

    try {
        const purchases = await prisma.ticketPurchase.findMany({
            include: {
                user: { select: { name: true, email: true } },
                ticket: {
                    include: { event: { select: { name: true } } }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(purchases);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 });
    }
}
