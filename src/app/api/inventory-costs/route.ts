import { NextRequest, NextResponse } from 'next/server';
import { parseJson, errorResponse, requireAdmin, requireAuth } from '@/lib/apiUtils';
import { prisma } from '@/lib/db';
import { InventoryCostFormData, InventoryCategory } from '@/types';

// GET /api/inventory-costs - Get all inventory costs
export async function GET(request: NextRequest) {
  try {
    // Authenticated users can view inventory costs (staff and admin)
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const where = category ? { category: category as InventoryCategory } : {};
    const inventoryCosts = await prisma.inventoryCost.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { itemName: 'asc' },
      ],
    });
    return NextResponse.json({ success: true, data: inventoryCosts });
  } catch (err) {
    if (err instanceof Response) {
      return err;
    }
    console.error('Error fetching inventory costs:', err);
    return errorResponse('Failed to fetch inventory costs', 500);
  }
}

// POST /api/inventory-costs - Create new inventory cost
export async function POST(request: NextRequest) {
  try {
    // Only admins can create inventory costs
    await requireAdmin();
    const body: InventoryCostFormData = await parseJson(request);
    // Validate required fields
    if (!body.itemName || !body.category || body.unitCost === undefined || !body.unit) {
      return errorResponse('Missing required fields', 400);
    }
    if (body.unitCost <= 0) {
      return errorResponse('Unit cost must be greater than 0', 400);
    }
    const inventoryCost = await prisma.inventoryCost.create({
      data: {
        itemName: body.itemName.trim(),
        category: body.category,
        unitCost: body.unitCost,
        unit: body.unit.trim(),
        notes: body.notes?.trim() || null,
      },
    });
    return NextResponse.json({ success: true, data: inventoryCost });
  } catch (err) {
    if (err instanceof Response) {
      return err;
    }
    console.error('Error creating inventory cost:', err);
    return errorResponse('Failed to create inventory cost', 500);
  }
}