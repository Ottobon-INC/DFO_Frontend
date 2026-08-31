import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bed, Plus, MoreVertical, LogOut, ArrowRightLeft, XCircle, 
  Settings, User, CheckCircle2, Building, Layers, 
  Filter, Search, Clock, ShieldCheck, DoorClosed, Activity
} from 'lucide-react';
import { api } from '../services/api';
import { TransferBed } from './TransferBed';
import { AdmissionWizardModal } from './AdmissionWizardModal';
import { RoomSettingsTab } from './RoomSettingsTab';
import toast from 'react-hot-toast';

export const RoomsView: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [preselectedBedId, setPreselectedBedId] = useState<string | null>(null);
  
  const [transferAdmissionId, setTransferAdmissionId] = useState<string | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<'floor_plan' | 'settings'>('floor_plan');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [categoriesRes, roomsRes, bedsRes, admissionsRes, patientsRes] = await Promise.all([
        api.getRoomCategories(),
        api.getRooms(),
        api.getBeds(),
        api.getAdmissions(),
        api.getPatients()
      ]);
      setCategories(categoriesRes?.data || []);
      setRooms(roomsRes?.data || []);
      setBeds(bedsRes?.data || []);
      setAdmissions(admissionsRes?.data || []);
      setPatients(patientsRes?.data?.items || []);
    } catch (err) {
      console.error("Failed to fetch rooms data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDischarge = async (admissionId: string) => {
    if (!window.confirm('Are you sure you want to discharge this patient?')) return;
    try {
      await api.dischargeAdmission(admissionId);
      toast.success("Patient successfully discharged");
      setActiveDropdownId(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to discharge patient');
    }
  };

  const handleCancelAdmission = async (admissionId: string) => {
    if (!window.confirm('WARNING: Are you sure you want to cancel this admission? This action cannot be undone.')) return;
    try {
      await api.cancelAdmission(admissionId);
      toast.success("Admission canceled");
      setActiveDropdownId(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel admission');
    }
  };

  // Mapped beds with active admission and patient snapshots
  const mappedBeds = useMemo(() => {
    return beds.map(bed => {
      const isOccupied = bed.status === 'occupied';
      let activeAdmission = null;
      let patientName = 'Unknown Patient';
      let admittedDate = null;
      
      if (isOccupied) {
        activeAdmission = admissions.find(a => a.status === 'admitted' && a.bed_id === bed.id);
        if (activeAdmission) {
          const p = patients.find(p => p.id === activeAdmission.patient_id);
          if (p) patientName = p.name;
          admittedDate = activeAdmission.admission_date || activeAdmission.created_at;
        }
      }
      
      return {
        ...bed,
        isOccupied,
        activeAdmission,
        patientName,
        admittedDate
      };
    });
  }, [beds, admissions, patients]);

  // Overall Occupancy Metrics
  const totalBedsCount = mappedBeds.length;
  const occupiedBedsCount = mappedBeds.filter(b => b.isOccupied).length;
  const availableBedsCount = totalBedsCount - occupiedBedsCount;
  const occupancyPercentage = totalBedsCount > 0 ? Math.round((occupiedBedsCount / totalBedsCount) * 100) : 0;

  // Build Floor Plan grouped by Category -> Room -> Beds
  const floorPlan = useMemo(() => {
    const plan: Record<string, { category: any; rooms: Record<string, { room: any; beds: any[] }> }> = {};

    categories.forEach(cat => {
      plan[cat.id] = { category: cat, rooms: {} };
    });

    rooms.forEach(room => {
      const catId = room.category_id;
      if (plan[catId]) {
        plan[catId].rooms[room.id] = { room, beds: [] };
      }
    });

    mappedBeds.forEach(bed => {
      const room = rooms.find(r => r.id === bed.room_id);
      if (room && plan[room.category_id]?.rooms[room.id]) {
        plan[room.category_id].rooms[room.id].beds.push(bed);
      }
    });

    return plan;
  }, [categories, rooms, mappedBeds]);

  // Clean category name helper
  const cleanCategoryName = (cat: any) => {
    if (!cat?.name) return 'Standard Ward';
    let name = cat.name.trim();
    // Remove trailing "( Tier)" or empty tier artifacts
    name = name.replace(/\(\s*Tier\s*\)/i, '').replace(/\(\s*\)/, '').trim();
    return name;
  };

  return (
    <div className="h-full flex flex-col space-y-5 animate-fadeIn" onClick={() => setActiveDropdownId(null)}>
      
      {/* Top Header & Metrics Banner */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 md:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          
          {/* Title & Info */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary flex-shrink-0">
              <Building size={22} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-brand-textPrimary tracking-tight">
                Rooms & Admissions
              </h1>
              <p className="text-xs text-brand-textSecondary mt-0.5">
                Hospital bed occupancy, room allocations, and patient transfers
              </p>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-brand-bg border border-brand-border rounded-xl px-3.5 py-2 text-center min-w-[85px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-textSecondary block">Total Beds</span>
              <span className="text-base font-extrabold text-brand-textPrimary">{totalBedsCount}</span>
            </div>

            <div className="bg-brand-bg border border-brand-border rounded-xl px-3.5 py-2 text-center min-w-[85px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Available</span>
              <span className="text-base font-extrabold text-emerald-600">{availableBedsCount}</span>
            </div>

            <div className="bg-brand-bg border border-brand-border rounded-xl px-3.5 py-2 text-center min-w-[85px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-accent block">Occupied</span>
              <span className="text-base font-extrabold text-brand-accent">{occupiedBedsCount}</span>
            </div>

            {/* Tab Toggle: Floor Plan vs Settings */}
            <div className="flex items-center bg-brand-bg p-1 rounded-xl border border-brand-border">
              <button
                onClick={() => setActiveTab('floor_plan')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'floor_plan'
                    ? 'bg-brand-surface text-brand-textPrimary shadow-2xs border border-brand-border/60'
                    : 'text-brand-textSecondary hover:text-brand-textPrimary'
                }`}
              >
                Floor Plan
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'settings'
                    ? 'bg-brand-surface text-brand-textPrimary shadow-2xs border border-brand-border/60'
                    : 'text-brand-textSecondary hover:text-brand-textPrimary'
                }`}
              >
                Settings
              </button>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={() => {
                setPreselectedBedId(null);
                setIsAdmitModalOpen(true);
              }}
              className="bg-brand-primary hover:bg-brand-secondary text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
            >
              <Plus size={15} />
              <span>Admit Patient</span>
            </button>
          </div>

        </div>

        {/* Category Filters Bar */}
        {activeTab === 'floor_plan' && (
          <div className="mt-4 pt-4 border-t border-brand-border/60 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
              <button
                onClick={() => setSelectedCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex-shrink-0 ${
                  selectedCategoryFilter === 'all'
                    ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                    : 'bg-brand-bg hover:bg-brand-surface border-brand-border text-brand-textPrimary'
                }`}
              >
                All Wards & Categories
              </button>

              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex-shrink-0 ${
                    selectedCategoryFilter === cat.id
                      ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                      : 'bg-brand-bg hover:bg-brand-surface border-brand-border text-brand-textPrimary'
                  }`}
                >
                  {cleanCategoryName(cat)}
                </button>
              ))}
            </div>

            <div className="text-xs text-brand-textSecondary font-medium">
              Occupancy: <strong>{occupancyPercentage}%</strong>
            </div>
          </div>
        )}
      </div>

      {/* Main Floor Plan Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
        {activeTab === 'floor_plan' ? (
          isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-3 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
            </div>
          ) : Object.values(floorPlan).length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-16 bg-brand-surface rounded-2xl border border-brand-border border-dashed">
              <Bed size={36} className="text-brand-textSecondary/40 mb-3" />
              <h3 className="text-base font-bold text-brand-textPrimary mb-1">No Rooms or Beds Configured</h3>
              <p className="text-xs text-brand-textSecondary max-w-sm mb-4">
                Configure your hospital wards, room numbers, and bed inventory in the settings tab.
              </p>
              <button
                onClick={() => setActiveTab('settings')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-primary text-white hover:bg-brand-secondary transition-all"
              >
                Configure Rooms & Beds
              </button>
            </div>
          ) : (
            Object.values(floorPlan)
              .filter(({ category }) => selectedCategoryFilter === 'all' || category.id === selectedCategoryFilter)
              .map(({ category, rooms }) => {
                const roomList = Object.values(rooms);
                if (roomList.length === 0) return null;
                const catName = cleanCategoryName(category);

                return (
                  <div key={category.id} className="space-y-3.5">
                    
                    {/* Category Title */}
                    <div className="flex items-center justify-between border-b border-brand-border pb-2 px-1">
                      <div className="flex items-center gap-2">
                        <DoorClosed size={16} className="text-brand-primary" />
                        <h2 className="text-sm font-extrabold text-brand-textPrimary uppercase tracking-wider">
                          {catName}
                        </h2>
                      </div>
                      <span className="text-xs font-semibold text-brand-textSecondary">
                        {roomList.length} {roomList.length === 1 ? 'Room' : 'Rooms'}
                      </span>
                    </div>
                    
                    {/* Room Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {roomList.map(({ room, beds }) => {
                        const occupiedInRoom = beds.filter(b => b.isOccupied).length;
                        const totalInRoom = beds.length;
                        const isAllAvailable = occupiedInRoom === 0;

                        return (
                          <div 
                            key={room.id} 
                            className="bg-brand-surface rounded-2xl border border-brand-border hover:border-brand-primary/30 transition-all shadow-xs flex flex-col overflow-hidden"
                          >
                            {/* Room Header */}
                            <div className="bg-brand-bg/70 px-4 py-2.5 border-b border-brand-border flex justify-between items-center">
                              <span className="font-bold text-xs text-brand-textPrimary">
                                {room.name || `Room ${room.room_number}`}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                isAllAvailable 
                                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                                  : 'bg-brand-accent/10 text-brand-accent border border-brand-accent/20'
                              }`}>
                                {totalInRoom - occupiedInRoom}/{totalInRoom} Available
                              </span>
                            </div>

                            {/* Beds List in this Room */}
                            <div className="p-3.5 flex-1 flex flex-col space-y-2.5">
                              {beds.length === 0 ? (
                                <div className="text-center py-6 text-[11px] text-brand-textSecondary">
                                  No beds created in this room
                                </div>
                              ) : (
                                beds.map((bed: any) => {
                                  const isOccupied = bed.isOccupied;

                                  return (
                                    <div 
                                      key={bed.id} 
                                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                                        isOccupied 
                                          ? 'border-brand-accent/30 bg-brand-accent/[0.03]' 
                                          : 'border-brand-border bg-brand-bg/60 hover:bg-brand-bg hover:border-emerald-500/50'
                                      }`}
                                    >
                                      {/* Bed & Patient Info */}
                                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                          isOccupied 
                                            ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/20' 
                                            : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                        }`}>
                                          {isOccupied ? <User size={15} /> : <Bed size={15} />}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                          <div className="text-xs font-bold text-brand-textPrimary truncate">
                                            {isOccupied ? bed.patientName : `Bed ${bed.bed_identifier}`}
                                          </div>
                                          <div className="text-[10px] text-brand-textSecondary mt-0.5 truncate">
                                            {isOccupied ? `Bed ${bed.bed_identifier} • Occupied` : 'Available'}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Action Area */}
                                      {isOccupied ? (
                                        <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
                                          <button 
                                            onClick={() => setActiveDropdownId(activeDropdownId === bed.id ? null : bed.id)}
                                            className="p-1.5 text-brand-textSecondary hover:text-brand-textPrimary hover:bg-brand-surface rounded-lg border border-transparent hover:border-brand-border transition-colors"
                                          >
                                            <MoreVertical size={15} />
                                          </button>
                                          
                                          {activeDropdownId === bed.id && bed.activeAdmission && (
                                            <div className="absolute right-0 mt-1 w-44 bg-brand-surface border border-brand-border rounded-xl shadow-lg z-[100] py-1 animate-fadeIn">
                                              <button
                                                onClick={() => {
                                                  setTransferAdmissionId(bed.activeAdmission.id);
                                                  setActiveDropdownId(null);
                                                }}
                                                className="w-full text-left px-3.5 py-2 text-xs font-medium text-brand-textPrimary hover:bg-brand-bg flex items-center gap-2"
                                              >
                                                <ArrowRightLeft size={13} className="text-brand-primary" />
                                                <span>Transfer Bed</span>
                                              </button>
                                              
                                              <button
                                                onClick={() => handleDischarge(bed.activeAdmission.id)}
                                                className="w-full text-left px-3.5 py-2 text-xs font-medium text-emerald-600 hover:bg-emerald-500/10 flex items-center gap-2"
                                              >
                                                <LogOut size={13} />
                                                <span>Discharge</span>
                                              </button>
                                              
                                              <button
                                                onClick={() => handleCancelAdmission(bed.activeAdmission.id)}
                                                className="w-full text-left px-3.5 py-2 text-xs font-medium text-red-500 hover:bg-red-500/10 flex items-center gap-2 border-t border-brand-border/60 mt-1"
                                              >
                                                <XCircle size={13} />
                                                <span>Cancel Admission</span>
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            setPreselectedBedId(bed.id);
                                            setIsAdmitModalOpen(true);
                                          }}
                                          className="text-[11px] font-bold text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 px-2.5 py-1 rounded-lg transition-all flex-shrink-0"
                                        >
                                          Admit
                                        </button>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>

                          </div>
                        );
                      })}
                    </div>

                  </div>
                );
              })
          )
        ) : (
          <div className="h-full animate-fadeIn">
            <RoomSettingsTab 
              categories={categories}
              rooms={rooms}
              beds={beds}
              onRefresh={fetchData}
            />
          </div>
        )}
      </div>

      {/* Admission Wizard Modal */}
      <AdmissionWizardModal
        isOpen={isAdmitModalOpen}
        onClose={() => {
          setIsAdmitModalOpen(false);
          setPreselectedBedId(null);
        }}
        onConfirm={() => {
          setIsAdmitModalOpen(false);
          setPreselectedBedId(null);
          fetchData();
        }}
      />

      {/* Transfer Bed Modal */}
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
