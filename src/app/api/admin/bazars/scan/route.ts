import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminSession, unauthorizedResponse } from '@/lib/server-auth';

// POST — Scan/validate a bazaar participant
export async function POST(req: Request) {
    const session = await getAdminSession();
    if (!session) return unauthorizedResponse();

    try {
        const { ticketCode } = await req.json();

        if (!ticketCode) {
            return NextResponse.json({ valid: false, message: 'No code provided' }, { status: 400 });
        }

        // Extract ID from QR format "ELVIN-BAZAR:{id}"
        const registrationId = ticketCode.replace('ELVIN-BAZAR:', '');

        const registration = await prisma.bazar.findUnique({
            where: { id: registrationId },
            include: {
                event: true,
                user: { select: { name: true, email: true } }
            }
        });

        if (!registration) {
            return NextResponse.json({
                valid: false,
                message: 'Registrasi tidak ditemukan. QR code tidak valid atau bukan untuk bazaar.',
            });
        }

        if (registration.status !== 'CONFIRMED') {
            return NextResponse.json({
                valid: false,
                message: `Status registrasi: ${registration.status}. Peserta belum dikonfirmasi atau pembayaran belum valid.`,
                registration: {
                    id: registration.id,
                    buyerName: registration.name,
                    eventName: registration.event.name,
                    status: registration.status
                }
            });
        }

        if (registration.isCheckedIn) {
            return NextResponse.json({
                valid: false,
                message: `Peserta sudah terdaftar/masuk pada ${new Date(registration.checkedInAt!).toLocaleString('id-ID')}`,
                registration: {
                    id: registration.id,
                    buyerName: registration.name,
                    eventName: registration.event.name,
                    checkedInAt: registration.checkedInAt,
                }
            });
        }

        // Mark as checked in
        const updated = await prisma.bazar.update({
            where: { id: registrationId },
            data: {
                isCheckedIn: true,
                checkedInAt: new Date(),
            }
        });

        return NextResponse.json({
            valid: true,
            message: 'Registrasi valid! Peserta berhasil diverifikasi.',
            registration: {
                id: registration.id,
                buyerName: registration.name,
                eventName: registration.event.name,
                checkedInAt: updated.checkedInAt,
            }
        });
    } catch (error) {
        console.error('Bazar Scan error:', error);
        return NextResponse.json({ valid: false, message: 'Terjadi kesalahan saat verifikasi' }, { status: 500 });
    }
}

// GET — Fetch bazaar attendance list
export async function GET() {
    const session = await getAdminSession();
    if (!session) return unauthorizedResponse();

    try {
        const attendanceList = await prisma.bazar.findMany({
            where: { isCheckedIn: true },
            include: {
                event: { select: { name: true, id: true } },
                user: { select: { name: true, email: true } }
            },
            orderBy: { checkedInAt: 'desc' }
        });

        return NextResponse.json(attendanceList);
    } catch (error) {
        console.error('Bazar attendance list error:', error);
        return NextResponse.json({ error: 'Failed to fetch attendance list' }, { status: 500 });
    }
}
