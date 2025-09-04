import { NextRequest, NextResponse } from 'next/server';
import { parseJson, errorResponse, requireAdmin } from '@/lib/apiUtils';
import { prisma } from '@/lib/db';
import { InventoryItemFormData } from '@/types';

// PATCH /api/inventory-items/[id] - Update inventory item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body: Partial<InventoryItemFormData> = await parseJson(request);
    
    if ((body.currentStock !== undefined && body.currentStock < 0) || 
        (body.initialQuantity !== undefined && body.initialQuantity < 0)) {
      return errorResponse('Quantities cannot be negative', 400);
    }
    
    // If initial quantity is being updated, recalculate total cost
    const updateData: Record<string, unknown> = {
      ...(body.currentStock !== undefined && { currentStock: body.currentStock }),
      ...(body.reorderLevel !== undefined && { reorderLevel: body.reorderLevel }),
      ...(body.lastRestocked && { lastRestocked: new Date(body.lastRestocked) }),
    };
    
    if (body.initialQuantity !== undefined) {
      // Get the cost item to recalculate total cost
      const costItem = await prisma.inventoryCost.findUnique({
        where: { id: (await prisma.inventoryItem.findUnique({ where: { id } }))?.costItemId }
      });
      
      if (costItem) {
        Object.assign(updateData, {
          initialQuantity: body.initialQuantity,
          totalCost: costItem.unitCost * body.initialQuantity,
        });
      }
    }
    
    const inventoryItem = await prisma.inventoryItem.update({
      where: { id },
      data: updateData,
      include: {
        costItem: true,
      },
    });
    
    return NextResponse.json({ success: true, data: inventoryItem });
  } catch (err) {
    if (err instanceof Response) {
      return err;
    }
    console.error('Error updating inventory item:', err);
    return errorResponse('Failed to update inventory item', 500);
  }
}

// DELETE /api/inventory-items/[id] - Delete inventory item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    
    await prisma.inventoryItem.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true, message: 'Inventory item deleted' });
  } catch (err) {
    if (err instanceof Response) {
      return err;
    }
    console.error('Error deleting inventory item:', err);
    return errorResponse('Failed to delete inventory item', 500);
  }
}