import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminSession, unauthorizedResponse } from '@/lib/server-auth';
import { hash } from 'bcryptjs';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();

  try {
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }

    const hashedPassword = await hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'USER'
      }
    });

    return NextResponse.json({ message: 'User created successfully', id: user.id });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();

  try {
    const { id, name, email, role, password } = await req.json();

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (password) {
      updateData.password = await hash(password, 12);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData
    });
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();

  try {
    const { id } = await req.json();

    await prisma.$transaction(async (tx) => {
      // 1. Delete all IssuedTickets for the user
      await tx.issuedTicket.deleteMany({
        where: { userId: id }
      });

      // 2. Also delete IssuedTickets related to the user's purchases 
      // (even if holderName is different, though usually they are linked)
      const userPurchases = await tx.ticketPurchase.findMany({
        where: { userId: id },
        select: { id: true }
      });
      const purchaseIds = userPurchases.map(p => p.id);

      if (purchaseIds.length > 0) {
        await tx.issuedTicket.deleteMany({
          where: { purchaseId: { in: purchaseIds } }
        });

        // 3. Delete TicketPurchases
        await tx.ticketPurchase.deleteMany({
          where: { userId: id }
        });
      }

      // 4. Delete Bazars
      await tx.bazar.deleteMany({
        where: { userId: id }
      });

      // 5. Delete CompetitionRegistrations
      await tx.competitionRegistration.deleteMany({
        where: { userId: id }
      });

      // 6. Finally delete the User
      await tx.user.delete({
        where: { id }
      });
    });

    return NextResponse.json({ message: 'User and all related data deleted successfully' });
  } catch (error: any) {
    console.error('Error during user cascade delete:', error);
    return NextResponse.json({
      error: 'Failed to delete user',
      details: error.message
    }, { status: 500 });
  }
}
