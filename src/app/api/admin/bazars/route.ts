import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminSession, unauthorizedResponse } from '@/lib/server-auth';

export async function GET() {
    const session = await getAdminSession();
    if (!session) return unauthorizedResponse();

    try {
        const bazars = await prisma.bazar.findMany({
            include: {
                event: { select: { name: true } },
                user: { select: { name: true, email: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(bazars);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch bazars' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const session = await getAdminSession();
    if (!session) return unauthorizedResponse();

    try {
        const { id, status } = await req.json();
        const bazar = await prisma.bazar.update({
            where: { id },
            data: { status }
        });
        return NextResponse.json(bazar);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update bazar status' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getAdminSession();
    if (!session) return unauthorizedResponse();

    try {
        const { id } = await req.json();
        await prisma.bazar.delete({ where: { id } });
        return NextResponse.json({ message: 'Bazar deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete bazar' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await getAdminSession();
    if (!session) return unauthorizedResponse();

    try {
        const { eventId, bazarRegStart, bazarRegEnd, bazarDate, bazarFee, bazarCP, bazarVenue, bazarRegEnabled } = await req.json();

        if (!eventId) {
            return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
        }

        const updatedEvent = await prisma.event.update({
            where: { id: eventId },
            data: {
                bazarRegStart: bazarRegStart ? new Date(bazarRegStart) : null,
                bazarRegEnd: bazarRegEnd ? new Date(bazarRegEnd) : null,
                bazarDate: bazarDate ? new Date(bazarDate) : null,
                bazarFee: parseFloat(bazarFee),
                bazarCP,
                bazarVenue,
                bazarRegEnabled: bazarRegEnabled === undefined ? true : bazarRegEnabled
            }
        });

        return NextResponse.json(updatedEvent);
    } catch (error) {
        console.error('Bazar Settings error:', error);
        return NextResponse.json({ error: 'Failed to update bazar settings' }, { status: 500 });
    }
}
