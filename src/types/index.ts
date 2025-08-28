// Database types matching Prisma schema
export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type MenuItemType = 'DRINK' | 'MILK' | 'SYRUP' | 'FOAM' | 'TEMPERATURE';
export type InventoryCategory = 'COFFEE_BEANS' | 'MILK' | 'SYRUP' | 'EQUIPMENT' | 'SUPPLIES' | 'LABOR' | 'OTHER';

export interface Order {
  id: string;
  orderNumber: number;
  customerName: string;
  drink: string;
  milk: string;
  syrup?: string | null;
  foam?: string | null;
  temperature: string;
  extraShots: number;
  notes?: string | null;
  status: OrderStatus;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuConfig {
  id: string;
  itemType: MenuItemType;
  itemName: string;
  price?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Settings {
  id: string;
  settingKey: string;
  settingValue: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  username: string;
  password: string;
  /** Role determines the user's permissions.  STAFF users can manage orders but cannot access admin screens.
   *  ADMIN users have full access to analytics, inventory and reset endpoints.*/
  role: 'ADMIN' | 'STAFF';
  createdAt: Date;
  updatedAt: Date;
}

// Form types
export interface OrderFormData {
  customerName: string;
  drink: string;
  milk: string;
  syrup?: string;
  foam?: string;
  temperature: string;
  extraShots: number;
  notes?: string;
}

export interface MenuItemFormData {
  itemType: MenuItemType;
  itemName: string;
  price?: number;
}

export interface InventoryCost {
  id: string;
  itemName: string;
  category: InventoryCategory;
  unitCost: number;
  unit: string;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryCostFormData {
  itemName: string;
  category: InventoryCategory;
  unitCost: number;
  unit: string;
  notes?: string;
}

export interface RaffleParticipant {
  id: string;
  customerName: string;
  phoneNumber: string;
  hasWon: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface OrderCounts {
  pending: number;
  inProgress: number;
  completed: number;
  total: number;
}


export interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  avgWaitTime: number;
  totalExtraShots: number;
  drinkCounts: Record<string, number>;
  milkCounts: Record<string, number>;
  syrupCounts: Record<string, number>;
  temperatureCounts: Record<string, number>;
  topCustomers: Array<{ name: string; count: number }>;
  mostPopular: {
    drink: [string, number];
    milk: [string, number];
    syrup: [string, number];
  };
}

export interface ProfitAnalytics {
  summary: {
    totalRevenue: number;
    totalCosts: number;
    totalProfit: number;
    averageMargin: number;
    totalOrders: number;
  };
  periods: {
    monthly: {
      revenue: number;
      estimatedCosts: number;
      estimatedProfit: number;
      orders: number;
    };
    weekly: {
      revenue: number;
      estimatedCosts: number;
      estimatedProfit: number;
      orders: number;
    };
  };
  costBreakdown: {
    coffee: number;
    milk: number;
    syrups: number;
    supplies: number;
  };
  inventory: {
    totalInventoryCost: number;
    totalItems: number;
    byCategory: {
      coffee: number;
      milk: number;
      syrups: number;
      supplies: number;
      equipment: number;
      other: number;
    };
  };
  recentOrders: Array<{
    orderId: string;
    revenue: number;
    estimatedCost: number;
    profit: number;
    margin: number;
  }>;
}

export interface WaitTimeThresholds {
  yellow: number;
  red: number;
}

/**
 * LabelElement defines the specification for each text element that can be
 * positioned on a printed label.  In addition to the original fields
 * (header, orderNumber, customerName, drink, details, notes, verse),
 * this interface now includes support for additional dynamic fields
 * such as price and barcode.  Adding new types here ensures proper
 * type‑checking across the application when manipulating label elements.
 */
export interface LabelElement {
  /** Unique identifier for the element */
  id: string;
  /**
   * Element type.  In addition to the built‑in types used by existing label
   * configurations, additional types (e.g. price, barcode) can be added
   * to support extra information on the label.
   */
  type:
    | 'header'
    | 'orderNumber'
    | 'customerName'
    | 'drink'
    | 'details'
    | 'notes'
    | 'verse'
    | 'price'
    | 'barcode';
  /** X coordinate in millimetres */
  x: number;
  /** Y coordinate in millimetres */
  y: number;
  /** Font size in points */
  fontSize: number;
  /** Font weight */
  fontWeight: 'normal' | 'bold';
  /** Font style */
  fontStyle: 'normal' | 'italic';
  /** Horizontal text alignment */
  align: 'left' | 'center' | 'right';
  /** Maximum width (in mm) for text wrapping */
  maxWidth?: number;
  /** Maximum number of lines for wrapped text */
  maxLines?: number;
}

export interface LabelSettings {
  id: string;
  name: string;
  width: number;
  height: number;
  elements: LabelElement[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LabelSettingsFormData {
  name: string;
  width: number;
  height: number;
  elements: LabelElement[];
}

// Real-time event types
export interface OrderUpdateEvent {
  type: 'ORDER_CREATED' | 'ORDER_UPDATED' | 'ORDER_DELETED';
  order: Order;
  timestamp: Date;
}

export interface CountUpdateEvent {
  type: 'COUNT_UPDATE';
  counts: OrderCounts;
  timestamp: Date;
}

// NextAuth.js type extensions
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    username: string;
    name?: string;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    username?: string;
  }
}