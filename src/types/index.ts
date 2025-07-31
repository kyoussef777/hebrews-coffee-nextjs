// Database types matching Prisma schema
export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type MenuItemType = 'DRINK' | 'MILK' | 'SYRUP' | 'FOAM' | 'TEMPERATURE';

export interface Order {
  id: string;
  orderNumber: number;
  customerName: string;
  drink: string;
  milk: string;
  syrup?: string | null;
  foam?: string | null;
  temperature: string;
  extraShot: boolean;
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
  extraShot: boolean;
  notes?: string;
}

export interface MenuItemFormData {
  itemType: MenuItemType;
  itemName: string;
  price?: number;
}

// API response types
export interface ApiResponse<T = any> {
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

export interface CustomerHistoryItem {
  customerName: string;
  orderCount: number;
  lastOrder: Date;
  favoriteItems: {
    drink?: string;
    milk?: string;
    syrup?: string;
  };
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

export interface WaitTimeThresholds {
  yellow: number;
  red: number;
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

declare module 'next-auth/jwt' {
  interface JWT {
    username?: string;
  }
}