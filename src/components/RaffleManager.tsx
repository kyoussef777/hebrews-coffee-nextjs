'use client';

import { useState, useEffect } from 'react';
import { RaffleParticipant } from '@/types';
import { Trophy, Users, RefreshCw, RotateCcw, Phone, Calendar } from 'lucide-react';

export default function RaffleManager() {
  const [participants, setParticipants] = useState<RaffleParticipant[]>([]);
  const [eligibleParticipants, setEligibleParticipants] = useState<RaffleParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [lastWinner, setLastWinner] = useState<RaffleParticipant | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const loadParticipants = async () => {
    try {
      const [allResponse, eligibleResponse] = await Promise.all([
        fetch('/api/raffle/participants'),
        fetch('/api/raffle/participants?eligible=true')
      ]);

      const [allData, eligibleData] = await Promise.all([
        allResponse.json(),
        eligibleResponse.json()
      ]);

      if (allData.success) {
        setParticipants(allData.data);
      }
      if (eligibleData.success) {
        setEligibleParticipants(eligibleData.data);
      }
    } catch (error) {
      console.error('Error loading participants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadParticipants();
  }, []);

  const handleDrawWinner = async () => {
    if (eligibleParticipants.length === 0) {
      alert('No eligible participants for the raffle!');
      return;
    }

    setIsDrawing(true);
    try {
      const response = await fetch('/api/raffle/draw', {
        method: 'POST'
      });

      const result = await response.json();
      if (result.success) {
        setLastWinner(result.data);
        await loadParticipants(); // Refresh the lists
      } else {
        alert(result.message || 'Failed to draw winner');
      }
    } catch (error) {
      console.error('Error drawing winner:', error);
      alert('Failed to draw winner');
    } finally {
      setIsDrawing(false);
    }
  };

  const handleResetRaffle = async () => {
    setIsResetting(true);
    try {
      const response = await fetch('/api/raffle/reset', {
        method: 'POST'
      });

      const result = await response.json();
      if (result.success) {
        await loadParticipants(); // Refresh the lists
        setLastWinner(null);
        setShowConfirmReset(false);
      } else {
        alert(result.message || 'Failed to reset raffle');
      }
    } catch (error) {
      console.error('Error resetting raffle:', error);
      alert('Failed to reset raffle');
    } finally {
      setIsResetting(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  const winners = participants.filter(p => p.hasWon);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Eligible Participants</p>
              <p className="text-2xl font-bold text-green-900">{eligibleParticipants.length}</p>
            </div>
            <Users className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Participants</p>
              <p className="text-2xl font-bold text-blue-900">{participants.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600">Past Winners</p>
              <p className="text-2xl font-bold text-amber-900">{winners.length}</p>
            </div>
            <Trophy className="h-8 w-8 text-amber-600" />
          </div>
        </div>
      </div>

      {/* Last Winner Alert */}
      {lastWinner && (
        <div className="bg-green-100 border border-green-300 rounded-lg p-4">
          <div className="flex items-center">
            <Trophy className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <p className="font-semibold text-green-800">
                🎉 Congratulations to {lastWinner.customerName}!
              </p>
              <p className="text-sm text-green-700">
                Contact: {formatPhoneNumber(lastWinner.phoneNumber)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleDrawWinner}
          disabled={isDrawing || eligibleParticipants.length === 0}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
        >
          {isDrawing ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Drawing Winner...
            </div>
          ) : (
            <>
              <Trophy className="h-4 w-4 mr-2" />
              Draw Winner ({eligibleParticipants.length} eligible)
            </>
          )}
        </button>

        <button
          onClick={() => setShowConfirmReset(true)}
          disabled={isResetting || winners.length === 0}
          className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Raffle
        </button>

        <button
          onClick={loadParticipants}
          disabled={isLoading}
          className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Eligible Participants List */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">
            Eligible Participants ({eligibleParticipants.length})
          </h3>
          <p className="text-sm text-gray-600">These participants can win in the next draw</p>
        </div>
        
        <div className="overflow-x-auto">
          {eligibleParticipants.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No eligible participants</p>
              <p className="text-sm">Previous winners are excluded from future draws</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {eligibleParticipants.map((participant, index) => (
                <div key={participant.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-green-700">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{participant.customerName}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <Phone className="h-3 w-3 mr-1" />
                          {formatPhoneNumber(participant.phoneNumber)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      Joined {formatDate(participant.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Past Winners List */}
      {winners.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">
              Past Winners ({winners.length})
            </h3>
            <p className="text-sm text-gray-600">These participants have already won and are excluded from future draws</p>
          </div>
          
          <div className="overflow-x-auto">
            <div className="divide-y divide-gray-200">
              {winners.map((winner) => (
                <div key={winner.id} className="p-4 bg-amber-50 hover:bg-amber-100 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <Trophy className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{winner.customerName}</p>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-3 w-3 mr-1" />
                          {formatPhoneNumber(winner.phoneNumber)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      Won {formatDate(winner.updatedAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Reset Raffle</h3>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  This will reset all previous winners back to eligible status, allowing them to participate in future draws.
                </p>
                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800">
                    <strong>Warning:</strong> This action cannot be undone. {winners.length} past winner(s) will become eligible again.
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleResetRaffle}
                  disabled={isResetting}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  {isResetting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Resetting...
                    </div>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset Raffle
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowConfirmReset(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}