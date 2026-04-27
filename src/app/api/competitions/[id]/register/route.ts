import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Please login first' }, { status: 401 });
        }

        const { id: competitionId } = await params;
        const body = await req.json();
        const { buyerName, whatsapp } = body;

        if (!buyerName) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const competition = await prisma.competition.findUnique({
            where: { id: competitionId }
        });

        if (!competition) {
            return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
        }

        // Check if already registered with a valid/pending status
        const activeRegistration = await prisma.competitionRegistration.findFirst({
            where: {
                competitionId,
                userId: session.user.id,
                status: { in: ['CONFIRMED', 'PENDING_VALIDATION', 'PENDING_PAYMENT'] }
            }
        });

        if (activeRegistration) {
            if (activeRegistration.status === 'PENDING_PAYMENT') {
                const PAYMENT_DEADLINE_MS = 5 * 60 * 1000;
                const isExpired = Date.now() - new Date(activeRegistration.createdAt).getTime() > PAYMENT_DEADLINE_MS;

                if (!isExpired) {
                    return NextResponse.json({
                        error: 'You have an active registration waiting for payment.',
                        code: 'PENDING_PAYMENT_ACTIVE'
                    }, { status: 400 });
                }
                // If expired, we proceed to cancel it and create a new one below
            } else {
                const message = activeRegistration.status === 'CONFIRMED'
                    ? 'You are already registered for this competition'
                    : 'Your previous payment is pending validation. Please wait for admin approval.';
                return NextResponse.json({ error: message }, { status: 400 });
            }
        }

        // Cancel any previous PENDING_PAYMENT or REJECTED registrations to avoid confusion
        await prisma.competitionRegistration.updateMany({
            where: {
                competitionId,
                userId: session.user.id,
                status: { in: ['PENDING_PAYMENT', 'REJECTED'] }
            },
            data: { status: 'CANCELLED' }
        });

        const registration = await prisma.competitionRegistration.create({
            data: {
                competitionId,
                userId: session.user.id,
                buyerName,
                whatsapp: whatsapp || null,
                status: 'PENDING_PAYMENT',
            },
            include: {
                competition: true
            }
        });

        // Build WhatsApp message
        const waMessage = encodeURIComponent(
            `Halo Admin, saya ingin mendaftar Kompetisi:\n\n` +
            `📋 Registration ID: ${registration.id}\n` +
            `🏆 Competition: ${registration.competition.name}\n` +
            `👤 Name: ${registration.buyerName}\n` +
            `📱 WhatsApp: ${registration.whatsapp || '-'}\n` +
            `💰 Fee: Rp ${registration.competition.registrationFee.toLocaleString('id-ID')}\n\n` +
            `Mohon info rekening untuk transfer. Terima kasih!`
        );

        const waNumber = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || '6281908323126';
        const waLink = `https://wa.me/${waNumber}?text=${waMessage}`;

        return NextResponse.json({
            registration,
            waLink
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating competition registration:', error);
        return NextResponse.json({ error: 'Failed to submit registration' }, { status: 500 });
    }
}
