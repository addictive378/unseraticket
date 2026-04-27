import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const bazar = await prisma.bazar.findUnique({
            where: { id },
        });

        if (!bazar) {
            return NextResponse.json({ message: 'Bazar application not found' }, { status: 404 });
        }

        if (bazar.userId !== session.user.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
        }

        // Check expiry (5 minutes)
        const PAYMENT_DEADLINE_MS = 5 * 60 * 1000;
        if (bazar.status === 'PENDING_PAYMENT' && (Date.now() - new Date(bazar.createdAt).getTime()) > PAYMENT_DEADLINE_MS) {
            await prisma.bazar.update({
                where: { id },
                data: { status: 'CANCELLED' },
            });
            return NextResponse.json({ message: 'Order telah kedaluwarsa. Silakan buat order baru.' }, { status: 400 });
        }

        if (bazar.status !== 'PENDING_PAYMENT') {
            return NextResponse.json({ message: 'Payment proof already uploaded or application not in valid state' }, { status: 400 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const ext = file.name.split('.').pop();
        const fileName = `bazar_proof_${id}_${Date.now()}.${ext}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'proofs');

        await mkdir(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, fileName), buffer);

        const fileUrl = `/uploads/proofs/${fileName}`;

        const updated = await prisma.bazar.update({
            where: { id },
            data: {
                paymentProof: fileUrl,
                proofUploadedAt: new Date(),
                status: 'PENDING_VALIDATION',
            },
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error('Bazar upload proof error:', error);
        return NextResponse.json({ message: error.message || 'Failed to upload proof' }, { status: 500 });
    }
}
