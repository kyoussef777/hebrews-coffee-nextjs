import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/settings/extra-pricing - Get extra pricing settings
export async function GET() {
  try {
    // Allow unauthenticated access for reading pricing (needed for order form)
    // Authentication is still required for updates (POST)

    const extraShotSetting = await prisma.settings.findUnique({
      where: { settingKey: 'extra_shot_price' },
    });

    const coldFoamSetting = await prisma.settings.findUnique({
      where: { settingKey: 'cold_foam_price' },
    });

    const pricing = {
      extraShotPrice: extraShotSetting ? parseFloat(extraShotSetting.settingValue) : 1.00,
      coldFoamPrice: coldFoamSetting ? parseFloat(coldFoamSetting.settingValue) : 1.00,
    };

    return NextResponse.json({
      success: true,
      data: pricing,
    });
  } catch (error) {
    console.error('Error fetching extra pricing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch extra pricing' },
      { status: 500 }
    );
  }
}

// POST /api/settings/extra-pricing - Update extra pricing settings
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { extraShotPrice, coldFoamPrice } = await request.json();

    // Validate inputs
    if (typeof extraShotPrice !== 'number' || typeof coldFoamPrice !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Prices must be numbers' },
        { status: 400 }
      );
    }

    if (extraShotPrice < 0 || coldFoamPrice < 0) {
      return NextResponse.json(
        { success: false, error: 'Prices cannot be negative' },
        { status: 400 }
      );
    }

    if (extraShotPrice > 10 || coldFoamPrice > 10) {
      return NextResponse.json(
        { success: false, error: 'Prices cannot exceed $10.00' },
        { status: 400 }
      );
    }

    // Update extra shot price
    await prisma.settings.upsert({
      where: { settingKey: 'extra_shot_price' },
      update: { settingValue: extraShotPrice.toFixed(2) },
      create: {
        settingKey: 'extra_shot_price',
        settingValue: extraShotPrice.toFixed(2),
      },
    });

    // Update cold foam price
    await prisma.settings.upsert({
      where: { settingKey: 'cold_foam_price' },
      update: { settingValue: coldFoamPrice.toFixed(2) },
      create: {
        settingKey: 'cold_foam_price',
        settingValue: coldFoamPrice.toFixed(2),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Extra pricing updated successfully',
    });
  } catch (error) {
    console.error('Error updating extra pricing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update extra pricing' },
      { status: 500 }
    );
  }
}