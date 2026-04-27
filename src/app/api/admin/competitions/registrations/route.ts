import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminSession, unauthorizedResponse } from '@/lib/server-auth';

export async function GET() {
    const session = await getAdminSession();
    if (!session) return unauthorizedResponse();

    try {
        const registrations = await prisma.competitionRegistration.findMany({
            include: {
                competition: { select: { name: true, registrationFee: true } },
                user: { select: { name: true, email: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(registrations);
    } catch (error) {
        console.error('Fetch competition registrations error:', error);
        return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const session = await getAdminSession();
    if (!session) return unauthorizedResponse();

    try {
        const { id, status } = await req.json();
        const registration = await prisma.competitionRegistration.update({
            where: { id },
            data: { status }
        });
        return NextResponse.json(registration);
    } catch (error) {
        console.error('Update competition registration error:', error);
        return NextResponse.json({ error: 'Failed to update registration status' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getAdminSession();
    if (!session) return unauthorizedResponse();

    try {
        const { id } = await req.json();
        await prisma.competitionRegistration.delete({ where: { id } });
        return NextResponse.json({ message: 'Registration deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete registration' }, { status: 500 });
    }
}
