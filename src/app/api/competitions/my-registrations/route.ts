import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserSession, unauthorizedResponse } from '@/lib/server-auth';

export async function GET() {
    try {
        const session = await getUserSession();
        if (!session) return unauthorizedResponse();

        const registrations = await prisma.competitionRegistration.findMany({
            where: { userId: session.user.id },
            include: {
                competition: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(registrations);
    } catch (error) {
        console.error('Fetch my competition registrations error:', error);
        return NextResponse.json({ message: 'Failed to fetch registrations' }, { status: 500 });
    }
}
