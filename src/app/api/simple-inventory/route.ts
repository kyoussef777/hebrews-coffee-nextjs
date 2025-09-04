import { NextRequest, NextResponse } from 'next/server';
import { parseJson, errorResponse, requireAdmin, requireAuth } from '@/lib/apiUtils';
import { prisma } from '@/lib/db';
import { InventoryItemFormData } from '@/types';

// GET /api/simple-inventory - Get all simple inventory items
export async function GET() {
  try {
    await requireAuth();
    
    const inventoryItems = await prisma.simpleInventory.findMany({
      include: {
        quantityLogs: {
          orderBy: { createdAt: 'desc' },
          take: 5, // Get last 5 changes for each item
        },
      },
      orderBy: {
        itemName: 'asc',
      },
    });
    
    return NextResponse.json({ success: true, data: inventoryItems });
  } catch (err) {
    if (err instanceof Response) {
      return err;
    }
    console.error('Error fetching simple inventory:', err);
    return errorResponse('Failed to fetch inventory items', 500);
  }
}

// POST /api/simple-inventory - Create new simple inventory item
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body: InventoryItemFormData = await parseJson(request);
    
    // Validate required fields
    if (!body.itemName || !body.category || !body.unit) {
      return errorResponse('Missing required fields: itemName, category, unit', 400);
    }
    
    if ((body.initialQuantity || 0) < 0 || (body.currentStock || 0) < 0) {
      return errorResponse('Quantities cannot be negative', 400);
    }

    // Check if item with same name already exists
    const existingItem = await prisma.simpleInventory.findFirst({
      where: { 
        itemName: body.itemName,
        category: body.category 
      },
    });

    if (existingItem) {
      return errorResponse('Item with this name already exists in this category', 400);
    }
    
    const initialQuantity = body.initialQuantity || 0;
    const currentStock = body.currentStock || initialQuantity;
    
    // Create the inventory item and initial quantity log in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the inventory item
      const inventoryItem = await tx.simpleInventory.create({
        data: {
          itemName: body.itemName,
          category: body.category,
          initialQuantity,
          currentStock,
          unit: body.unit,
          reorderLevel: body.reorderLevel || null,
          notes: body.notes || null,
        },
      });

      // Create initial quantity log
      if (initialQuantity > 0) {
        await tx.quantityLog.create({
          data: {
            simpleInventoryId: inventoryItem.id,
            previousQuantity: 0,
            newQuantity: initialQuantity,
            changeAmount: initialQuantity,
            changeReason: 'initial_stock',
            notes: 'Initial inventory setup',
          },
        });
      }

      return inventoryItem;
    });
    
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    if (err instanceof Response) {
      return err;
    }
    console.error('Error creating simple inventory item:', err);
    return errorResponse('Failed to create inventory item', 500);
  }
}