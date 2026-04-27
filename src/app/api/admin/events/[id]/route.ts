import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminSession, unauthorizedResponse } from '@/lib/server-auth';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getAdminSession();
    if (!session) return unauthorizedResponse();

    try {
        const event = await prisma.event.findUnique({
            where: { id },
            include: { tickets: true }
        });
        if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        return NextResponse.json(event);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getAdminSession();
    if (!session) return unauthorizedResponse();

    try {
        const data = await req.json();
        await prisma.event.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                date: new Date(data.date),
                location: data.location,
                image: data.image,
            }
        });
        return NextResponse.json({ message: 'Event updated successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getAdminSession();
    if (!session) return unauthorizedResponse();

    try {
        // Use a transaction to ensure atomic deletion of all related records
        await prisma.$transaction(async (tx) => {
            // 1. Delete all IssuedTickets for all purchases of all tickets of this event
            // This is a bit complex due to relations, so we'll find purchase IDs first
            const tickets = await tx.ticket.findMany({
                where: { eventId: id },
                select: { id: true }
            });
            const ticketIds = tickets.map(t => t.id);

            const purchases = await tx.ticketPurchase.findMany({
                where: { ticketId: { in: ticketIds } },
                select: { id: true }
            });
            const purchaseIds = purchases.map(p => p.id);

            if (purchaseIds.length > 0) {
                await tx.issuedTicket.deleteMany({
                    where: { purchaseId: { in: purchaseIds } }
                });
                // 2. Delete TicketPurchases
                await tx.ticketPurchase.deleteMany({
                    where: { id: { in: purchaseIds } }
                });
            }

            // 3. Delete Tickets
            await tx.ticket.deleteMany({
                where: { eventId: id }
            });

            // 4. Delete Bazars
            await tx.bazar.deleteMany({
                where: { eventId: id }
            });

            // 5. Finally delete the Event
            await tx.event.delete({
                where: { id }
            });
        });

        return NextResponse.json({ message: 'Event and all related data deleted successfully' });
    } catch (error: any) {
        console.error('Error during cascade delete:', error);
        return NextResponse.json({
            error: 'Failed to delete event',
            details: error.message
        }, { status: 500 });
    }
}
