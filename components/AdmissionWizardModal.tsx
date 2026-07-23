import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Bed, User, Stethoscope, Calendar, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { Patient } from '../types';

interface AdmissionWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const AdmissionWizardModal: React.FC<AdmissionWizardModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedBedId, setSelectedBedId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      let pData: any[] = [];
      let dData: any[] = [];
      let rData: any[] = [];

      try {
        const pRes = await api.getPatients();
        pData = pRes?.data?.items || pRes?.data || pRes?.items || (Array.isArray(pRes) ? pRes : []);
        if (!Array.isArray(pData)) pData = [];
      } catch (e) { console.warn('Failed to fetch patients for admission', e); }

      try {
        const dRes = await api.getDoctors();
        dData = dRes?.data || (Array.isArray(dRes) ? dRes : []);
        if (!Array.isArray(dData)) dData = [];
      } catch (e) { console.warn('Failed to fetch doctors for admission', e); }

      try {
        const rRes = await api.getRoomsAvailable();
        rData = rRes?.data || (Array.isArray(rRes) ? rRes : []);
        if (!Array.isArray(rData)) rData = [];
      } catch (e) { console.warn('Failed to fetch rooms for admission', e); }

      setPatients(pData);
      setDoctors(dData);
      setRooms(rData);

      if (pData.length === 0 && rData.length === 0) {
         setError('Warning: No patients or rooms could be fetched. Ensure backend is running.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch required data for admission.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedBedId) {
      setError('Patient and Bed are required.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await api.createAdmission({
        patient_id: selectedPatientId,
        bed_id: selectedBedId,
        attending_doctor_id: selectedDoctorId || undefined
      });
      onConfirm();
    } catch (err: any) {
      setError(err.message || 'Failed to admit patient.');
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

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-brand-bg/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-brand-surface border border-brand-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-primary/10 to-brand-accent/10 p-6 border-b border-brand-border flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-brand-primary/20 text-brand-primary rounded-xl">
              <Bed size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-brand-textPrimary">Admit Patient</h2>
              <p className="text-sm text-brand-textSecondary">Assign a patient to an available bed</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-brand-textSecondary hover:bg-red-100 hover:text-red-600 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-brand-error/10 border border-brand-error/20 rounded-xl text-brand-error text-sm">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
            </div>
          ) : (
            <>
              {/* Patient Select */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-brand-textSecondary flex items-center space-x-2">
                  <User size={16} /> <span>Select Patient</span>
                </label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-brand-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all appearance-none"
                  required
                >
                  <option value="" disabled>Choose a registered patient...</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.uhid || 'No UHID'})</option>
                  ))}
                </select>
              </div>

              {/* Doctor Select */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-brand-textSecondary flex items-center space-x-2">
                  <Stethoscope size={16} /> <span>Attending Doctor (Optional)</span>
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-brand-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all appearance-none"
                >
                  <option value="">None / Unassigned</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.specialty || 'General'})</option>
                  ))}
                </select>
              </div>

              {/* Categorized Bed Select */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-brand-textSecondary flex items-center space-x-2">
                  <Bed size={16} /> <span>Assign Bed</span>
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
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Confirm Admission</span>}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
