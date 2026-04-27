import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const competitions = await prisma.competition.findMany({
            where: {
                status: { in: ['UPCOMING', 'ONGOING'] }
            },
            orderBy: { date: 'asc' },
        });
        return NextResponse.json(competitions);
    } catch (error) {
        console.error('Fetch public competitions error:', error);
        return NextResponse.json({ error: 'Failed to fetch competitions' }, { status: 500 });
    }
}
