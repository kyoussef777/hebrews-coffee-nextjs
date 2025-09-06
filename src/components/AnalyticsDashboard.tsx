'use client';

import { useState, useEffect } from 'react';
import { AnalyticsData, WaitTimeThresholds, UsageAnalytics } from '@/types';
import { Settings, Download, TrendingUp, Coffee, DollarSign, Clock, Target, Package } from 'lucide-react';
import OrdersOverTimeChart from './OrdersOverTimeChart';

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [usageAnalytics, setUsageAnalytics] = useState<UsageAnalytics | null>(null);
  const [thresholds, setThresholds] = useState<WaitTimeThresholds>({ yellow: 5, red: 10 });
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ yellow: 5, red: 10 });

  useEffect(() => {
    loadAnalytics();
    loadUsageAnalytics();
    loadThresholds();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics');
      const data = await response.json();
      console.log('Analytics data received:', data);
      if (data.success) {
        setAnalytics(data.data);
      } else {
        console.error('Analytics API failed:', data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsageAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics/profit');
      const data = await response.json();
      if (data.success) {
        setUsageAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error loading usage analytics:', error);
    }
  };

  const loadThresholds = async () => {
    try {
      const response = await fetch('/api/settings/wait-time-thresholds');
      const data = await response.json();
      if (data.success) {
        setThresholds(data.data);
        setSettingsForm(data.data);
      }
    } catch (error) {
      console.error('Error loading thresholds:', error);
    }
  };

  const updateThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/settings/wait-time-thresholds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yellow_threshold: settingsForm.yellow,
          red_threshold: settingsForm.red,
        }),
      });

      if (response.ok) {
        setThresholds(settingsForm);
        setShowSettings(false);
        // Show success message (you could add a toast here)
        alert('Wait time settings updated successfully!');
      } else {
        alert('Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating thresholds:', error);
      alert('Error updating settings');
    }
  };

  const exportData = async () => {
    try {
      const response = await fetch('/api/export/csv');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'orders-export.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Coffee className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-3">
          <button
            onClick={() => setShowSettings(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            <Settings className="h-4 w-4 mr-2" />
            Wait Time Settings
          </button>
          
          <button
            onClick={exportData}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Coffee className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{analytics.totalOrders}</div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">${analytics.totalRevenue.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Total Revenue</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-amber-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">${analytics.avgOrderValue.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Avg Order Value</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{analytics.avgWaitTime.toFixed(1)}m</div>
              <div className="text-sm text-gray-600">Avg Wait Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Analytics */}
      {usageAnalytics && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Inventory Usage & Stock Analysis</h2>
          
          {/* Usage Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-blue-900">{usageAnalytics.summary.totalItems}</div>
                  <div className="text-sm text-blue-700">Total Items</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-sm border border-green-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Target className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-green-900">{usageAnalytics.summary.totalCurrentStock}</div>
                  <div className="text-sm text-green-700">Current Stock</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg shadow-sm border border-amber-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-amber-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-amber-900">{usageAnalytics.summary.totalUsed}</div>
                  <div className="text-sm text-amber-700">Total Used</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg shadow-sm border border-red-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-red-900">{usageAnalytics.summary.lowStockItems}</div>
                  <div className="text-sm text-red-700">Low Stock Items</div>
                </div>
              </div>
            </div>
          </div>

          {/* Period Usage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Usage</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Orders:</span>
                  <span className="text-lg font-bold text-gray-900">{usageAnalytics.periods.weekly.orders}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Revenue:</span>
                  <span className="text-lg font-bold text-green-600">${usageAnalytics.periods.weekly.revenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Quantity Used:</span>
                  <span className="text-lg font-bold text-blue-600">{usageAnalytics.periods.weekly.totalQuantityUsed}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Usage</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Orders:</span>
                  <span className="text-lg font-bold text-gray-900">{usageAnalytics.periods.monthly.orders}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Revenue:</span>
                  <span className="text-lg font-bold text-green-600">${usageAnalytics.periods.monthly.revenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Quantity Used:</span>
                  <span className="text-lg font-bold text-blue-600">{usageAnalytics.periods.monthly.totalQuantityUsed}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Breakdown */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Stock by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{usageAnalytics.quantityBreakdown?.coffee || 0}</div>
                <div className="text-sm text-gray-600">Coffee</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{usageAnalytics.quantityBreakdown?.milk || 0}</div>
                <div className="text-sm text-gray-600">Milk</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{usageAnalytics.quantityBreakdown?.syrups || 0}</div>
                <div className="text-sm text-gray-600">Syrups</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{usageAnalytics.quantityBreakdown?.supplies || 0}</div>
                <div className="text-sm text-gray-600">Supplies</div>
              </div>
            </div>
          </div>

          {/* Low Stock Alerts */}
          {usageAnalytics.lowStockItems && usageAnalytics.lowStockItems.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-4">⚠️ Low Stock Alerts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {usageAnalytics.lowStockItems.slice(0, 6).map((item) => (
                  <div key={item.itemId} className="bg-white border border-red-300 rounded-md p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">{item.itemName}</div>
                        <div className="text-sm text-gray-600">{item.category}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-600">{item.currentStock}</div>
                        <div className="text-xs text-gray-500">
                          {item.daysOfStockLeft >= 0 ? `${item.daysOfStockLeft} days left` : 'No usage data'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Orders Over Time Chart */}
      <div className="mb-6">
        <OrdersOverTimeChart />
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Popular Items */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">🏆 Most Popular Items</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Drink:</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-900">{analytics.mostPopular.drink?.[0] || 'None'}</span>
                <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {analytics.mostPopular.drink?.[1] || 0}
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Milk:</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-900">{analytics.mostPopular.milk?.[0] || 'None'}</span>
                <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                  {analytics.mostPopular.milk?.[1] || 0}
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Syrup:</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-900">
                  {analytics.mostPopular.syrup?.[0] || 'None'}
                </span>
                <span className="inline-flex px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                  {analytics.mostPopular.syrup?.[1] || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">👥 Top Customers</h3>
          <div className="space-y-3">
            {analytics.topCustomers.slice(0, 5).map((customer, index) => (
              <div key={customer.name} className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                  <span className="text-sm text-gray-900 truncate">{customer.name}</span>
                </div>
                <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  {customer.count} orders
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Drink Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">🥤 Drink Breakdown</h3>
          <div className="space-y-2">
            {Object.entries(analytics.drinkCounts)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([drink, count]) => (
                <div key={drink} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{drink}</span>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Milk Preferences */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">🥛 Milk Preferences</h3>
          <div className="space-y-2">
            {Object.entries(analytics.milkCounts)
              .sort(([,a], [,b]) => b - a)
              .map(([milk, count]) => (
                <div key={milk} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{milk}</span>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
          </div>
        </div>

      </div>

      {/* Wait Time Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Wait Time Alert Settings</h3>
              
              <form onSubmit={updateThresholds} className="space-y-4">
                <div>
                  <label htmlFor="yellowThreshold" className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded mr-2">
                      Yellow Alert
                    </span>
                    Threshold (minutes)
                  </label>
                  <input
                    id="yellowThreshold"
                    type="number"
                    min="1"
                    max="30"
                    value={settingsForm.yellow || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, yellow: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Orders will show in yellow when wait time exceeds this many minutes</p>
                </div>
                
                <div>
                  <label htmlFor="redThreshold" className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded mr-2">
                      Red Alert
                    </span>
                    Threshold (minutes)
                  </label>
                  <input
                    id="redThreshold"
                    type="number"
                    min="1"
                    max="60"
                    value={settingsForm.red || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, red: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Orders will show in red when wait time exceeds this many minutes</p>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="text-sm text-blue-800">
                    <strong>Current Settings:</strong><br />
                    🟡 Yellow at {thresholds.yellow} minutes<br />
                    🔴 Red at {thresholds.red} minutes
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}