'use client';

import { useState, useEffect } from 'react';
import { OrderFormData, MenuConfig, Order } from '@/types';
import { Plus, Printer, X } from 'lucide-react';

export default function OrderForm() {
  const [formData, setFormData] = useState<OrderFormData>({
    customerName: '',
    drink: '',
    milk: '',
    syrup: '',
    foam: '',
    temperature: 'Hot',
    extraShot: false,
    notes: '',
  });

  const [menuItems, setMenuItems] = useState<{
    drinks: MenuConfig[];
    milks: MenuConfig[];
    syrups: MenuConfig[];
    foams: MenuConfig[];
    temperatures: MenuConfig[];
  }>({
    drinks: [],
    milks: [],
    syrups: [],
    foams: [],
    temperatures: [],
  });

  const [customers, setCustomers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState<string[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  useEffect(() => {
    // Load menu items
    fetch('/api/menu')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const grouped = data.data.reduce((acc: Record<string, MenuConfig[]>, item: MenuConfig) => {
            const key = `${item.itemType.toLowerCase()}s`;
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
          }, {});
          setMenuItems(grouped);
          
          // Set defaults
          if (grouped.milks?.length > 0) {
            setFormData(prev => ({ ...prev, milk: grouped.milks[0].itemName }));
          }
          if (grouped.foams?.length > 0) {
            setFormData(prev => ({ ...prev, foam: grouped.foams[0].itemName }));
          }
        }
      });

    // Load customer list
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCustomers(data.data);
        }
      });
  }, []);

  useEffect(() => {
    // Filter customers based on input
    if (formData.customerName.length > 0) {
      const filtered = customers.filter(customer =>
        customer.toLowerCase().includes(formData.customerName.toLowerCase())
      );
      setFilteredCustomers(filtered.slice(0, 5));
      setShowCustomerDropdown(filtered.length > 0);
    } else {
      setShowCustomerDropdown(false);
    }
  }, [formData.customerName, customers]);

  const printLabel = async (orderId: string, orderNumber?: number) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/label`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Open PDF in new window/tab and attempt to auto-print
        const printWindow = window.open(url, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            // Small delay to ensure PDF is loaded, then trigger print
            setTimeout(() => {
              printWindow.print();
            }, 500);
          };
        } else {
          // Fallback: create downloadable link if popup blocked
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `order-${orderNumber || orderId}-label.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        
        // Clean up the URL after a delay
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 5000);
      }
    } catch (error) {
      console.error('Error printing label:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.drink) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        setCreatedOrder(result.data);
        setShowOrderConfirmation(true);
        
        // Trigger active orders refresh by dispatching a custom event
        window.dispatchEvent(new CustomEvent('orderCreated'));
        
        // Reset form
        setFormData({
          customerName: '',
          drink: '',
          milk: menuItems.milks[0]?.itemName || '',
          syrup: '',
          foam: menuItems.foams[0]?.itemName || '',
          temperature: 'Hot',
          extraShot: false,
          notes: '',
        });
      } else {
        console.error('Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeConfirmation = () => {
    setShowOrderConfirmation(false);
    setCreatedOrder(null);
  };

  const getCurrentPrice = () => {
    const drinkPrice = menuItems.drinks.find(d => d.itemName === formData.drink)?.price || 0;
    const extraShotPrice = formData.extraShot ? 1.0 : 0;
    return drinkPrice + extraShotPrice;
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Name with Autocomplete */}
      <div className="relative">
        <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
          Customer Name *
        </label>
        <input
          id="customerName"
          type="text"
          required
          value={formData.customerName}
          onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
          onFocus={() => setShowCustomerDropdown(filteredCustomers.length > 0)}
          onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500"
          placeholder="Enter customer name"
        />
        
        {/* Customer Autocomplete Dropdown */}
        {showCustomerDropdown && (
          <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
            {filteredCustomers.map((customer, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  setFormData({ ...formData, customerName: customer });
                  setShowCustomerDropdown(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100"
              >
                {customer}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Drink Selection */}
      <div>
        <label htmlFor="drink" className="block text-sm font-medium text-gray-700 mb-2">
          Drink *
        </label>
        <select
          id="drink"
          required
          value={formData.drink}
          onChange={(e) => setFormData({ ...formData, drink: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500"
        >
          <option value="">Select a drink</option>
          {menuItems.drinks.map((drink) => (
            <option key={drink.id} value={drink.itemName}>
              {drink.itemName} - ${drink.price?.toFixed(2)}
            </option>
          ))}
        </select>
      </div>

      {/* Milk Selection */}
      <div>
        <label htmlFor="milk" className="block text-sm font-medium text-gray-700 mb-2">
          Milk Type *
        </label>
        <select
          id="milk"
          required
          value={formData.milk}
          onChange={(e) => setFormData({ ...formData, milk: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500"
        >
          {menuItems.milks.map((milk) => (
            <option key={milk.id} value={milk.itemName}>
              {milk.itemName}
            </option>
          ))}
        </select>
      </div>

      {/* Two-column layout for smaller fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Syrup Selection */}
        <div>
          <label htmlFor="syrup" className="block text-sm font-medium text-gray-700 mb-2">
            Syrup (Optional)
          </label>
          <select
            id="syrup"
            value={formData.syrup}
            onChange={(e) => setFormData({ ...formData, syrup: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="">No syrup</option>
            {menuItems.syrups.map((syrup) => (
              <option key={syrup.id} value={syrup.itemName}>
                {syrup.itemName}
              </option>
            ))}
          </select>
        </div>

        {/* Foam Selection */}
        <div>
          <label htmlFor="foam" className="block text-sm font-medium text-gray-700 mb-2">
            Foam
          </label>
          <select
            id="foam"
            value={formData.foam}
            onChange={(e) => setFormData({ ...formData, foam: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500"
          >
            {menuItems.foams.map((foam) => (
              <option key={foam.id} value={foam.itemName}>
                {foam.itemName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Temperature Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Temperature *
        </label>
        <div className="grid grid-cols-3 gap-2">
          {menuItems.temperatures.map((temp) => (
            <label key={temp.id} className="flex items-center">
              <input
                type="radio"
                name="temperature"
                value={temp.itemName}
                checked={formData.temperature === temp.itemName}
                onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                className="mr-2 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-sm">{temp.itemName}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Extra Shot */}
      <div className="flex items-center">
        <input
          id="extraShot"
          type="checkbox"
          checked={formData.extraShot}
          onChange={(e) => setFormData({ ...formData, extraShot: e.target.checked })}
          className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
        />
        <label htmlFor="extraShot" className="ml-2 block text-sm text-gray-700">
          Extra Shot (+$1.00)
        </label>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
          Special Instructions (Optional)
        </label>
        <textarea
          id="notes"
          rows={3}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500"
          placeholder="Any special requests or modifications..."
        />
      </div>

      {/* Price Display */}
      {formData.drink && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
          <div className="text-lg font-semibold text-amber-800">
            Total: ${getCurrentPrice().toFixed(2)}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || !formData.customerName || !formData.drink}
        className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Creating Order...
          </div>
        ) : (
          <>
            <Plus className="h-4 w-4 mr-2" />
            Create Order
          </>
        )}
      </button>
    </form>

      {/* Order Confirmation Popup */}
      {showOrderConfirmation && createdOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Order Created Successfully!</h3>
                <button
                  onClick={closeConfirmation}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Order #{createdOrder.orderNumber || createdOrder.id.slice(-6).toUpperCase()}</div>
                  <div className="font-semibold text-gray-900">{createdOrder.customerName}</div>
                  <div className="text-sm text-gray-700">{createdOrder.drink}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {createdOrder.milk}, {createdOrder.syrup || 'No syrup'}, {createdOrder.foam}, {createdOrder.temperature}
                    {createdOrder.extraShot && <span className="ml-1 text-amber-600">+ Extra Shot</span>}
                  </div>
                  {createdOrder.notes && (
                    <div className="text-xs text-gray-500 mt-1">
                      <em>Note: {createdOrder.notes}</em>
                    </div>
                  )}
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="text-xl font-bold text-amber-800">
                    Total: ${createdOrder.price.toFixed(2)}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => printLabel(createdOrder.id, createdOrder.orderNumber)}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Label
                </button>
                <button
                  onClick={closeConfirmation}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}