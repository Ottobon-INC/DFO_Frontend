import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, Bed, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface TransferBedProps {
  isOpen: boolean;
  admissionId: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const TransferBed: React.FC<TransferBedProps> = ({ isOpen, admissionId, onClose, onConfirm }) => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedBedId, setSelectedBedId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchAvailableBeds();
    }
  }, [isOpen]);

  const fetchAvailableBeds = async () => {
    setIsLoading(true);
    try {
      const roomsRes = await api.getRoomsAvailable();
      setRooms(roomsRes?.data || []);
    } catch (err: any) {
      setError('Failed to fetch available beds.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBedId) {
      setError('Please select a destination bed.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await api.transferBed(admissionId, selectedBedId, transferReason);
      onConfirm();
    } catch (err: any) {
      setError(err.message || 'Failed to transfer patient.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group beds by Category -> Room
  const groupedBeds: Record<string, { roomName: string; beds: any[] }[]> = {};
  rooms.forEach(room => {
    const catName = room.category_name || 'Uncategorized';
    if (!groupedBeds[catName]) groupedBeds[catName] = [];
    groupedBeds[catName].push({
      roomName: room.name || `Room ${room.room_number}`,
      beds: room.available_beds || []
    });
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-brand-bg/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-brand-surface border border-brand-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-primary/10 to-brand-accent/10 p-6 border-b border-brand-border flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-brand-primary/20 text-brand-primary rounded-xl">
              <ArrowRightLeft size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-brand-textPrimary">Transfer Patient</h2>
              <p className="text-sm text-brand-textSecondary">Move patient to a different bed/ward</p>
            </div>
          </div>
            <button onClick={onClose} className="p-2 text-brand-textSecondary hover:bg-red-100 hover:text-red-600 rounded-xl transition-colors">
                <X size={20} />
            </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-brand-error/10 border border-brand-error/20 rounded-xl text-brand-error text-sm flex items-start space-x-2">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
            </div>
          ) : (
            <>
              {/* Categorized Bed Select */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-brand-textSecondary flex items-center space-x-2">
                  <Bed size={16} /> <span>Destination Bed</span>
                </label>
                <select
                  value={selectedBedId}
                  onChange={(e) => setSelectedBedId(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-brand-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all appearance-none"
                  required
                >
                  <option value="" disabled>Choose an available bed...</option>
                  {Object.entries(groupedBeds).map(([categoryName, roomsArr]) => (
                    <optgroup key={categoryName} label={`--- ${categoryName.toUpperCase()} TIER ---`}>
                      {roomsArr.map(r => (
                        r.beds.map(b => (
                          <option key={b.id} value={b.id}>
                            {r.roomName} - Bed {b.bed_identifier}
                          </option>
                        ))
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Transfer Reason */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-brand-textSecondary flex items-center space-x-2">
                  <span>Transfer Reason (Optional)</span>
                </label>
                <textarea
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="e.g., Escalation of care, Patient request..."
                  className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-brand-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all resize-none h-24"
                />
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div className="flex space-x-3 pt-4 border-t border-brand-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-brand-bg border border-brand-border text-brand-textPrimary rounded-xl font-semibold hover:bg-brand-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="flex-1 py-3 px-4 bg-brand-primary text-white rounded-xl font-semibold hover:bg-brand-primaryDark transition-colors shadow-lg shadow-brand-primary/20 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Confirm Transfer</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
