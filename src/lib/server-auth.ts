import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function getAdminSession() {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
        return null;
    }
    return session;
}

export async function getUserSession() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
        return null;
    }
    return session;
}

export function unauthorizedResponse() {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
