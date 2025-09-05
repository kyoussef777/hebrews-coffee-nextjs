import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Reset all participants to eligible status (hasWon = false)
    const result = await prisma.raffleParticipant.updateMany({
      where: { hasWon: true },
      data: { hasWon: false }
    });

    return NextResponse.json({
      success: true,
      message: `Reset ${result.count} previous winners back to eligible status`
    });

  } catch (error) {
    console.error('Error resetting giveaway:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to reset giveaway' },
      { status: 500 }
    );
  }
}