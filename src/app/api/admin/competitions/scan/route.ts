import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminSession, unauthorizedResponse } from '@/lib/server-auth';

// POST — Scan/validate a competition participant
export async function POST(req: Request) {
    const session = await getAdminSession();
    if (!session) return unauthorizedResponse();

    try {
        const { ticketCode } = await req.json();

        if (!ticketCode) {
            return NextResponse.json({ valid: false, message: 'No code provided' }, { status: 400 });
        }

        // Extract ID from QR format "ELVIN-COMP:{id}"
        const registrationId = ticketCode.replace('ELVIN-COMP:', '');

        const registration = await prisma.competitionRegistration.findUnique({
            where: { id: registrationId },
            include: {
                competition: true,
                user: { select: { name: true, email: true } }
            }
        });

        if (!registration) {
            return NextResponse.json({
                valid: false,
                message: 'Registrasi tidak ditemukan. QR code tidak valid atau bukan untuk kompetisi.',
            });
        }

        if (registration.status !== 'CONFIRMED') {
            return NextResponse.json({
                valid: false,
                message: `Status registrasi: ${registration.status}. Peserta belum dikonfirmasi atau pembayaran belum valid.`,
                registration: {
                    id: registration.id,
                    buyerName: registration.buyerName,
                    competitionName: registration.competition.name,
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
                    buyerName: registration.buyerName,
                    competitionName: registration.competition.name,
                    checkedInAt: registration.checkedInAt,
                }
            });
        }

        // Mark as checked in
        const updated = await prisma.competitionRegistration.update({
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
                buyerName: registration.buyerName,
                competitionName: registration.competition.name,
                checkedInAt: updated.checkedInAt,
            }
        });
    } catch (error) {
        console.error('Competition Scan error:', error);
        return NextResponse.json({ valid: false, message: 'Terjadi kesalahan saat verifikasi' }, { status: 500 });
    }
}

// GET — Fetch competition attendance list
export async function GET() {
    const session = await getAdminSession();
    if (!session) return unauthorizedResponse();

    try {
        const attendanceList = await prisma.competitionRegistration.findMany({
            where: { isCheckedIn: true },
            include: {
                competition: { select: { name: true, id: true } },
                user: { select: { name: true, email: true } }
            },
            orderBy: { checkedInAt: 'desc' }
        });

        return NextResponse.json(attendanceList);
    } catch (error) {
        console.error('Attendance list error:', error);
        return NextResponse.json({ error: 'Failed to fetch attendance list' }, { status: 500 });
    }
}
