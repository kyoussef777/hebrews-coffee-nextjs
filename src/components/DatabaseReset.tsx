'use client';

import { useState } from 'react';
import { Trash2, AlertTriangle, Lock, Database } from 'lucide-react';

export default function DatabaseReset() {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [password, setPassword] = useState('');
  const [resetOrders, setResetOrders] = useState(false);
  const [resetInventory, setResetInventory] = useState(false);
  const [resetRaffle, setResetRaffle] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleResetRequest = () => {
    if (!resetOrders && !resetInventory && !resetRaffle) {
      setError('Please select at least one option to reset');
      return;
    }
    setError('');
    setSuccess('');
    setShowConfirmModal(true);
  };

  const handleConfirmReset = async () => {
    if (!password) {
      setError('Password is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          resetOrders,
          resetInventory,
          resetRaffle
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(
          `Database reset completed successfully. ${data.data.ordersDeleted} orders and ${data.data.inventoryDeleted} inventory items were deleted.`
        );
        setShowConfirmModal(false);
        setPassword('');
        setResetOrders(false);
        setResetInventory(false);
        setResetRaffle(false);
      } else {
        setError(data.error || 'Failed to reset database');
      }
    } catch (error) {
      console.error('Error resetting database:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
    setPassword('');
    setError('');
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Database className="h-6 w-6 text-red-600" />
        <h2 className="text-xl font-semibold text-gray-900">Database Reset</h2>
      </div>

      {/* Warning Notice */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Danger Zone</h3>
            <p className="text-sm text-red-700 mt-1">
              This action will permanently delete selected data from the database. This action cannot be undone.
            </p>
          </div>
        </div>
      </div>

      {/* Reset Options */}
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-medium text-gray-900">What would you like to reset?</h3>
        
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={resetOrders}
              onChange={(e) => setResetOrders(e.target.checked)}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Reset Orders</span>
            <span className="text-sm text-gray-500">(Delete all order records)</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={resetInventory}
              onChange={(e) => setResetInventory(e.target.checked)}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Reset Inventory Costs</span>
            <span className="text-sm text-gray-500">(Delete all inventory cost records)</span>
          </label>

           <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={resetRaffle}
              onChange={(e) => setResetRaffle(e.target.checked)}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Reset Raffle</span>
            <span className="text-sm text-gray-500">(Delete all raffle records)</span>
          </label>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleResetRequest}
        disabled={isLoading || (!resetOrders && !resetInventory && !resetRaffle)}
        className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
      >
        <Trash2 className="h-4 w-4" />
        <span>Reset Database</span>
      </button>

      {/* Status Messages */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0">
                  <Lock className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Confirm Database Reset</h3>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  Please enter your admin password to confirm this action:
                </p>
                
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">You are about to:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {resetOrders && <li>• Delete all order records</li>}
                    {resetInventory && <li>• Delete all inventory cost records</li>}
                  </ul>
                </div>

                <input
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleConfirmReset()}
                />
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReset}
                  disabled={isLoading || !password}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  {isLoading ? 'Resetting...' : 'Confirm Reset'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}