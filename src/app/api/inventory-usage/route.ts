import { NextRequest, NextResponse } from 'next/server';
import { parseJson, errorResponse, requireAuth } from '@/lib/apiUtils';
import { prisma } from '@/lib/db';
import { InventoryUsageSessionData } from '@/types';

// GET /api/inventory-usage - Get current or specific date usage session
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    // Reset to start of day for consistent date matching
    targetDate.setHours(0, 0, 0, 0);
    
    const usageSession = await prisma.inventoryUsageSession.findUnique({
      where: { date: targetDate },
      include: {
        usageEntries: {
          include: {
            inventoryItem: {
              include: {
                costItem: true,
              },
            },
          },
          orderBy: {
            inventoryItem: {
              costItem: {
                itemName: 'asc',
              },
            },
          },
        },
      },
    });
    
    return NextResponse.json({ success: true, data: usageSession });
  } catch (err) {
    if (err instanceof Response) {
      return err;
    }
    console.error('Error fetching inventory usage:', err);
    return errorResponse('Failed to fetch inventory usage', 500);
  }
}

// POST /api/inventory-usage - Create or update usage session
export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body: InventoryUsageSessionData = await parseJson(request);
    
    if (!body.date || !body.entries) {
      return errorResponse('Missing required fields', 400);
    }
    
    const sessionDate = new Date(body.date);
    sessionDate.setHours(0, 0, 0, 0);
    
    // Upsert the session
    const session = await prisma.inventoryUsageSession.upsert({
      where: { date: sessionDate },
      create: { 
        date: sessionDate,
        isActive: true,
      },
      update: {
        isActive: true,
        updatedAt: new Date(),
      },
    });
    
    // Process entries
    const processedEntries = [];
    for (const entry of body.entries) {
      if (!entry.inventoryItemId || entry.startingQuantity === undefined) {
        continue; // Skip invalid entries
      }
      
      const usageEntry = await prisma.inventoryUsageEntry.upsert({
        where: {
          sessionId_inventoryItemId: {
            sessionId: session.id,
            inventoryItemId: entry.inventoryItemId,
          },
        },
        create: {
          sessionId: session.id,
          inventoryItemId: entry.inventoryItemId,
          startingQuantity: entry.startingQuantity,
          endingQuantity: entry.endingQuantity || null,
          usedQuantity: entry.endingQuantity !== undefined 
            ? entry.startingQuantity - entry.endingQuantity 
            : null,
          notes: entry.notes || null,
        },
        update: {
          startingQuantity: entry.startingQuantity,
          endingQuantity: entry.endingQuantity || null,
          usedQuantity: entry.endingQuantity !== undefined 
            ? entry.startingQuantity - entry.endingQuantity 
            : null,
          notes: entry.notes || null,
          updatedAt: new Date(),
        },
        include: {
          inventoryItem: {
            include: {
              costItem: true,
            },
          },
        },
      });
      
      // If ending quantity is provided, update the inventory item's current stock
      if (entry.endingQuantity !== undefined) {
        await prisma.inventoryItem.update({
          where: { id: entry.inventoryItemId },
          data: { currentStock: entry.endingQuantity },
        });
      }
      
      processedEntries.push(usageEntry);
    }
    
    const updatedSession = await prisma.inventoryUsageSession.findUnique({
      where: { id: session.id },
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
    
    return NextResponse.json({ success: true, data: updatedSession });
  } catch (err) {
    if (err instanceof Response) {
      return err;
    }
    console.error('Error saving inventory usage:', err);
    return errorResponse('Failed to save inventory usage', 500);
  }
}