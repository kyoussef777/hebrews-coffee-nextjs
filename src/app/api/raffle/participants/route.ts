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

    const participant = await prisma.raffleParticipant.upsert({
      where: {
        customerName_phoneNumber: {
          customerName: customerName.trim(),
          phoneNumber: phoneNumber.trim()
        }
      },
      update: {
        updatedAt: new Date()
      },
      create: {
        customerName: customerName.trim(),
        phoneNumber: phoneNumber.trim()
      }
    });

    return NextResponse.json({
      success: true,
      data: participant,
      message: 'Successfully joined the raffle!'
    });

  } catch (error) {
    console.error('Error adding raffle participant:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to join raffle' },
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
    console.error('Error fetching raffle participants:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch participants' },
      { status: 500 }
    );
  }
}