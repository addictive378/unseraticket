import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/bazars - fetch all events (for the dropdown)
export async function GET() {
    try {
        const events = await prisma.event.findMany({
            orderBy: { date: 'asc' },
            select: {
                id: true,
                name: true,
                date: true,
                bazarRegStart: true,
                bazarRegEnd: true,
                bazarDate: true,
                bazarFee: true,
                bazarCP: true,
                bazarVenue: true,
                bazarRegEnabled: true,
            },
        });
        return NextResponse.json(events);
    } catch (error) {
        console.error('Error fetching events for bazar:', error);
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
}

// POST /api/bazars - submit a bazar application
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Please login first' }, { status: 401 });
        }

        const body = await req.json();
        const { eventId, name, type, description } = body;

        if (!eventId || !name || !type || !description) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        // Fetch event to get dynamic bazarFee
        const event = await prisma.event.findUnique({
            where: { id: eventId }
        });

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Check if registration is explicitly disabled
        if (!event.bazarRegEnabled) {
            return NextResponse.json({ error: 'Registrasi Bazar sedang ditutup oleh admin.' }, { status: 403 });
        }

        const bazar = await prisma.bazar.create({
            data: {
                eventId,
                userId: session.user.id,
                name,
                type,
                description,
                status: 'PENDING_PAYMENT',
                totalAmount: event.bazarFee,
            },
            include: {
                event: true
            }
        });

        // Build WhatsApp message
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
            bazar,
            waLink
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating bazar application:', error);
        return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
    }
}
