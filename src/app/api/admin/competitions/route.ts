import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminSession, unauthorizedResponse } from '@/lib/server-auth';

export async function GET() {
    const session = await getAdminSession();
    if (!session) return unauthorizedResponse();

    try {
        const competitions = await prisma.competition.findMany({
            orderBy: { date: 'asc' },
        });
        return NextResponse.json(competitions);
    } catch (error) {
        console.error('Fetch competitions error:', error);
        return NextResponse.json({ error: 'Failed to fetch competitions' }, { status: 500 });
    }
}

const parseSafeDate = (d: any) => {
    if (!d || d === "") return null;
    const date = new Date(d);
    return isNaN(date.getTime()) ? null : date;
};

export async function POST(req: Request) {
    const session = await getAdminSession();
    if (!session) return unauthorizedResponse();

    try {
        const data = await req.json();

        const competitionDate = parseSafeDate(data.date) || parseSafeDate(data.perfStart) || new Date();

        const competition = await prisma.competition.create({
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

        return NextResponse.json(competition, { status: 201 });
    } catch (error) {
        console.error('Create competition error:', error);
        return NextResponse.json({ error: 'Failed to create competition' }, { status: 500 });
    }
}
