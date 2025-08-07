import { NextRequest, NextResponse } from 'next/server';
import { parseJson, errorResponse, requireAdmin, requireAuth } from '@/lib/apiUtils';
import { prisma } from '@/lib/db';
import { InventoryCostFormData } from '@/types';

// GET /api/inventory-costs/[id] - Get specific inventory cost
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Both admin and staff can view individual inventory costs
    await requireAuth();
    const { id } = await params;
    const inventoryCost = await prisma.inventoryCost.findUnique({ where: { id } });
    if (!inventoryCost) {
      return errorResponse('Inventory cost not found', 404);
    }
    return NextResponse.json({ success: true, data: inventoryCost });
  } catch (err) {
    if (err instanceof Response) {
      return err;
    }
    console.error('Error fetching inventory cost:', err);
    return errorResponse('Failed to fetch inventory cost', 500);
  }
}

// PATCH /api/inventory-costs/[id] - Update inventory cost
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body: Partial<InventoryCostFormData> = await parseJson(request);
    if (body.unitCost !== undefined && body.unitCost <= 0) {
      return errorResponse('Unit cost must be greater than 0', 400);
    }
    const inventoryCost = await prisma.inventoryCost.update({
      where: { id },
      data: {
        ...(body.itemName && { itemName: body.itemName.trim() }),
        ...(body.category && { category: body.category }),
        ...(body.unitCost !== undefined && { unitCost: body.unitCost }),
        ...(body.unit && { unit: body.unit.trim() }),
        ...(body.notes !== undefined && { notes: body.notes?.trim() || null }),
      },
    });
    return NextResponse.json({ success: true, data: inventoryCost });
  } catch (err) {
    if (err instanceof Response) {
      return err;
    }
    console.error('Error updating inventory cost:', err);
    return errorResponse('Failed to update inventory cost', 500);
  }
}

// DELETE /api/inventory-costs/[id] - Delete inventory cost
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.inventoryCost.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Inventory cost deleted successfully' });
  } catch (err) {
    if (err instanceof Response) {
      return err;
    }
    console.error('Error deleting inventory cost:', err);
    return errorResponse('Failed to delete inventory cost', 500);
  }
}