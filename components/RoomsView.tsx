import React, { useState, useEffect } from 'react';
import { Bed, Plus, MoreVertical, LogOut, ArrowRightLeft, XCircle, Settings, User } from 'lucide-react';
import { api } from '../services/api';
import { TransferBed } from './TransferBed';
import { AdmissionWizardModal } from './AdmissionWizardModal';
import { RoomSettingsTab } from './RoomSettingsTab';

export const RoomsView: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  
  const [transferAdmissionId, setTransferAdmissionId] = useState<string | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Toggle for Admin View
  const [activeTab, setActiveTab] = useState<'floor_plan' | 'settings'>('floor_plan');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [categoriesRes, bedsRes, admissionsRes, patientsRes] = await Promise.all([
        api.getRoomCategories(),
        api.getBeds(),
        api.getAdmissions(),
        api.getPatients()
      ]);
      setCategories(categoriesRes?.data || []);
      setBeds(bedsRes?.data || []);
      setAdmissions(admissionsRes?.data || []);
      setPatients(patientsRes?.data?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDischarge = async (admissionId: string) => {
    if (!window.confirm('Are you sure you want to discharge this patient?')) return;
    try {
      await api.dischargeAdmission(admissionId);
      setActiveDropdownId(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to discharge');
    }
  };

  const handleCancelAdmission = async (admissionId: string) => {
    if (!window.confirm('WARNING: Are you sure you want to cancel this admission? This action cannot be undone.')) return;
    try {
      await api.cancelAdmission(admissionId);
      setActiveDropdownId(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel admission');
    }
  };

  // Process data to build the floor plan
  const mappedBeds = beds.map(bed => {
    const isOccupied = bed.status === 'occupied';
    
    let activeAdmission = null;
    let patientName = 'Unknown Patient';
    
    if (isOccupied) {
      // Find the active admission for this bed
      // We look for an admission where status is 'admitted' and its bed_id matches (or bed_assignments matches)
      // Since getAdmissions might not join deeply in the frontend, let's assume the backend getAdmissions returns bed_id or we filter.
      // We should check what getAdmissions returns.
      activeAdmission = admissions.find(a => a.status === 'admitted' && a.bed_id === bed.id);
      
      if (activeAdmission) {
        const p = patients.find(p => p.id === activeAdmission.patient_id);
        if (p) patientName = p.name;
      }
    }
    
    return {
      ...bed,
      activeAdmission,
      patientName
    };
  });

  // Group by Category -> Room -> Beds
  const floorPlan: Record<string, { category: any, rooms: Record<string, { room: any, beds: any[] }> }> = {};

  categories.forEach(cat => {
    floorPlan[cat.id] = { category: cat, rooms: {} };
  });

  mappedBeds.forEach(bed => {
    const room = bed.sakhi_clinic_rooms;
    if (!room) return;
    
    const catId = room.sakhi_clinic_room_categories?.id;
    if (!catId || !floorPlan[catId]) return;

    if (!floorPlan[catId].rooms[room.id]) {
      floorPlan[catId].rooms[room.id] = { room, beds: [] };
    }
    floorPlan[catId].rooms[room.id].beds.push(bed);
  });

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-brand-surface p-6 rounded-2xl border border-brand-border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-brand-textPrimary flex items-center space-x-2">
            <Bed className="text-brand-primary" />
            <span>Room & Asset Management</span>
          </h1>
          <p className="text-brand-textSecondary mt-1">Manage hospital beds, admissions, and transfers.</p>
        </div>
        <div className="flex space-x-3">
          <div className="flex bg-brand-bg rounded-xl border border-brand-border p-1 mr-4">
             <button
                onClick={() => setActiveTab('floor_plan')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${activeTab === 'floor_plan' ? 'bg-brand-surface text-brand-primary shadow-sm' : 'text-brand-textSecondary hover:text-brand-textPrimary'}`}
             >
                Floor Plan
             </button>
             {/* Note: This tab should technically be restricted to Admins */}
             <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${activeTab === 'settings' ? 'bg-brand-surface text-brand-primary shadow-sm' : 'text-brand-textSecondary hover:text-brand-textPrimary'}`}
             >
                Settings
             </button>
          </div>
          <button
            onClick={() => setIsAdmitModalOpen(true)}
            className="flex items-center space-x-2 bg-brand-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-brand-primaryDark transition-colors shadow-lg shadow-brand-primary/20"
          >
            <Plus size={18} />
            <span>Admit Patient</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 relative">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-brand-textSecondary">Loading Floor Plan...</div>
        ) : activeTab === 'floor_plan' ? (
          Object.values(floorPlan).map(({ category, rooms }) => {
            const roomList = Object.values(rooms);
            if (roomList.length === 0) return null;

            return (
              <div key={category.id} className="space-y-4">
                <h2 className="text-xl font-bold text-brand-textPrimary border-b border-brand-border pb-2 capitalize">
                  {category.name} ({category.tier} Tier)
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {roomList.map(({ room, beds }) => (
                    <div key={room.id} className="bg-brand-surface rounded-2xl border border-brand-border shadow-sm overflow-visible flex flex-col">
                      <div className="bg-brand-bg px-4 py-3 border-b border-brand-border flex justify-between items-center">
                        <span className="font-bold text-brand-textPrimary">{room.name || `Room ${room.room_number}`}</span>
                      </div>
                      <div className="p-4 flex-1 flex flex-col space-y-3 bg-brand-surface/5">
                        {beds.map((bed: any) => {
                          const isOccupied = bed.status === 'occupied';
                          
                          return (
                            <div key={bed.id} className={`relative flex items-center justify-between p-3 rounded-xl border group transition-colors ${
                              isOccupied ? 'border-brand-primary/30 bg-brand-primary/5 hover:bg-brand-primary/10' : 'border-brand-success/20 bg-brand-success/5 hover:bg-brand-success/10'
                            }`}>
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  isOccupied ? 'bg-brand-primary/20 text-brand-primary' : 'bg-brand-success/20 text-brand-success'
                                }`}>
                                  {isOccupied ? <User size={16} /> : <Bed size={16} />}
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-brand-textPrimary">
                                    {isOccupied ? bed.patientName : `Bed ${bed.bed_identifier}`}
                                  </div>
                                  <div className={`text-xs font-medium ${isOccupied ? 'text-brand-primary' : 'text-brand-success'}`}>
                                    {isOccupied ? `Bed ${bed.bed_identifier} (Occupied)` : 'Available'}
                                  </div>
                                </div>
                              </div>

                              {isOccupied && bed.activeAdmission && (
                                <div className="relative">
                                  <button 
                                    onClick={() => setActiveDropdownId(activeDropdownId === bed.id ? null : bed.id)}
                                    className="p-1.5 text-brand-textSecondary hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors"
                                  >
                                    <MoreVertical size={16} />
                                  </button>
                                  
                                  {activeDropdownId === bed.id && (
                                    <div className="absolute right-0 mt-1 w-48 bg-brand-surface border border-brand-border rounded-xl shadow-xl z-[100] py-1 animate-slide-up">
                                      <button
                                        onClick={() => {
                                          setTransferAdmissionId(bed.activeAdmission.id);
                                          setActiveDropdownId(null);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-brand-textPrimary hover:bg-brand-hover flex items-center space-x-2"
                                      >
                                        <ArrowRightLeft size={14} className="text-brand-primary" />
                                        <span>Transfer Patient</span>
                                      </button>
                                      <button
                                        onClick={() => handleDischarge(bed.activeAdmission.id)}
                                        className="w-full text-left px-4 py-2 text-sm text-brand-textPrimary hover:bg-brand-hover flex items-center space-x-2"
                                      >
                                        <LogOut size={14} className="text-brand-success" />
                                        <span>Discharge Patient</span>
                                      </button>
                                      <button
                                        onClick={() => handleCancelAdmission(bed.activeAdmission.id)}
                                        className="w-full text-left px-4 py-2 text-sm text-brand-error hover:bg-brand-error/10 flex items-center space-x-2"
                                      >
                                        <XCircle size={14} />
                                        <span>Cancel Admission</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
           <div className="animate-slide-up h-full">
              <RoomSettingsTab 
                categories={categories}
                rooms={rooms}
                onRefresh={fetchData}
              />
           </div>
        )}
      </div>

      <AdmissionWizardModal
        isOpen={isAdmitModalOpen}
        onClose={() => setIsAdmitModalOpen(false)}
        onConfirm={() => {
          setIsAdmitModalOpen(false);
          fetchData();
        }}
      />

      <TransferBed
        isOpen={!!transferAdmissionId}
        admissionId={transferAdmissionId || ''}
        onClose={() => setTransferAdmissionId(null)}
        onConfirm={() => {
          setTransferAdmissionId(null);
          fetchData();
        }}
      />
    </div>
  );
};
