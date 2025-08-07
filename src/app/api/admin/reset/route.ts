import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { parseJson, errorResponse, requireAdmin } from '@/lib/apiUtils';

export async function POST(request: NextRequest) {
  try {
    // Only admins can reset the database
    const session = await requireAdmin();
    const body = await parseJson(request);
    const { password, resetOrders, resetInventory } = body;

    if (!password) {
      return errorResponse('Password is required', 400);
    }
    if (!resetOrders && !resetInventory) {
      return errorResponse('At least one reset option must be selected', 400);
    }

    // Verify the admin's password against the stored hash
    const user = await prisma.user.findUnique({
      where: { username: session.user.username },
    });
    if (!user) {
      return errorResponse('User not found', 404);
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return errorResponse('Invalid password', 401);
    }

    // Perform database reset operations
    const results = { ordersDeleted: 0, inventoryDeleted: 0 };
    if (resetOrders) {
      const deletedOrders = await prisma.order.deleteMany({});
      results.ordersDeleted = deletedOrders.count;
    }
    if (resetInventory) {
      const deletedInventory = await prisma.inventoryCost.deleteMany({});
      results.inventoryDeleted = deletedInventory.count;
    }

    return NextResponse.json({ success: true, data: results, message: 'Database reset completed successfully' });
  } catch (err) {
    // If requireAdmin throws or parseJson throws, return their response directly
    if (err instanceof Response) {
      return err;
    }
    console.error('Error during database reset:', err);
    return errorResponse('Failed to reset database', 500);
  }
}