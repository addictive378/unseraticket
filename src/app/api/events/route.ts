import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const events = await prisma.event.findMany({
            include: {
                tickets: {
                    select: {
                        id: true,
                        type: true,
                        price: true,
                        stock: true,
                        status: true,
                    },
                    orderBy: {
                        price: 'asc'
                    }
                }
            },
            orderBy: {
                date: 'asc'
            }
        });

        // Format data for public view — keep ticket details for checkout
        const formattedEvents = events.map((event: any) => ({
            id: event.id,
            name: event.name,
            description: event.description,
            date: event.date,
            location: event.location,
            image: event.image,
            price: event.tickets[0]?.price || 0,
            type: 'General',
            tickets: event.tickets,
        }));

        return NextResponse.json(formattedEvents);
    } catch (error) {
        console.error('Fetch events error:', error);
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
}
