import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminSession, unauthorizedResponse } from '@/lib/server-auth';

const parseSafeDate = (d: any) => {
    if (!d || d === "") return null;
    const date = new Date(d);
    return isNaN(date.getTime()) ? null : date;
};

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getAdminSession();
    if (!session) return unauthorizedResponse();

    try {
        const { id } = await params;
        const data = await req.json();

        const competitionDate = parseSafeDate(data.date) || parseSafeDate(data.perfStart) || new Date();

        const competition = await prisma.competition.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                date: competitionDate,
                regStart: parseSafeDate(data.regStart),
                regEnd: parseSafeDate(data.regEnd),
                tmStart: parseSafeDate(data.tmStart),
                perfStart: parseSafeDate(data.perfStart),
                perfEnd: parseSafeDate(data.perfEnd),
                location: data.location,
                venue: data.venue || data.location,
                image: data.image || null,
                moreInfoImage: data.moreInfoImage || null,
                contactPerson: data.contactPerson || null,
                category: data.category,
                registrationFee: data.registrationFee ? parseFloat(data.registrationFee) : 0,
                status: data.status || 'UPCOMING',
            }
        });

        return NextResponse.json(competition);
    } catch (error) {
        console.error('Update competition error:', error);
        return NextResponse.json({ error: 'Failed to update competition' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getAdminSession();
    if (!session) return unauthorizedResponse();

    try {
        const { id } = await params;

        await prisma.competition.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete competition error:', error);
        return NextResponse.json({ error: 'Failed to delete competition' }, { status: 500 });
    }
}
