import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { jsPDF } from 'jspdf';
import { getEffectiveLabelConfig } from '@/lib/labelConfig';
import { getVerseForLabel, formatVerseForLabel } from '@/lib/bibleVerse';

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
    const { searchParams } = new URL(request.url);
    const configId = searchParams.get('config');

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

    // Get the effective label configuration (custom config > app default > hardcoded default)
    const labelSettings = await getEffectiveLabelConfig(configId);

    // Create PDF with custom dimensions
    const doc = new jsPDF({
      orientation: labelSettings.width > labelSettings.height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [labelSettings.width, labelSettings.height],
    });

    // Process each element
    for (const element of labelSettings.elements) {
      // Set font properties - combine weight and style
      const fontStyle = element.fontWeight === 'bold' && element.fontStyle === 'italic' ? 'bolditalic' :
                       element.fontWeight === 'bold' ? 'bold' :
                       element.fontStyle === 'italic' ? 'italic' : 'normal';
      doc.setFont('helvetica', fontStyle);
      doc.setFontSize(element.fontSize);

      // Get text content based on element type
      let text = '';
      switch (element.type) {
        case 'header':
          text = 'HeBrews Coffee';
          break;
        case 'orderNumber':
          const displayNumber = order.orderNumber || order.id.slice(-6).toUpperCase();
          text = `#${displayNumber}`;
          break;
        case 'customerName':
          text = order.customerName;
          break;
        case 'drink':
          text = order.drink;
          break;
        case 'details':
          const details = [];
          if (order.milk !== 'Whole') details.push(order.milk);
          if (order.syrup) details.push(order.syrup);
          if (order.foam !== 'Regular Foam') details.push(order.foam);
          if (order.temperature !== 'Hot') details.push(order.temperature);
          if (order.extraShots > 0) details.push(`${order.extraShots} Extra Shot${order.extraShots > 1 ? 's' : ''}`);
          text = details.join(', ');
          break;
        case 'notes':
          text = order.notes ? `Note: ${order.notes}` : '';
          break;
        case 'verse':
          try {
            const verse = await getVerseForLabel(150);
            if (verse) {
              text = formatVerseForLabel(verse);
            }
          } catch (error) {
            console.error('Error fetching verse:', error);
            text = 'The Lord bless you and keep you. - Numbers 6:24';
          }
          break;
        case 'price':
          // Format price with two decimal places
          text = order.price !== undefined ? `$${order.price.toFixed(2)}` : '';
          break;
        case 'barcode':
          // Use order id as a simple barcode representation
          text = order.id;
          break;
      }

      // Skip empty text
      if (!text) continue;

      // Handle text wrapping if maxWidth is specified
      if (element.maxWidth && element.maxLines) {
        const lines = doc.splitTextToSize(text, element.maxWidth);
        const limitedLines = lines.slice(0, element.maxLines);
        
        let y = element.y;
        for (const line of limitedLines) {
          doc.text(line, element.x, y, { align: element.align });
          y += element.fontSize * 0.35; // Approximate line height
        }
      } else {
        // Single line text
        doc.text(text, element.x, element.y, { align: element.align });
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