import { NextRequest, NextResponse } from 'next/server';
import { parseJson, errorResponse, requireAuth } from '@/lib/apiUtils';
import { prisma } from '@/lib/db';

// POST /api/inventory-usage/close - Close the current day's usage session
export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await parseJson(request);
    const { date } = body;
    
    if (!date) {
      return errorResponse('Date is required', 400);
    }
    
    const sessionDate = new Date(date);
    sessionDate.setHours(0, 0, 0, 0);
    
    const session = await prisma.inventoryUsageSession.findUnique({
      where: { date: sessionDate },
      include: {
        usageEntries: {
          include: {
            inventoryItem: {
              include: {
                costItem: true,
              },
            },
          },
        },
      },
    });
    
    if (!session) {
      return errorResponse('No usage session found for this date', 404);
    }
    
    if (!session.isActive) {
      return errorResponse('Usage session is already closed', 400);
    }
    
    // Check if all entries have ending quantities
    const incompleteEntries = session.usageEntries.filter(entry => entry.endingQuantity === null);
    if (incompleteEntries.length > 0) {
      return errorResponse('Cannot close session: some items are missing ending quantities', 400);
    }
    
    // Close the session
    const closedSession = await prisma.inventoryUsageSession.update({
      where: { id: session.id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
      include: {
        usageEntries: {
          include: {
            inventoryItem: {
              include: {
                costItem: true,
              },
            },
          },
        },
      },
    });
    
    return NextResponse.json({ 
      success: true, 
      data: closedSession,
      message: 'Usage session closed successfully'
    });
  } catch (err) {
    if (err instanceof Response) {
      return err;
    }
    console.error('Error closing inventory usage session:', err);
    return errorResponse('Failed to close inventory usage session', 500);
  }
}