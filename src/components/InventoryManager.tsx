'use client';

import { useState, useEffect } from 'react';
import { SimpleInventoryItem, InventoryItemFormData, InventoryCategory } from '@/types';
import { Plus, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';

export default function InventoryManager() {
  const [inventoryItems, setInventoryItems] = useState<SimpleInventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<SimpleInventoryItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const [formData, setFormData] = useState<InventoryItemFormData>({
    itemName: '',
    category: 'COFFEE_BEANS',
    initialQuantity: 0,
    currentStock: 0,
    unit: '',
    reorderLevel: 0,
    notes: '',
  });

  const categories: { value: InventoryCategory; label: string }[] = [
    { value: 'COFFEE_BEANS', label: 'Coffee Beans' },
    { value: 'MILK', label: 'Milk' },
    { value: 'SYRUP', label: 'Syrups' },
    { value: 'EQUIPMENT', label: 'Equipment' },
    { value: 'SUPPLIES', label: 'Supplies' },
    { value: 'LABOR', label: 'Labor' },
    { value: 'OTHER', label: 'Other' },
  ];

  useEffect(() => {
    loadInventoryItems();
  }, [selectedCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadInventoryItems = async () => {
    try {
      const url = selectedCategory 
        ? `/api/simple-inventory?category=${selectedCategory}`
        : '/api/simple-inventory';
      
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setInventoryItems(data.data);
      } else {
        console.error('Failed to load inventory items:', data.error);
      }
    } catch (error) {
      console.error('Error loading inventory items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingItem 
        ? `/api/simple-inventory/${editingItem.id}`
        : '/api/simple-inventory';
      
      const method = editingItem ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadInventoryItems();
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save inventory item');
      }
    } catch (error) {
      console.error('Error saving inventory item:', error);
      alert('Error saving inventory item');
    }
  };

  const handleEdit = (item: SimpleInventoryItem) => {
    setEditingItem(item);
    setFormData({
      itemName: item.itemName,
      category: item.category,
      initialQuantity: item.initialQuantity,
      currentStock: item.currentStock,
      unit: item.unit,
      reorderLevel: item.reorderLevel || 0,
      notes: item.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (item: SimpleInventoryItem) => {
    if (!confirm(`Are you sure you want to delete "${item.itemName}"?`)) return;

    try {
      const response = await fetch(`/api/simple-inventory/${item.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadInventoryItems();
      } else {
        alert('Failed to delete inventory item');
      }
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      alert('Error deleting inventory item');
    }
  };

  const resetForm = () => {
    setFormData({
      itemName: '',
      category: 'COFFEE_BEANS',
      initialQuantity: 0,
      currentStock: 0,
      unit: '',
      reorderLevel: 0,
      notes: '',
    });
    setEditingItem(null);
    setShowForm(false);
  };

  const getQuantityByCategory = () => {
    const quantityByCategory = inventoryItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = 0;
      acc[item.category] += item.currentStock;
      return acc;
    }, {} as Record<string, number>);
    
    return quantityByCategory;
  };

  const totalItems = inventoryItems.length;
  const totalQuantity = inventoryItems.reduce((sum, item) => sum + item.currentStock, 0);
  const lowStockItems = inventoryItems.filter(item => item.reorderLevel && item.currentStock <= item.reorderLevel).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="space-y-3 sm:space-y-0 sm:flex sm:justify-between sm:items-center">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            style={{ fontSize: '16px' }}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          
          {/* Total Quantity Display */}
          <div className="flex items-center justify-center sm:justify-start space-x-2 bg-amber-600 text-white px-4 py-2 rounded-lg">
            <Package className="h-4 w-4" />
            <span className="font-medium text-sm sm:text-base">
              Total Quantity: {totalQuantity}
            </span>
          </div>
          
          {/* Low Stock Alert */}
          {lowStockItems > 0 && (
            <div className="flex items-center justify-center sm:justify-start space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium text-sm sm:text-base">
                {lowStockItems} Low Stock
              </span>
            </div>
          )}
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium transition-colors w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Item</span>
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-100 p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
          </h3>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Name
              </label>
              <input
                type="text"
                required
                value={formData.itemName}
                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="e.g., Arabica Coffee Beans"
                style={{ fontSize: '16px' }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as InventoryCategory })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                style={{ fontSize: '16px' }}
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial Quantity
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.initialQuantity}
                onChange={(e) => setFormData({ ...formData, initialQuantity: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="0"
                style={{ fontSize: '16px' }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Stock
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="0"
                style={{ fontSize: '16px' }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit
              </label>
              <input
                type="text"
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="e.g., per lb, per oz, per shot"
                style={{ fontSize: '16px' }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reorder Level (Optional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.reorderLevel || 0}
                onChange={(e) => setFormData({ ...formData, reorderLevel: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="0"
                style={{ fontSize: '16px' }}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="Additional notes about this inventory item..."
                style={{ fontSize: '16px' }}
              />
            </div>
            
            <div className="md:col-span-2 flex space-x-3">
              <button
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {editingItem ? 'Update' : 'Add'} Inventory Item
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-muted-foreground hover:bg-muted text-background px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inventory List */}
      <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Initial Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {inventoryItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Package className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {selectedCategory 
                        ? `No inventory items found for ${categories.find(c => c.value === selectedCategory)?.label}`
                        : 'No inventory items added yet'}
                    </p>
                    <button
                      onClick={() => setShowForm(true)}
                      className="mt-2 text-amber-600 hover:text-amber-700 font-medium"
                    >
                      Add your first inventory item
                    </button>
                  </td>
                </tr>
              ) : (
                inventoryItems.map((item) => {
                  const needsReorder = item.reorderLevel && item.currentStock <= item.reorderLevel;
                  return (
                  <tr key={item.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{item.itemName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-white">
                        {categories.find(c => c.value === item.category)?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900 font-medium">{item.initialQuantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900 font-medium">{item.currentStock} {item.unit}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{item.unit}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {needsReorder ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1 text-gray-500 hover:text-amber-600 transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Summary */}
      {inventoryItems.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Summary by Category</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(getQuantityByCategory()).map(([category, total]) => (
              <div key={category} className="bg-gray-100 p-4 rounded-lg">
                <div className="text-sm text-gray-500">
                  {categories.find(c => c.value === category)?.label}
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {total} items
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600">Total Items</div>
              <div className="text-2xl font-bold text-blue-900">{totalItems}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600">Total Quantity</div>
              <div className="text-2xl font-bold text-green-900">{totalQuantity}</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm text-red-600">Low Stock Items</div>
              <div className="text-2xl font-bold text-red-900">{lowStockItems}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}