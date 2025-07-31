import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/customers - Get unique customer names for autocomplete
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customers = await prisma.order.findMany({
      select: {
        customerName: true,
      },
      distinct: ['customerName'],
      orderBy: {
        customerName: 'asc',
      },
    });

    const customerNames = customers.map(c => c.customerName);

    return NextResponse.json({
      success: true,
      data: customerNames,
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}