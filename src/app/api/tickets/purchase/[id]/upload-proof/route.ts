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

        // Verify this purchase belongs to the user
        const purchase = await prisma.ticketPurchase.findUnique({
            where: { id },
        });

        if (!purchase) {
            return NextResponse.json({ message: 'Purchase not found' }, { status: 404 });
        }

        if (purchase.userId !== session.user.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
        }

        // Check if order has expired (5 minute deadline)
        const PAYMENT_DEADLINE_MS = 5 * 60 * 1000;
        if (purchase.status === 'PENDING_PAYMENT' && (Date.now() - new Date(purchase.createdAt).getTime()) > PAYMENT_DEADLINE_MS) {
            await prisma.ticketPurchase.update({
                where: { id },
                data: { status: 'CANCELLED' },
            });
            return NextResponse.json({ message: 'Order telah kedaluwarsa. Silakan buat order baru.' }, { status: 400 });
        }

        if (purchase.status !== 'PENDING_PAYMENT') {
            return NextResponse.json({ message: 'Payment proof already uploaded or order not in valid state' }, { status: 400 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
        }

        // Save file to public/uploads/proofs
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const ext = file.name.split('.').pop();
        const fileName = `proof_${id}_${Date.now()}.${ext}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'proofs');

        await mkdir(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, fileName), buffer);

        const fileUrl = `/uploads/proofs/${fileName}`;

        // Update purchase
        const updated = await prisma.ticketPurchase.update({
            where: { id },
            data: {
                paymentProof: fileUrl,
                proofUploadedAt: new Date(),
                status: 'PENDING_VALIDATION',
            },
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error('Upload proof error:', error);
        return NextResponse.json({ message: error.message || 'Failed to upload proof' }, { status: 500 });
    }
}
