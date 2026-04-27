import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const purchase = await prisma.ticketPurchase.findUnique({
            where: { id },
        });

        if (!purchase) {
            return NextResponse.json({ message: 'Purchase not found' }, { status: 404 });
        }

        if (purchase.userId !== session.user.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
        }

        // Only allow cancellation for PENDING_PAYMENT or PENDING_VALIDATION
        if (purchase.status !== 'PENDING_PAYMENT' && purchase.status !== 'PENDING_VALIDATION') {
            return NextResponse.json({ message: 'Cannot cancel this order' }, { status: 400 });
        }

        const updated = await prisma.ticketPurchase.update({
            where: { id },
            data: { status: 'CANCELLED' },
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error('Cancel error:', error);
        return NextResponse.json({ message: error.message || 'Failed to cancel' }, { status: 500 });
    }
}
