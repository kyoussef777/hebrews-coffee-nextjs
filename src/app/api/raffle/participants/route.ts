import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { customerName, phoneNumber } = await request.json();

    if (!customerName?.trim() || !phoneNumber?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Customer name and phone number are required' },
        { status: 400 }
      );
    }

    // Count the number of orders for this customer
    const orderCount = await prisma.order.count({
      where: {
        customerName: customerName.trim()
      }
    });

    const participant = await prisma.raffleParticipant.upsert({
      where: {
        customerName_phoneNumber: {
          customerName: customerName.trim(),
          phoneNumber: phoneNumber.trim()
        }
      },
      update: {
        entries: orderCount,
        updatedAt: new Date()
      },
      create: {
        customerName: customerName.trim(),
        phoneNumber: phoneNumber.trim(),
        entries: orderCount
      }
    });

    return NextResponse.json({
      success: true,
      data: participant,
      message: 'Successfully joined the giveaway!'
    });

  } catch (error) {
    console.error('Error adding giveaway participant:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to join giveaway' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eligibleOnly = searchParams.get('eligible') === 'true';

    const participants = await prisma.raffleParticipant.findMany({
      where: eligibleOnly ? { hasWon: false } : undefined,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: participants
    });

  } catch (error) {
    console.error('Error fetching giveaway participants:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch participants' },
      { status: 500 }
    );
  }
}