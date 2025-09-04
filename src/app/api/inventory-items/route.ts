import { NextRequest, NextResponse } from 'next/server';
import { parseJson, errorResponse, requireAdmin, requireAuth } from '@/lib/apiUtils';
import { prisma } from '@/lib/db';
import { InventoryItemFormData } from '@/types';

// GET /api/inventory-items - Get all inventory items with cost data
export async function GET() {
  try {
    await requireAuth();
    
    const inventoryItems = await prisma.inventoryItem.findMany({
      include: {
        costItem: true,
      },
      orderBy: {
        costItem: {
          itemName: 'asc',
        },
      },
    });
    
    return NextResponse.json({ success: true, data: inventoryItems });
  } catch (err) {
    if (err instanceof Response) {
      return err;
    }
    console.error('Error fetching inventory items:', err);
    return errorResponse('Failed to fetch inventory items', 500);
  }
}

// POST /api/inventory-items - Create new inventory item
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body: InventoryItemFormData = await parseJson(request);
    
    // Validate required fields
    if (!body.costItemId || body.initialQuantity === undefined || body.currentStock === undefined) {
      return errorResponse('Missing required fields: costItemId, initialQuantity, currentStock', 400);
    }
    
    if (body.initialQuantity < 0 || body.currentStock < 0) {
      return errorResponse('Quantities cannot be negative', 400);
    }

    // Check if inventory item already exists for this cost item
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { costItemId: body.costItemId },
    });

    if (existingItem) {
      return errorResponse('Inventory item already exists for this cost item', 400);
    }
    
    // Get the cost item to calculate total cost
    const costItem = await prisma.inventoryCost.findUnique({
      where: { id: body.costItemId }
    });
    
    if (!costItem) {
      return errorResponse('Cost item not found', 404);
    }
    
    const totalCost = costItem.unitCost * body.initialQuantity;
    
    const inventoryItem = await prisma.inventoryItem.create({
      data: {
        costItemId: body.costItemId,
        initialQuantity: body.initialQuantity,
        currentStock: body.currentStock,
        reorderLevel: body.reorderLevel || null,
        lastRestocked: body.lastRestocked || new Date(),
        totalCost: totalCost,
      },
      include: {
        costItem: true,
      },
    });
    
    return NextResponse.json({ success: true, data: inventoryItem });
  } catch (err) {
    if (err instanceof Response) {
      return err;
    }
    console.error('Error creating inventory item:', err);
    return errorResponse('Failed to create inventory item', 500);
  }
}