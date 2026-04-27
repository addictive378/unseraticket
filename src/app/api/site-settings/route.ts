import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        let settings = await prisma.siteSettings.findUnique({
            where: { id: 'vibrant-pulse-settings' }
        });

        if (!settings) {
            // Create default settings if they don't exist
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
