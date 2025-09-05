import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Get all eligible participants (those who haven't won yet)
    const eligibleParticipants = await prisma.raffleParticipant.findMany({
      where: { hasWon: false },
      orderBy: { createdAt: 'desc' }
    });

    if (eligibleParticipants.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No eligible participants found' },
        { status: 400 }
      );
    }

    // Create a weighted list based on entries
    const weightedParticipants: string[] = [];
    eligibleParticipants.forEach(participant => {
      for (let i = 0; i < participant.entries; i++) {
        weightedParticipants.push(participant.id);
      }
    });

    if (weightedParticipants.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No entries found for eligible participants' },
        { status: 400 }
      );
    }

    // Randomly select from weighted list
    const randomIndex = Math.floor(Math.random() * weightedParticipants.length);
    const winnerId = weightedParticipants[randomIndex];
    const winner = eligibleParticipants.find(p => p.id === winnerId)!;

    // Mark the winner as having won
    const updatedWinner = await prisma.raffleParticipant.update({
      where: { id: winner.id },
      data: { hasWon: true }
    });

    return NextResponse.json({
      success: true,
      data: updatedWinner,
      message: `Congratulations to ${winner.customerName}!`
    });

  } catch (error) {
    console.error('Error drawing giveaway winner:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to draw giveaway winner' },
      { status: 500 }
    );
  }
}