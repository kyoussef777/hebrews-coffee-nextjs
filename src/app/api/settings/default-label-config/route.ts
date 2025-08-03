import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/settings/default-label-config - Get default label configuration
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const setting = await prisma.settings.findUnique({
      where: { settingKey: 'default_label_config_id' },
    });

    if (!setting) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    // Get the actual label configuration
    const labelConfig = await prisma.labelSettings.findUnique({
      where: { id: setting.settingValue },
    });

    return NextResponse.json({
      success: true,
      data: labelConfig,
    });
  } catch (error) {
    console.error('Error fetching default label configuration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch default label configuration' },
      { status: 500 }
    );
  }
}

// POST /api/settings/default-label-config - Set default label configuration
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { labelConfigId } = await request.json();

    if (!labelConfigId) {
      return NextResponse.json(
        { success: false, error: 'Label configuration ID is required' },
        { status: 400 }
      );
    }

    // Verify the label configuration exists
    const labelConfig = await prisma.labelSettings.findUnique({
      where: { id: labelConfigId },
    });

    if (!labelConfig) {
      return NextResponse.json(
        { success: false, error: 'Label configuration not found' },
        { status: 404 }
      );
    }

    // Update or create the setting
    await prisma.settings.upsert({
      where: { settingKey: 'default_label_config_id' },
      update: { settingValue: labelConfigId },
      create: {
        settingKey: 'default_label_config_id',
        settingValue: labelConfigId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Default label configuration updated successfully',
      data: labelConfig,
    });
  } catch (error) {
    console.error('Error updating default label configuration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update default label configuration' },
      { status: 500 }
    );
  }
}

// DELETE /api/settings/default-label-config - Clear default label configuration
export async function DELETE() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.settings.deleteMany({
      where: { settingKey: 'default_label_config_id' },
    });

    return NextResponse.json({
      success: true,
      message: 'Default label configuration cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing default label configuration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear default label configuration' },
      { status: 500 }
    );
  }
}