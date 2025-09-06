'use client';

import { useState, useEffect } from 'react';
import { MenuConfig, MenuItemType } from '@/types';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

export default function MenuManager() {
  const [menuItems, setMenuItems] = useState<MenuConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    itemType: 'DRINK' as MenuItemType,
    itemName: '',
    price: '',
  });
  const [extraPricing, setExtraPricing] = useState({
    extraShotPrice: 1.00,
    coldFoamPrice: 1.00,
  });
  const [showExtraPricing, setShowExtraPricing] = useState(false);
  const [isUpdatingPricing, setIsUpdatingPricing] = useState(false);

  const itemTypes: { value: MenuItemType; label: string }[] = [
    { value: 'DRINK', label: 'Drinks' },
    { value: 'MILK', label: 'Milk Options' },
    { value: 'SYRUP', label: 'Syrups' },
    { value: 'FOAM', label: 'Foam Options' },
  ];

  useEffect(() => {
    loadMenuItems();
    loadExtraPricing();
  }, []);

  const loadMenuItems = async () => {
    try {
      const response = await fetch('/api/menu');
      const data = await response.json();
      if (data.success) {
        setMenuItems(data.data);
      }
    } catch (error) {
      console.error('Error loading menu items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadExtraPricing = async () => {
    try {
      const response = await fetch('/api/settings/extra-pricing');
      const data = await response.json();
      if (data.success) {
        setExtraPricing(data.data);
      }
    } catch (error) {
      console.error('Error loading extra pricing:', error);
    }
  };

  const handleExtraPricingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingPricing(true);
    
    try {
      const response = await fetch('/api/settings/extra-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(extraPricing),
      });

      if (response.ok) {
        setShowExtraPricing(false);
        alert('Extra pricing updated successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error updating extra pricing:', error);
      alert('Failed to update extra pricing');
    } finally {
      setIsUpdatingPricing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      itemType: formData.itemType,
      itemName: formData.itemName.trim(),
      price: formData.price ? parseFloat(formData.price) : null,
    };

    try {
      let response;
      if (editingItem) {
        response = await fetch(`/api/menu/${editingItem}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        loadMenuItems();
        setShowAddForm(false);
        setEditingItem(null);
        setFormData({ itemType: 'DRINK', itemName: '', price: '' });
      }
    } catch (error) {
      console.error('Error saving menu item:', error);
    }
  };

  const handleEdit = (item: MenuConfig) => {
    setEditingItem(item.id);
    setFormData({
      itemType: item.itemType,
      itemName: item.itemName,
      price: item.price?.toString() || '',
    });
    setShowAddForm(true);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
      const response = await fetch(`/api/menu/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadMenuItems();
      }
    } catch (error) {
      console.error('Error deleting menu item:', error);
    }
  };

  const cancelEdit = () => {
    setShowAddForm(false);
    setEditingItem(null);
    setFormData({ itemType: 'DRINK', itemName: '', price: '' });
  };

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.itemType]) {
      acc[item.itemType] = [];
    }
    acc[item.itemType].push(item);
    return acc;
  }, {} as Record<MenuItemType, MenuConfig[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-lg font-medium text-gray-900">Menu Items</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowExtraPricing(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            Extra Pricing
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="itemType" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="itemType"
                  value={formData.itemType}
                  onChange={(e) => setFormData({ ...formData, itemType: e.target.value as MenuItemType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                >
                  {itemTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name
                </label>
                <input
                  id="itemName"
                  type="text"
                  required
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Enter item name"
                />
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price (Optional)
                </label>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                <Save className="h-4 w-4 mr-2" />
                {editingItem ? 'Update' : 'Add'} Item
              </button>
              
              <button
                type="button"
                onClick={cancelEdit}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Extra Pricing Form */}
      {showExtraPricing && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Extra Pricing Configuration
          </h3>
          
          <form onSubmit={handleExtraPricingSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="extraShotPrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Extra Shot Price ($)
                </label>
                <input
                  id="extraShotPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  required
                  value={extraPricing.extraShotPrice}
                  onChange={(e) => setExtraPricing({ ...extraPricing, extraShotPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                  placeholder="1.00"
                />
                <p className="text-xs text-gray-500 mt-1">Price charged for each extra espresso shot</p>
              </div>

              <div>
                <label htmlFor="coldFoamPrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Cold Foam Price ($)
                </label>
                <input
                  id="coldFoamPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  required
                  value={extraPricing.coldFoamPrice}
                  onChange={(e) => setExtraPricing({ ...extraPricing, coldFoamPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                  placeholder="1.00"
                />
                <p className="text-xs text-gray-500 mt-1">Extra charge for cold foam option</p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isUpdatingPricing}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {isUpdatingPricing ? 'Updating...' : 'Update Pricing'}
              </button>
              
              <button
                type="button"
                onClick={() => setShowExtraPricing(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Menu Items by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {itemTypes.map((category) => {
          const items = groupedItems[category.value] || [];
          
          return (
            <div key={category.value} className="bg-white border border-gray-200 rounded-lg">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900">
                  {category.label} ({items.length})
                </h3>
              </div>
              
              <div className="p-4">
                {items.length === 0 ? (
                  <p className="text-gray-500 text-sm italic">No items in this category</p>
                ) : (
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md"
                      >
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">
                            {item.itemName}
                          </span>
                          {item.price && (
                            <span className="ml-2 text-sm text-gray-500">
                              ${item.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit Item"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}