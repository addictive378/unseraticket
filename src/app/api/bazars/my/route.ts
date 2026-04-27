import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserSession, unauthorizedResponse } from '@/lib/server-auth';

export async function GET() {
    try {
        const session = await getUserSession();
        if (!session) return unauthorizedResponse();

        const bazars = await prisma.bazar.findMany({
            where: {
                userId: session.user.id
            },
            include: {
                event: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(bazars);
    } catch (error) {
        console.error('Error fetching my bazars:', error);
        return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 });
    }
}
