import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminSession, unauthorizedResponse } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getAdminSession();
    if (!session) return unauthorizedResponse();

    try {
        // Fetch pending ticket purchases
        const pendingTickets = await prisma.ticketPurchase.findMany({
            where: { status: 'PENDING_VALIDATION' },
            include: {
                user: { select: { name: true } },
                ticket: { select: { type: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        // Fetch pending bazar registrations
        const pendingBazars = await prisma.bazar.findMany({
            where: { status: 'PENDING_VALIDATION' },
            include: { user: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        // Fetch pending competition registrations
        const pendingCompetitions = await prisma.competitionRegistration.findMany({
            where: { status: 'PENDING_VALIDATION' },
            include: {
                user: { select: { name: true } },
                competition: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        // Map and merge
        const notifications = [
            ...pendingTickets.map(t => ({
                id: t.id,
                type: 'TICKET',
                title: 'Pembayaran Tiket Baru',
                user: t.user.name || 'Unknown',
                detail: t.ticket.type,
                createdAt: t.createdAt,
                link: '/admin/sales'
            })),
            ...pendingBazars.map(b => ({
                id: b.id,
                type: 'BAZAR',
                title: 'Pendaftaran Bazar Baru',
                user: b.user.name || 'Unknown',
                detail: b.name,
                createdAt: b.createdAt,
                link: '/admin/bazars'
            })),
            ...pendingCompetitions.map(c => ({
                id: c.id,
                type: 'COMPETITION',
                title: 'Registrasi Kompetisi Baru',
                user: c.user.name || 'Unknown',
                detail: c.competition.name,
                createdAt: c.createdAt,
                link: '/admin/competitions'
            }))
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return NextResponse.json({
            count: notifications.length,
            items: notifications.slice(0, 10)
        });
    } catch (error) {
        console.error('Failed to fetch notifications:', error);
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}
