import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { LabelSettingsFormData, LabelElement } from '@/types';
import { Prisma } from '@prisma/client';

// GET /api/label-settings - Get all label settings
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const labelSettings = await prisma.labelSettings.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: labelSettings.map(setting => ({
        ...setting,
        elements: Array.isArray(setting.elements) ? (setting.elements as unknown) as LabelElement[] : [],
      })),
    });
  } catch (error) {
    console.error('Error fetching label settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch label settings' },
      { status: 500 }
    );
  }
}

// POST /api/label-settings - Create new label settings
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: LabelSettingsFormData = await request.json();

    // Validate required fields
    if (!body.name || body.width <= 0 || body.height <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid label settings data' },
        { status: 400 }
      );
    }

    const labelSettings = await prisma.labelSettings.create({
      data: {
        name: body.name.trim(),
        width: body.width,
        height: body.height,
        elements: (body.elements as unknown) as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...labelSettings,
        elements: Array.isArray(labelSettings.elements) ? (labelSettings.elements as unknown) as LabelElement[] : [],
      },
    });
  } catch (error) {
    console.error('Error creating label settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create label settings' },
      { status: 500 }
    );
  }
}