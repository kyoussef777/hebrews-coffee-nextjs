import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { password, resetOrders, resetInventory } = await request.json();

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    if (!resetOrders && !resetInventory) {
      return NextResponse.json(
        { success: false, error: 'At least one reset option must be selected' },
        { status: 400 }
      );
    }

    // Verify admin password
    let isValidPassword = false;

    try {
      // First, try to authenticate against the database user
      const user = await prisma.user.findUnique({
        where: {
          username: session.user.username,
        },
      });

      if (user) {
        isValidPassword = await bcrypt.compare(password, user.password);
      }

      // If not found in database or password doesn't match, check environment variables
      if (!isValidPassword) {
        const envUsername = process.env.APP_USERNAME || 'admin';
        const envPassword = process.env.APP_PASSWORD || 'password123';

        if (session.user.username === envUsername && password === envPassword) {
          isValidPassword = true;
        }
      }
    } catch (error) {
      console.error('Password verification error:', error);
      
      // Fallback to environment variables if database fails
      const envUsername = process.env.APP_USERNAME || 'admin';
      const envPassword = process.env.APP_PASSWORD || 'password123';

      if (session.user.username === envUsername && password === envPassword) {
        isValidPassword = true;
      }
    }

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Perform database reset operations
    const results = {
      ordersDeleted: 0,
      inventoryDeleted: 0,
    };

    if (resetOrders) {
      const deletedOrders = await prisma.order.deleteMany({});
      results.ordersDeleted = deletedOrders.count;
    }

    if (resetInventory) {
      const deletedInventory = await prisma.inventoryCost.deleteMany({});
      results.inventoryDeleted = deletedInventory.count;
    }

    return NextResponse.json({
      success: true,
      message: 'Database reset completed successfully',
      data: results,
    });
  } catch (error) {
    console.error('Error during database reset:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset database' },
      { status: 500 }
    );
  }
}