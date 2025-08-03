import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { jsPDF } from 'jspdf';
import { LabelSettings, Order } from '@/types';
import { getEffectiveLabelConfig } from '@/lib/labelConfig';
import { getVerseForLabel, formatVerseForLabel } from '@/lib/bibleVerse';

// POST /api/orders/preview/label - Generate preview label with custom settings
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { order, labelSettings }: { order: Order; labelSettings?: LabelSettings } = await request.json();

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Missing order data' },
        { status: 400 }
      );
    }

    // Use provided labelSettings or fallback to app default
    const effectiveLabelSettings = labelSettings || await getEffectiveLabelConfig();

    // Create PDF with custom dimensions
    const doc = new jsPDF({
      orientation: effectiveLabelSettings.width > effectiveLabelSettings.height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [effectiveLabelSettings.width, effectiveLabelSettings.height],
    });

    // Process each element
    for (const element of effectiveLabelSettings.elements) {
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
        'Content-Disposition': 'attachment; filename="label-preview.pdf"',
      },
    });
  } catch (error) {
    console.error('Error generating preview label:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate preview label' },
      { status: 500 }
    );
  }
}