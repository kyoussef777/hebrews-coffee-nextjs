import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { jsPDF } from 'jspdf';

// GET /api/orders/[id]/label - Generate PDF label for order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: orderId } = await params;

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Create PDF optimized for Brother QL-820 printer
    // Using 62mm x 29mm label size (DK-11209 equivalent)
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [62, 29], // 62mm x 29mm label size for Brother QL-820
    });

    // Layout optimized for 62mm x 29mm Brother QL-820 label
    
    // Header with Order ID
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('HeBrews Coffee', 31, 4, { align: 'center' });
    
    // Order Number
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const displayNumber = order.orderNumber || order.id.slice(-6).toUpperCase();
    doc.text(`#${displayNumber}`, 31, 8, { align: 'center' });
    
    // Customer name - larger and prominent
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(order.customerName, 31, 14, { align: 'center' });

    // Drink name
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(order.drink, 31, 18, { align: 'center' });

    // Details - condensed
    const details = [];
    if (order.milk !== 'Whole') details.push(order.milk);
    if (order.syrup) details.push(order.syrup);
    if (order.foam !== 'Regular Foam') details.push(order.foam);
    if (order.temperature !== 'Hot') details.push(order.temperature);
    if (order.extraShots > 0) details.push(`${order.extraShots} Extra Shot${order.extraShots > 1 ? 's' : ''}`);

    if (details.length > 0) {
      doc.setFontSize(6);
      const detailsText = details.join(', ');
      // Wrap text for the narrower label
      const lines = doc.splitTextToSize(detailsText, 58);
      let y = 22;
      for (const line of lines.slice(0, 2)) { // Limit to 2 lines
        doc.text(line, 31, y, { align: 'center' });
        y += 2.5;
      }
    }


    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="order-${orderId}-label.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating label:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate label' },
      { status: 500 }
    );
  }
}