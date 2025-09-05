import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

interface InventoryUsageAnalysis {
  itemId: string;
  itemName: string;
  category: string;
  initialQuantity: number;
  currentStock: number;
  totalUsed: number;
  usageRate: number; // usage per day
  daysOfStockLeft: number;
  needsReorder: boolean;
}

// GET /api/analytics/profit - Get inventory usage analysis (formerly profit)
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all orders for usage pattern analysis
    const orders = await prisma.order.findMany({
      where: { status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
    });

    // Get all simple inventory items with their quantity logs
    const inventoryItems = await prisma.simpleInventory.findMany({
      include: {
        quantityLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Calculate usage analytics for each inventory item
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const usageAnalysis: InventoryUsageAnalysis[] = inventoryItems.map(item => {
      const totalUsed = item.initialQuantity - item.currentStock;
      
      // Calculate usage rate based on recent quantity logs
      const recentLogs = item.quantityLogs.filter(log => 
        log.createdAt >= thirtyDaysAgo && log.changeReason !== 'initial_stock'
      );
      
      // Calculate average daily usage
      const totalUsageInPeriod = recentLogs
        .filter(log => log.changeAmount < 0) // Only negative changes (usage)
        .reduce((sum, log) => sum + Math.abs(log.changeAmount), 0);
      
      const daysWithData = Math.max(1, Math.floor((now.getTime() - thirtyDaysAgo.getTime()) / (1000 * 60 * 60 * 24)));
      const usageRate = totalUsageInPeriod / daysWithData;
      
      // Calculate days of stock left
      const daysOfStockLeft = usageRate > 0 ? Math.floor(item.currentStock / usageRate) : Infinity;
      
      // Check if reorder is needed
      const needsReorder = item.reorderLevel ? item.currentStock <= item.reorderLevel : false;

      return {
        itemId: item.id,
        itemName: item.itemName,
        category: item.category,
        initialQuantity: item.initialQuantity,
        currentStock: item.currentStock,
        totalUsed,
        usageRate,
        daysOfStockLeft: daysOfStockLeft === Infinity ? -1 : daysOfStockLeft, // -1 means no usage detected
        needsReorder,
      };
    });

    // Calculate time-based metrics
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentOrders = orders.filter(order => order.createdAt >= thirtyDaysAgo);
    const weeklyOrders = orders.filter(order => order.createdAt >= sevenDaysAgo);

    // Group inventory by category for summary
    const inventoryByCategory = {
      coffee: usageAnalysis.filter(item => item.category === 'COFFEE_BEANS'),
      milk: usageAnalysis.filter(item => item.category === 'MILK'),
      syrups: usageAnalysis.filter(item => item.category === 'SYRUP'),
      supplies: usageAnalysis.filter(item => item.category === 'SUPPLIES'),
      equipment: usageAnalysis.filter(item => item.category === 'EQUIPMENT'),
      other: usageAnalysis.filter(item => item.category === 'OTHER'),
    };

    // Calculate quantity summary
    const totalCurrentStock = usageAnalysis.reduce((sum, item) => sum + item.currentStock, 0);
    const totalInitialStock = usageAnalysis.reduce((sum, item) => sum + item.initialQuantity, 0);
    const totalUsed = usageAnalysis.reduce((sum, item) => sum + item.totalUsed, 0);
    const lowStockItems = usageAnalysis.filter(item => item.needsReorder).length;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalItems: inventoryItems.length,
          totalCurrentStock,
          totalInitialStock,
          totalUsed,
          lowStockItems,
          averageUsageRate: usageAnalysis.length > 0 
            ? usageAnalysis.reduce((sum, item) => sum + item.usageRate, 0) / usageAnalysis.length 
            : 0,
        },
        periods: {
          monthly: {
            orders: recentOrders.length,
            revenue: recentOrders.reduce((sum, order) => sum + order.price, 0),
            totalQuantityUsed: inventoryItems.reduce((sum, item) => {
              const monthlyUsage = item.quantityLogs
                .filter(log => log.createdAt >= thirtyDaysAgo && log.changeAmount < 0)
                .reduce((usage, log) => usage + Math.abs(log.changeAmount), 0);
              return sum + monthlyUsage;
            }, 0),
          },
          weekly: {
            orders: weeklyOrders.length,
            revenue: weeklyOrders.reduce((sum, order) => sum + order.price, 0),
            totalQuantityUsed: inventoryItems.reduce((sum, item) => {
              const weeklyUsage = item.quantityLogs
                .filter(log => log.createdAt >= sevenDaysAgo && log.changeAmount < 0)
                .reduce((usage, log) => usage + Math.abs(log.changeAmount), 0);
              return sum + weeklyUsage;
            }, 0),
          },
        },
        quantityBreakdown: {
          coffee: inventoryByCategory.coffee.reduce((sum, item) => sum + item.currentStock, 0),
          milk: inventoryByCategory.milk.reduce((sum, item) => sum + item.currentStock, 0),
          syrups: inventoryByCategory.syrups.reduce((sum, item) => sum + item.currentStock, 0),
          supplies: inventoryByCategory.supplies.reduce((sum, item) => sum + item.currentStock, 0),
        },
        inventory: {
          totalItems: inventoryItems.length,
          byCategory: {
            coffee: inventoryByCategory.coffee.length,
            milk: inventoryByCategory.milk.length,
            syrups: inventoryByCategory.syrups.length,
            supplies: inventoryByCategory.supplies.length,
            equipment: inventoryByCategory.equipment.length,
            other: inventoryByCategory.other.length,
          },
        },
        usageAnalysis: usageAnalysis.slice(0, 10), // Top 10 items for detailed view
        lowStockItems: usageAnalysis.filter(item => item.needsReorder),
      },
    });
  } catch (error) {
    console.error('Error calculating inventory usage analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate inventory usage analytics' },
      { status: 500 }
    );
  }
}