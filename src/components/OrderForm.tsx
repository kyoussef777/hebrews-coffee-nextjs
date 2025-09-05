'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { OrderFormData, MenuConfig, Order, LabelSettings } from '@/types';
import { Plus, Printer, X, Minus } from 'lucide-react';
import { printOrderLabel } from '@/lib/printUtils';

export default function OrderForm() {
  const [formData, setFormData] = useState<OrderFormData>({
    customerName: '',
    drink: '',
    milk: '',
    syrups: [],
    foam: '',
    temperature: 'Hot',
    extraShots: 0,
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [labelConfigs, setLabelConfigs] = useState<LabelSettings[]>([]);
  const [selectedLabelConfig, setSelectedLabelConfig] = useState<string>('default');
  const [defaultConfig, setDefaultConfig] = useState<LabelSettings | null>(null);
  const [showGiveawayOptIn, setShowGiveawayOptIn] = useState(false);
  const [giveawayPhoneNumber, setGiveawayPhoneNumber] = useState('');
  const [isSubmittingGiveaway, setIsSubmittingGiveaway] = useState(false);
  const [extraPricing, setExtraPricing] = useState({
    extraShotPrice: 1.00,
    coldFoamPrice: 1.00,
  });

  const loadLabelConfigs = useCallback(async () => {
    try {
      const response = await fetch('/api/label-settings');
      const data = await response.json();
      if (data.success) {
        setLabelConfigs(data.data);
      }
    } catch (error) {
      console.error('Error loading label configurations:', error);
    }
  }, []);

  const loadDefaultConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/settings/default-label-config');
      const data = await response.json();
      if (data.success && data.data) {
        setDefaultConfig(data.data);
        // Only auto-select app-default if no config is currently selected 
        // or if we're currently on 'default'
        if (selectedLabelConfig === 'default') {
          setSelectedLabelConfig('app-default');
        }
      }
    } catch (error) {
      console.error('Error loading default configuration:', error);
    }
  }, [selectedLabelConfig]);

  const loadExtraPricing = useCallback(async () => {
    try {
      console.log('🔄 Loading extra pricing...');
      const response = await fetch('/api/settings/extra-pricing');
      const data = await response.json();
      console.log('📊 Extra pricing response:', data);
      if (data.success) {
        setExtraPricing(data.data);
        console.log('✅ Extra pricing loaded:', data.data);
      } else {
        console.log('❌ Extra pricing failed:', data);
      }
    } catch (error) {
      console.error('Error loading extra pricing:', error);
    }
  }, []);

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

    // Load label configurations
    loadLabelConfigs();
    loadDefaultConfig();
    loadExtraPricing();
  }, [loadLabelConfigs, loadDefaultConfig, loadExtraPricing]);


  const printLabel = async (orderId: string, orderNumber?: number) => {
    await printOrderLabel(orderId, orderNumber, selectedLabelConfig);
  };

  // Keyboard shortcuts handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Only handle shortcuts when not typing in input/textarea
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    // Ctrl/Cmd + Enter to submit order
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (formData.customerName && formData.drink && !isSubmitting) {
        document.getElementById('submit-order-btn')?.click();
      }
    }
  }, [formData.customerName, formData.drink, isSubmitting]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

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
          syrups: [],
          foam: menuItems.foams[0]?.itemName || '',
          temperature: 'Hot',
          extraShots: 0,
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

  const handleGiveawayOptIn = () => {
    setShowGiveawayOptIn(true);
  };

  const handleGiveawaySubmit = async () => {
    if (!giveawayPhoneNumber.trim() || !createdOrder) return;
    
    setIsSubmittingGiveaway(true);
    try {
      const response = await fetch('/api/raffle/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: createdOrder.customerName,
          phoneNumber: giveawayPhoneNumber.trim()
        }),
      });

      if (response.ok) {
        setShowGiveawayOptIn(false);
        setGiveawayPhoneNumber('');
        // Could show success message here
      } else {
        const error = await response.json();
        console.error('Failed to join giveaway:', error.message);
        // Could show error message here
      }
    } catch (error) {
      console.error('Error joining giveaway:', error);
    } finally {
      setIsSubmittingGiveaway(false);
    }
  };

  const closeGiveawayModal = () => {
    setShowGiveawayOptIn(false);
    setGiveawayPhoneNumber('');
  };

  const addSyrup = (syrupName: string) => {
    const existingSyrup = formData.syrups.find(s => s.syrupName === syrupName);
    if (existingSyrup) {
      // Increase pumps for existing syrup
      setFormData({
        ...formData,
        syrups: formData.syrups.map(s => 
          s.syrupName === syrupName 
            ? { ...s, pumps: Math.min(s.pumps + 1, 10) } // Max 10 pumps
            : s
        )
      });
    } else {
      // Add new syrup with 1 pump
      setFormData({
        ...formData,
        syrups: [...formData.syrups, { syrupName, pumps: 1 }]
      });
    }
  };

  const removeSyrup = (syrupName: string) => {
    const existingSyrup = formData.syrups.find(s => s.syrupName === syrupName);
    if (existingSyrup && existingSyrup.pumps > 1) {
      // Decrease pumps
      setFormData({
        ...formData,
        syrups: formData.syrups.map(s => 
          s.syrupName === syrupName 
            ? { ...s, pumps: s.pumps - 1 }
            : s
        )
      });
    } else {
      // Remove syrup entirely
      setFormData({
        ...formData,
        syrups: formData.syrups.filter(s => s.syrupName !== syrupName)
      });
    }
  };

  const getSyrupPumps = (syrupName: string): number => {
    const syrup = formData.syrups.find(s => s.syrupName === syrupName);
    return syrup ? syrup.pumps : 0;
  };

  const currentPrice = useMemo(() => {
    const drinkPrice = menuItems.drinks.find(d => d.itemName === formData.drink)?.price || 0;
    const extraShotsPrice = formData.extraShots * extraPricing.extraShotPrice;
    
    // Check if premium foam is selected and charge extra
    // Option 1: Look for "cold foam" in the name
    const isColdFoamByName = formData.foam && formData.foam.toLowerCase().includes('cold foam');
    
    // Option 2: Treat specific foam types as premium (modify this list as needed)
    const premiumFoamTypes = ['Regular Foam', 'Cold Foam', 'Extra Foam']; // Add foam types that should cost extra
    const isPremiumFoam = formData.foam && premiumFoamTypes.includes(formData.foam);
    
    // Use either detection method (change this line to switch between approaches)
    const isColdFoam = isColdFoamByName || isPremiumFoam; // Currently using BOTH methods
    const coldFoamPrice = isColdFoam ? extraPricing.coldFoamPrice : 0;
    
    console.log('🔍 Price Debug:', {
      foam: formData.foam,
      isColdFoam,
      extraPricing,
      coldFoamPrice,
      drinkPrice,
      extraShotsPrice,
      total: drinkPrice + extraShotsPrice + coldFoamPrice
    });

    return drinkPrice + extraShotsPrice + coldFoamPrice;
  }, [formData.drink, formData.extraShots, formData.foam, menuItems.drinks, extraPricing]);

  return (
    <>
      <form onSubmit={handleSubmit} className="min-h-screen md:h-screen md:overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 h-full p-2 md:p-4 pb-20 md:pb-4">
        
        {/* Left Column - Customer & Drink */}
        <div className="space-y-3">
          {/* Customer Name */}
          <div className="relative">
            <label htmlFor="customerName" className="block text-sm font-semibold text-gray-900 mb-2">
              Customer Name
            </label>
            <div className="relative">
              <input
                id="customerName"
                type="text"
                required
                tabIndex={1}
                maxLength={25}
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-amber-500 focus:border-amber-500 text-sm"
                placeholder="Enter customer name (Focus: Tab, Submit: Ctrl+Enter)"
                autoComplete="off"
              />
              <div className="absolute bottom-1 right-2 text-xs text-gray-400">
                {formData.customerName.length}/25
              </div>
            </div>
          </div>

          {/* Drink Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Select Drink
            </label>
            <div className="scroll-container border border-gray-200 rounded-lg">
              <div className="grid grid-cols-1 gap-2 max-h-48 md:max-h-[500px] lg:max-h-[600px] overflow-y-auto p-2 scrollbar-thin">
                {menuItems.drinks.map((drink) => (
                  <button
                    key={drink.id}
                    type="button"
                    tabIndex={2}
                    onClick={() => setFormData({ ...formData, drink: drink.itemName })}
                    className={`p-3 rounded-lg border-2 text-left transition-all focus:ring-2 focus:ring-amber-500 ${
                      formData.drink === drink.itemName
                        ? 'border-amber-500 bg-amber-50 text-amber-900'
                        : 'border-gray-200 bg-white hover:border-amber-300'
                    }`}
                  >
                    <div className="font-semibold text-sm">{drink.itemName}</div>
                    <div className="text-base font-bold text-amber-600">${drink.price?.toFixed(2)}</div>
                  </button>
                ))}
              </div>
              <div className="scroll-fade-bottom"></div>
            </div>
          </div>
        </div>

        {/* Middle Column - Options */}
        <div className="space-y-3">
          {/* Milk Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Milk Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {menuItems.milks.map((milk) => (
                <button
                  key={milk.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, milk: milk.itemName })}
                  className={`p-2 rounded-lg border-2 text-center transition-all ${
                    formData.milk === milk.itemName
                      ? 'border-amber-500 bg-amber-50 text-amber-900'
                      : 'border-gray-200 bg-white hover:border-amber-300'
                  }`}
                >
                  <div className="font-medium text-xs">{milk.itemName}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Temperature Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Temperature
            </label>
            <div className="grid grid-cols-3 gap-2">
              {menuItems.temperatures.map((temp) => (
                <button
                  key={temp.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, temperature: temp.itemName })}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    formData.temperature === temp.itemName
                      ? 'border-amber-500 bg-amber-50 text-amber-900'
                      : 'border-gray-200 bg-white hover:border-amber-300'
                  }`}
                >
                  <div className="font-bold text-sm">{temp.itemName}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Syrup Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Syrups (tap to add/remove pumps)
            </label>
            <div className="space-y-2">
              {/* Selected Syrups Display */}
              {formData.syrups.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                  <div className="text-xs font-semibold text-amber-800 mb-2">Selected:</div>
                  <div className="flex flex-wrap gap-1">
                    {formData.syrups.map((syrup) => (
                      <span key={syrup.syrupName} className="bg-amber-200 text-amber-800 px-2 py-1 rounded-full text-xs font-medium">
                        {syrup.pumps} {syrup.pumps === 1 ? 'pump' : 'pumps'} {syrup.syrupName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Syrup Options */}
              <div className="scroll-container border border-gray-200 rounded-lg">
                <div className="grid grid-cols-2 gap-2 max-h-32 md:max-h-48 lg:max-h-64 overflow-y-auto p-2 scrollbar-thin">
                  {menuItems.syrups.map((syrup) => {
                    const pumps = getSyrupPumps(syrup.itemName);
                    return (
                      <div key={syrup.id} className="border border-gray-200 rounded-lg p-2 bg-white">
                        <div className="font-medium text-xs text-center mb-2">{syrup.itemName}</div>
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => removeSyrup(syrup.itemName)}
                            disabled={pumps === 0}
                            className="w-6 h-6 rounded-full bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-semibold min-w-[2rem] text-center">
                            {pumps === 0 ? '0' : `${pumps}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => addSyrup(syrup.itemName)}
                            disabled={pumps >= 10}
                            className="w-6 h-6 rounded-full bg-green-100 text-green-600 hover:bg-green-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="scroll-fade-bottom"></div>
              </div>
            </div>
          </div>

          {/* Foam Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Foam
            </label>
            <div className="grid grid-cols-2 gap-2">
              {menuItems.foams.map((foam) => {
                const isColdFoamByName = foam.itemName.toLowerCase().includes('cold foam');
                const premiumFoamTypes = ['Regular Foam', 'Cold Foam', 'Extra Foam'];
                const isPremiumFoam = premiumFoamTypes.includes(foam.itemName);
                const isColdFoam = isColdFoamByName || isPremiumFoam;
                return (
                  <button
                    key={foam.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, foam: foam.itemName })}
                    className={`p-2 rounded-lg border-2 text-center transition-all ${
                      formData.foam === foam.itemName
                        ? 'border-amber-500 bg-amber-50 text-amber-900'
                        : 'border-gray-200 bg-white hover:border-amber-300'
                    }`}
                  >
                    <div className="font-medium text-xs">{foam.itemName}</div>
                    {isColdFoam && (
                      <div className="text-xs text-green-600 font-semibold mt-1">
                        +${extraPricing.coldFoamPrice.toFixed(2)}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column - Extras & Submit */}
        <div className="space-y-3">
          {/* Extra Shots */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Extra Shots
            </label>
            <div className="flex items-center space-x-2 mb-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, extraShots: Math.max(0, formData.extraShots - 1) })}
                className="w-8 h-8 rounded-full border-2 border-gray-300 bg-white hover:border-amber-300 flex items-center justify-center text-gray-600 hover:text-amber-600 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={formData.extraShots <= 0}
              >
                −
              </button>
              
              <div className="flex-1 text-center p-2 border-2 border-gray-200 rounded-lg bg-gray-50">
                <div className="font-bold text-base text-gray-900">
                  {formData.extraShots} {formData.extraShots === 1 ? 'Shot' : 'Shots'}
                </div>
                <div className="text-xs text-green-600 font-semibold">
                  {formData.extraShots > 0 ? `+$${(formData.extraShots * extraPricing.extraShotPrice).toFixed(2)}` : 'No extra shots'}
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => setFormData({ ...formData, extraShots: Math.min(5, formData.extraShots + 1) })}
                className="w-8 h-8 rounded-full border-2 border-gray-300 bg-white hover:border-amber-300 flex items-center justify-center text-gray-600 hover:text-amber-600 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={formData.extraShots >= 5}
              >
                +
              </button>
            </div>
            
            {/* Quick Selection Buttons */}
            <div className="grid grid-cols-3 gap-1">
              {[0, 1, 2].map((shots) => (
                <button
                  key={shots}
                  type="button"
                  onClick={() => setFormData({ ...formData, extraShots: shots })}
                  className={`p-2 rounded-lg border-2 text-center transition-all ${
                    formData.extraShots === shots
                      ? 'border-amber-500 bg-amber-50 text-amber-900'
                      : 'border-gray-200 bg-white hover:border-amber-300'
                  }`}
                >
                  <div className="text-xs font-medium">
                    {shots === 0 ? 'None' : `${shots} Shot${shots > 1 ? 's' : ''}`}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-semibold text-gray-900 mb-2">
              Notes
            </label>
            <div className="relative">
              <textarea
                id="notes"
                rows={2}
                tabIndex={3}
                maxLength={100}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 pb-6 border-2 border-gray-200 rounded-lg focus:ring-amber-500 focus:border-amber-500 text-sm"
                placeholder="Special requests..."
                autoComplete="off"
              />
              <div className="absolute bottom-1 right-2 text-xs text-gray-400">
                {formData.notes?.length || 0}/100
              </div>
            </div>
          </div>

          {/* Price Display */}
          {formData.drink && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-lg p-3">
              <div className="text-xl font-bold text-amber-800 mb-2">
                Total: ${currentPrice.toFixed(2)}
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div>Base: ${(menuItems.drinks.find(d => d.itemName === formData.drink)?.price || 0).toFixed(2)}</div>
                {formData.extraShots > 0 && (
                  <div>Extra shots ({formData.extraShots}): +${(formData.extraShots * extraPricing.extraShotPrice).toFixed(2)}</div>
                )}
                {formData.syrups.length > 0 && (
                  <div>Syrups: {formData.syrups.map(s => `${s.pumps}x ${s.syrupName}`).join(', ')}</div>
                )}
                {formData.foam && formData.foam.toLowerCase().includes('cold foam') && (
                  <div>Cold foam: +${extraPricing.coldFoamPrice.toFixed(2)}</div>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            id="submit-order-btn"
            type="submit"
            tabIndex={4}
            disabled={isSubmitting || !formData.customerName || !formData.drink}
            className="w-full flex justify-center items-center py-3 px-4 border-2 border-transparent rounded-lg shadow-lg text-base font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 focus:outline-none focus:ring-4 focus:ring-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title="Submit order (Ctrl+Enter)"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </div>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Order
              </>
            )}
          </button>
        </div>
        </div>
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
                    {createdOrder.milk}, {createdOrder.syrups && createdOrder.syrups.length > 0 ? createdOrder.syrups.map(s => `${s.pumps}x ${s.syrupName}`).join(', ') : 'No syrups'}, {createdOrder.foam}, {createdOrder.temperature}
                    {createdOrder.extraShots > 0 && <span className="ml-1 text-amber-600">+ {createdOrder.extraShots} Extra Shot{createdOrder.extraShots > 1 ? 's' : ''}</span>}
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

              {/* Label Configuration Selector */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Label Configuration
                </label>
                <select
                  value={selectedLabelConfig}
                  onChange={(e) => setSelectedLabelConfig(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="default">Hardcoded Default</option>
                  {defaultConfig && (
                    <option value="app-default">
                      App Default: {defaultConfig.name} ({defaultConfig.width}×{defaultConfig.height}mm)
                    </option>
                  )}
                  {labelConfigs.map((config) => (
                    <option key={config.id} value={config.id}>
                      {config.name} ({config.width}×{config.height}mm)
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-3">
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
                
                <div className="border-t pt-3">
                  <button
                    onClick={handleGiveawayOptIn}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    🎉 Enter Giveaway!
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-1">
                    Ask if the customer wants to sign up for the t-shirt giveaway! Each order counts as one entry.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Giveaway Opt-in Modal */}
      {showGiveawayOptIn && createdOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">🎉 Enter Giveaway</h3>
                <button
                  onClick={closeGiveawayModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm text-green-800">
                    <div className="font-semibold mb-1">Win Free Drinks!</div>
                    <p>Enter your phone number to join our giveaway. Each order gives you one entry - the more orders you place, the better your chances!</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Customer: <span className="font-semibold">{createdOrder.customerName}</span></div>
                </div>

                <div>
                  <label htmlFor="giveawayPhone" className="block text-sm font-semibold text-gray-900 mb-2">
                    Phone Number
                  </label>
                  <input
                    id="giveawayPhone"
                    type="tel"
                    required
                    value={giveawayPhoneNumber}
                    onChange={(e) => setGiveawayPhoneNumber(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm"
                    placeholder="(555) 123-4567"
                    maxLength={20}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    We&apos;ll only use this to contact giveaway winners. No spam!
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleGiveawaySubmit}
                  disabled={isSubmittingGiveaway || !giveawayPhoneNumber.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  {isSubmittingGiveaway ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Joining...
                    </div>
                  ) : (
                    'Join Giveaway'
                  )}
                </button>
                <button
                  onClick={closeGiveawayModal}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}