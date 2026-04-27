import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminSession, unauthorizedResponse } from '@/lib/server-auth';

export async function GET() {
    const session = await getAdminSession();
    if (!session) return unauthorizedResponse();

    try {
        let settings = await prisma.siteSettings.findUnique({
            where: { id: 'vibrant-pulse-settings' }
        });

        if (!settings) {
            settings = await prisma.siteSettings.create({
                data: { id: 'vibrant-pulse-settings' }
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error fetching site settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await getAdminSession();
    if (!session) return unauthorizedResponse();

    try {
        const body = await req.json();

        // Remove id and updatedAt from body to prevent issues
        const { id, updatedAt, ...updateData } = body;

        const settings = await prisma.siteSettings.upsert({
            where: { id: 'vibrant-pulse-settings' },
            update: updateData,
            create: { id: 'vibrant-pulse-settings', ...updateData }
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error updating site settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
