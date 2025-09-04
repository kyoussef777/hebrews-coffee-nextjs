import { NextRequest, NextResponse } from 'next/server';
import { parseJson, errorResponse, requireAdmin } from '@/lib/apiUtils';
import { prisma } from '@/lib/db';
import { InventoryItemFormData } from '@/types';

// PATCH /api/simple-inventory/[id] - Update simple inventory item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body: Partial<InventoryItemFormData> = await parseJson(request);
    
    if (body.initialQuantity !== undefined && body.initialQuantity < 0) {
      return errorResponse('Initial quantity cannot be negative', 400);
    }
    
    if (body.currentStock !== undefined && body.currentStock < 0) {
      return errorResponse('Current stock cannot be negative', 400);
    }

    // Check if the record exists first
    const existingItem = await prisma.simpleInventory.findUnique({
      where: { id }
    });
    
    if (!existingItem) {
      return errorResponse('Inventory item not found', 404);
    }

    // Update with transaction to track quantity changes
    const updatedItem = await prisma.$transaction(async (tx) => {
      const inventoryItem = await tx.simpleInventory.update({
        where: { id },
        data: {
          ...(body.itemName && { itemName: body.itemName }),
          ...(body.category && { category: body.category }),
          ...(body.unit && { unit: body.unit }),
          ...(body.notes !== undefined && { notes: body.notes }),
          ...(body.reorderLevel !== undefined && { reorderLevel: body.reorderLevel }),
          ...(body.currentStock !== undefined && { currentStock: body.currentStock }),
          ...(body.initialQuantity !== undefined && { initialQuantity: body.initialQuantity }),
        },
      });

      // Create quantity log if current stock changed
      if (body.currentStock !== undefined && body.currentStock !== existingItem.currentStock) {
        await tx.quantityLog.create({
          data: {
            simpleInventoryId: inventoryItem.id,
            previousQuantity: existingItem.currentStock,
            newQuantity: body.currentStock,
            changeAmount: body.currentStock - existingItem.currentStock,
            changeReason: 'adjustment',
            notes: `Stock updated from ${existingItem.currentStock} to ${body.currentStock}`,
          },
        });
      }

      return inventoryItem;
    });
    
    const simpleInventoryItem = {
      id: updatedItem.id,
      itemName: updatedItem.itemName,
      category: updatedItem.category,
      initialQuantity: updatedItem.initialQuantity,
      currentStock: updatedItem.currentStock,
      unit: updatedItem.unit,
      reorderLevel: updatedItem.reorderLevel,
      notes: updatedItem.notes,
      createdAt: updatedItem.createdAt,
      updatedAt: updatedItem.updatedAt,
    };
    
    return NextResponse.json({ success: true, data: simpleInventoryItem });
  } catch (err) {
    if (err instanceof Response) {
      return err;
    }
    console.error('Error updating simple inventory item:', err);
    return errorResponse('Failed to update inventory item', 500);
  }
}

// DELETE /api/simple-inventory/[id] - Delete simple inventory item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    
    // Check if the record exists first
    const existingItem = await prisma.simpleInventory.findUnique({
      where: { id }
    });
    
    if (!existingItem) {
      return errorResponse('Inventory item not found', 404);
    }
    
    // Delete will cascade to quantity logs automatically
    await prisma.simpleInventory.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true, message: 'Inventory item deleted successfully' });
  } catch (err) {
    if (err instanceof Response) {
      return err;
    }
    console.error('Error deleting simple inventory item:', err);
    return errorResponse('Failed to delete inventory item', 500);
  }
}