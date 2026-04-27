import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/admin/tickets?eventId=...
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
        return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    try {
        const tickets = await prisma.ticket.findMany({
            where: { eventId },
            orderBy: { price: "asc" },
        });
        return NextResponse.json(tickets);
    } catch (error) {
        console.error("Error fetching tickets:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST /api/admin/tickets
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { eventId, type, price, stock, status: ticketStatus } = body;

        if (!eventId || !type || price === undefined || stock === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const ticket = await prisma.ticket.create({
            data: {
                eventId,
                type,
                price: parseFloat(price),
                stock: parseInt(stock),
                status: ticketStatus || "ACTIVE",
            } as any,
        });

        return NextResponse.json(ticket);
    } catch (error) {
        console.error("Error creating ticket:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE /api/admin/tickets?id=...
export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    try {
        // Check if this is the last ticket for the event
        const ticketToDelete = await prisma.ticket.findUnique({
            where: { id },
        });

        if (!ticketToDelete) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }

        const ticketCount = await prisma.ticket.count({
            where: { eventId: ticketToDelete.eventId },
        });

        if (ticketCount <= 1) {
            return NextResponse.json({ error: "Cannot delete the last ticket tier." }, { status: 400 });
        }

        await prisma.ticket.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Ticket deleted successfully" });
    } catch (error) {
        console.error("Error deleting ticket:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PUT /api/admin/tickets
export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, type, price, stock, status: ticketStatus } = body;

        if (!id || !type || price === undefined || stock === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const ticket = await prisma.ticket.update({
            where: { id },
            data: {
                type,
                price: parseFloat(price),
                stock: parseInt(stock),
                status: ticketStatus,
            } as any,
        });

        return NextResponse.json(ticket);
    } catch (error) {
        console.error("Error updating ticket:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
