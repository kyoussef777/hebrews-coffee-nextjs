import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { LabelSettingsFormData, LabelElement } from '@/types';
import { Prisma } from '@prisma/client';

// GET /api/label-settings/[id] - Get specific label settings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const labelSettings = await prisma.labelSettings.findUnique({
      where: { id },
    });

    if (!labelSettings) {
      return NextResponse.json(
        { success: false, error: 'Label settings not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...labelSettings,
        elements: Array.isArray(labelSettings.elements) ? (labelSettings.elements as unknown) as LabelElement[] : [],
      },
    });
  } catch (error) {
    console.error('Error fetching label settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch label settings' },
      { status: 500 }
    );
  }
}

// PATCH /api/label-settings/[id] - Update label settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body: Partial<LabelSettingsFormData> = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.name) updateData.name = body.name.trim();
    if (body.width) updateData.width = body.width;
    if (body.height) updateData.height = body.height;
    if (body.elements) updateData.elements = (body.elements as unknown) as Prisma.InputJsonValue;

    const labelSettings = await prisma.labelSettings.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...labelSettings,
        elements: Array.isArray(labelSettings.elements) ? (labelSettings.elements as unknown) as LabelElement[] : [],
      },
    });
  } catch (error) {
    console.error('Error updating label settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update label settings' },
      { status: 500 }
    );
  }
}

// DELETE /api/label-settings/[id] - Delete label settings
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.labelSettings.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Label settings deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting label settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete label settings' },
      { status: 500 }
    );
  }
}