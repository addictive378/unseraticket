import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const bazar = await prisma.bazar.findUnique({
            where: { id },
            include: { event: true }
        });

        if (!bazar) {
            return NextResponse.json({ error: 'Bazar registration not found' }, { status: 404 });
        }

        // Ensure user owns this registration
        if (bazar.userId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Reconstruct WA link
        const waMessage = encodeURIComponent(
            `Halo Admin, saya ingin mendaftar Bazar:\n\n` +
            `📋 Registration ID: ${bazar.id}\n` +
            `🎫 Event: ${bazar.event.name}\n` +
            `🏪 Business Name: ${bazar.name}\n` +
            `🏷️ Type: ${bazar.type}\n` +
            `💰 Fee: Rp ${bazar.totalAmount.toLocaleString('id-ID')}\n\n` +
            `Mohon info rekening untuk transfer. Terima kasih!`
        );
        const waNumber = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || '6281908323126';
        const waLink = `https://wa.me/${waNumber}?text=${waMessage}`;

        return NextResponse.json({
            ...bazar,
            waLink
        });
    } catch (error) {
        console.error('Error fetching bazar registration:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const bazar = await prisma.bazar.findUnique({
            where: { id }
        });

        if (!bazar) {
            return NextResponse.json({ error: 'Bazar registration not found' }, { status: 404 });
        }

        if (bazar.userId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (bazar.status !== 'PENDING_PAYMENT') {
            return NextResponse.json({ error: 'Cannot cancel an application that is already paid or verified' }, { status: 400 });
        }

        await prisma.bazar.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Registration cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling bazar registration:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
