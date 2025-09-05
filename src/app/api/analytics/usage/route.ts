import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/analytics/usage - Get detailed usage analytics for inventory tracking over time
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get inventory items with full quantity log history
    const inventoryItems = await prisma.simpleInventory.findMany({
      include: {
        quantityLogs: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    // Calculate detailed usage patterns for each item
    const usagePatterns = inventoryItems.map(item => {
      const logs = item.quantityLogs;
      
      // Group logs by date for daily usage tracking
      const dailyUsage: Record<string, number> = {};
      const dailyStock: Record<string, number> = {};
      
      logs.forEach(log => {
        const date = log.createdAt.toISOString().split('T')[0];
        
        if (!dailyUsage[date]) {
          dailyUsage[date] = 0;
          dailyStock[date] = log.previousQuantity;
        }
        
        // Track usage (negative changes only)
        if (log.changeAmount < 0) {
          dailyUsage[date] += Math.abs(log.changeAmount);
        }
        
        // Update end-of-day stock
        dailyStock[date] = log.newQuantity;
      });

      // Calculate usage trends
      const usageDates = Object.keys(dailyUsage).sort();
      const recentUsage = usageDates.slice(-7).map(date => ({
        date,
        usage: dailyUsage[date],
        stock: dailyStock[date],
      }));

      // Calculate average daily usage over last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentLogs = logs.filter(log => 
        log.createdAt >= thirtyDaysAgo && log.changeAmount < 0
      );
      
      const totalRecentUsage = recentLogs.reduce((sum, log) => sum + Math.abs(log.changeAmount), 0);
      const avgDailyUsage = totalRecentUsage / 30;

      return {
        itemId: item.id,
        itemName: item.itemName,
        category: item.category,
        currentStock: item.currentStock,
        initialQuantity: item.initialQuantity,
        reorderLevel: item.reorderLevel,
        avgDailyUsage,
        recentUsagePattern: recentUsage,
        totalChanges: logs.length,
        firstStocked: logs[0]?.createdAt || item.createdAt,
        lastChanged: logs[logs.length - 1]?.createdAt || item.createdAt,
      };
    });

    // Calculate overall usage statistics
    const totalCurrentStock = inventoryItems.reduce((sum, item) => sum + item.currentStock, 0);
    const totalInitialStock = inventoryItems.reduce((sum, item) => sum + item.initialQuantity, 0);
    const totalUsed = totalInitialStock - totalCurrentStock;

    // Low stock analysis
    const lowStockItems = inventoryItems.filter(item => 
      item.reorderLevel && item.currentStock <= item.reorderLevel
    );

    // Category breakdown
    interface CategoryBreakdown {
      count: number;
      totalStock: number;
      totalInitial: number;
      avgUsage: number;
    }
    
    const categoryBreakdown = inventoryItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = {
          count: 0,
          totalStock: 0,
          totalInitial: 0,
          avgUsage: 0,
        };
      }
      
      acc[item.category].count++;
      acc[item.category].totalStock += item.currentStock;
      acc[item.category].totalInitial += item.initialQuantity;
      
      const pattern = usagePatterns.find(p => p.itemId === item.id);
      if (pattern) {
        acc[item.category].avgUsage += pattern.avgDailyUsage;
      }
      
      return acc;
    }, {} as Record<string, CategoryBreakdown>);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalItems: inventoryItems.length,
          totalCurrentStock,
          totalInitialStock,
          totalUsed,
          lowStockCount: lowStockItems.length,
          turnoverRate: totalInitialStock > 0 ? (totalUsed / totalInitialStock) * 100 : 0,
        },
        categoryBreakdown,
        usagePatterns,
        lowStockItems: lowStockItems.map(item => ({
          id: item.id,
          itemName: item.itemName,
          category: item.category,
          currentStock: item.currentStock,
          reorderLevel: item.reorderLevel,
          daysUntilEmpty: (() => {
            const pattern = usagePatterns.find(p => p.itemId === item.id);
            return pattern && pattern.avgDailyUsage > 0 
              ? Math.floor(item.currentStock / pattern.avgDailyUsage)
              : -1;
          })(),
        })),
        timeSeriesData: {
          // Aggregate daily usage across all items
          dailyTotals: inventoryItems.reduce((acc, item) => {
            item.quantityLogs.forEach(log => {
              const date = log.createdAt.toISOString().split('T')[0];
              if (!acc[date]) {
                acc[date] = { date, totalUsage: 0, totalStock: 0 };
              }
              if (log.changeAmount < 0) {
                acc[date].totalUsage += Math.abs(log.changeAmount);
              }
              acc[date].totalStock += log.changeAmount;
            });
            return acc;
          }, {} as Record<string, { date: string; totalUsage: number; totalStock: number }>),
        },
      },
    });
  } catch (error) {
    console.error('Error calculating detailed usage analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate usage analytics' },
      { status: 500 }
    );
  }
}