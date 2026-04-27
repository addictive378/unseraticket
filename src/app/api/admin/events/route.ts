import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminSession, unauthorizedResponse } from '@/lib/server-auth';

export async function GET() {
    const session = await getAdminSession();
    if (!session) return unauthorizedResponse();

    try {
        const events = await prisma.event.findMany({
            orderBy: { date: 'asc' },
            include: {
                _count: {
                    select: { tickets: true, bazars: true }
                },
                tickets: {
                    select: { type: true, price: true, stock: true },
                    orderBy: { price: 'asc' }
                }
            }
        });
        return NextResponse.json(events);
    } catch (error) {
        console.error('Fetch events error:', error);
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getAdminSession();
    if (!session) return unauthorizedResponse();

    try {
        const data = await req.json();

        // Validate required event fields
        if (!data.name || !data.date || !data.location || !data.description) {
            return NextResponse.json({ error: 'Missing required event fields' }, { status: 400 });
        }

        // Validate ticket tiers
        const ticketTiers = data.tickets;
        if (!Array.isArray(ticketTiers) || ticketTiers.length === 0) {
            return NextResponse.json({ error: 'At least one ticket tier is required' }, { status: 400 });
        }

        for (const tier of ticketTiers) {
            if (!tier.type || tier.price === undefined || tier.stock === undefined) {
                return NextResponse.json({ error: 'Each ticket tier must have type, price, and stock' }, { status: 400 });
            }
            if (isNaN(parseFloat(tier.price)) || parseFloat(tier.price) < 0) {
                return NextResponse.json({ error: `Invalid price for ticket tier "${tier.type}"` }, { status: 400 });
            }
            if (isNaN(parseInt(tier.stock)) || parseInt(tier.stock) < 0) {
                return NextResponse.json({ error: `Invalid stock for ticket tier "${tier.type}"` }, { status: 400 });
            }
        }

        // Use a transaction to create event + all ticket tiers atomically
        const result = await prisma.$transaction(async (tx: any) => {
            const event = await tx.event.create({
                data: {
                    name: data.name,
                    description: data.description,
                    date: new Date(data.date),
                    location: data.location,
                    image: data.image || null,
                }
            });

            // Create all ticket tiers
            await tx.ticket.createMany({
                data: ticketTiers.map((tier: any) => ({
                    eventId: event.id,
                    type: tier.type,
                    price: parseFloat(tier.price),
                    stock: parseInt(tier.stock),
                    status: tier.status || "ACTIVE",
                }))
            });

            // Return event with tickets
            return tx.event.findUnique({
                where: { id: event.id },
                include: { tickets: true }
            });
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error('Create event error:', error);
        return NextResponse.json({ error: 'Failed to create event. Check server logs.' }, { status: 500 });
    }
}
