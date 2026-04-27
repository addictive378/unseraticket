import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminSession, unauthorizedResponse } from '@/lib/server-auth';

export async function GET() {
    const session = await getAdminSession();
    if (!session) return unauthorizedResponse();

    try {
        const [userCount, eventCount, ticketCount, purchaseCount, revenue] = await Promise.all([
            prisma.user.count(),
            prisma.event.count(),
            prisma.ticket.count(),
            prisma.ticketPurchase.count(),
            prisma.ticketPurchase.aggregate({
                _sum: { totalPurchase: true },
                where: { status: 'CONFIRMED' }
            })
        ]);

        const recentBazars = await prisma.bazar.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { event: { select: { name: true } } }
        });

        // Add 30-day revenue trend
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const dailyRevenue = await prisma.ticketPurchase.groupBy({
            by: ['createdAt'],
            _sum: { totalPurchase: true },
            where: {
                status: 'CONFIRMED',
                createdAt: { gte: thirtyDaysAgo }
            },
            orderBy: { createdAt: 'asc' }
        });

        // Format data for chart (group by date string)
        const trendMap = new Map();
        dailyRevenue.forEach((item: any) => {
            const date = item.createdAt.toISOString().split('T')[0];
            const current = trendMap.get(date) || 0;
            trendMap.set(date, current + (item._sum?.totalPurchase || 0));
        });

        const trend = Array.from(trendMap.entries()).map(([date, revenue]) => ({
            date,
            revenue
        }));

        return NextResponse.json({
            stats: {
                users: userCount,
                events: eventCount,
                tickets: ticketCount,
                purchases: purchaseCount,
                revenue: revenue._sum?.totalPurchase || 0,
            },
            recentBazars,
            revenueTrend: trend
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}
