import React, { useState, useEffect, useMemo } from 'react';
import { 
  Save, Clock, AlertCircle, CheckCircle2, Plus, Trash2, Calendar, 
  Sparkles, Sun, Sunset, Stethoscope, ChevronRight, RefreshCw, Layers
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export interface ShiftSession {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  session_name?: string;
  room_number?: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface DoctorScheduleSettingsProps {
  userRole: string;
  currentUser: any;
  onNavigateToCalendar?: (doctorId: string) => void;
}

export default function DoctorScheduleSettings({ userRole, currentUser, onNavigateToCalendar }: DoctorScheduleSettingsProps) {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [schedules, setSchedules] = useState<ShiftSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [globalSlotDuration, setGlobalSlotDuration] = useState<number>(15);
  
  // Generation Range
  const [generateRange, setGenerateRange] = useState<'7' | '30' | '90' | 'custom'>('30');
  const [customStartDate, setCustomStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const handleGlobalDurationChange = (val: number) => {
    setGlobalSlotDuration(val);
    setSchedules((prev) =>
      prev.map((s) => ({
        ...s,
        slot_duration_minutes: val,
      }))
    );
  };

  useEffect(() => {
    if (userRole === 'Admin' || userRole === 'CRO' || userRole === 'Front Desk' || userRole === 'Super Admin') {
      fetchDoctors();
    } else if (userRole === 'Doctor') {
      setSelectedDoctorId(currentUser?.id || '');
    }
  }, [userRole, currentUser]);

  useEffect(() => {
    if (selectedDoctorId) {
      fetchSchedules(selectedDoctorId);
    }
  }, [selectedDoctorId]);

  const fetchDoctors = async () => {
    try {
      const res = await api.getDoctors();
      if (res.success && res.data) {
        setDoctors(res.data);
        if (res.data.length > 0 && !selectedDoctorId) {
          setSelectedDoctorId(res.data[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch doctors", error);
      toast.error("Failed to load doctor list");
    }
  };

  const fetchSchedules = async (doctorId: string) => {
    setLoading(true);
    try {
      const res = await api.getSchedules(doctorId);
      if (Array.isArray(res)) {
        setSchedules(res);
        if (res.length > 0 && res[0].slot_duration_minutes) {
          setGlobalSlotDuration(res[0].slot_duration_minutes);
        }
      } else {
        setSchedules([]);
      }
    } catch (error) {
      console.error("Failed to fetch schedules", error);
      toast.error("Failed to load existing schedule rules");
    } finally {
      setLoading(false);
    }
  };

  // Check if a day has any active sessions
  const isDayActive = (dayIndex: number) => {
    return schedules.some(s => s.day_of_week === dayIndex);
  };

  // Toggle all sessions for a day ON/OFF
  const handleToggleDay = (dayIndex: number) => {
    if (isDayActive(dayIndex)) {
      setSchedules(schedules.filter(s => s.day_of_week !== dayIndex));
    } else {
      // Add default Morning Session
      const newSession: ShiftSession = {
        day_of_week: dayIndex,
        start_time: '09:30',
        end_time: '13:30',
        slot_duration_minutes: globalSlotDuration,
        session_name: 'Morning Session'
      };
      setSchedules([...schedules, newSession]);
    }
  };

  // Add Split Session (e.g. Evening, Afternoon) to a day
  const handleAddSession = (dayIndex: number) => {
    const existingDaySessions = schedules.filter(s => s.day_of_week === dayIndex);
    const hasMorning = existingDaySessions.some(s => s.session_name?.toLowerCase().includes('morning') || parseInt(s.start_time.split(':')[0]) < 13);
    const hasEvening = existingDaySessions.some(s => s.session_name?.toLowerCase().includes('evening') || parseInt(s.start_time.split(':')[0]) >= 16);

    let sessionName = 'Evening Shift';
    let startTime = '16:00';
    let endTime = '20:00';

    if (hasMorning && !hasEvening) {
      sessionName = 'Evening Shift';
      startTime = '16:00';
      endTime = '20:00';
    } else if (hasMorning && hasEvening) {
      sessionName = 'Afternoon Shift';
      startTime = '13:00';
      endTime = '16:00';
    } else if (!hasMorning) {
      sessionName = 'Morning Shift';
      startTime = '09:00';
      endTime = '13:00';
    }

    const newSession: ShiftSession = {
      day_of_week: dayIndex,
      start_time: startTime,
      end_time: endTime,
      slot_duration_minutes: globalSlotDuration,
      session_name: sessionName
    };
    setSchedules([...schedules, newSession]);
  };

  // Remove a single session
  const handleRemoveSession = (dayIndex: number, sessionIndex: number) => {
    let dayCount = 0;
    const updated = schedules.filter(s => {
      if (s.day_of_week === dayIndex) {
        const matches = dayCount === sessionIndex;
        dayCount++;
        return !matches;
      }
      return true;
    });
    setSchedules(updated);
  };

  // Handle shift type dropdown change with standard OPD time defaults
  const handleShiftTypeChange = (dayIndex: number, sessionIndex: number, shiftType: string) => {
    let dayCount = 0;
    const updated = schedules.map(s => {
      if (s.day_of_week === dayIndex) {
        if (dayCount === sessionIndex) {
          dayCount++;
          let startTime = s.start_time;
          let endTime = s.end_time;

          if (shiftType === 'Morning Shift') {
            startTime = '09:00';
            endTime = '13:00';
          } else if (shiftType === 'Afternoon Shift') {
            startTime = '13:00';
            endTime = '16:00';
          } else if (shiftType === 'Evening Shift') {
            startTime = '16:00';
            endTime = '20:00';
          }

          return { 
            ...s, 
            session_name: shiftType, 
            start_time: startTime, 
            end_time: endTime 
          };
        }
        dayCount++;
      }
      return s;
    });
    setSchedules(updated);
  };

  // Update specific session property
  const handleUpdateSession = (
    dayIndex: number, 
    sessionIndex: number, 
    field: keyof ShiftSession, 
    value: any
  ) => {
    let dayCount = 0;
    const updated = schedules.map(s => {
      if (s.day_of_week === dayIndex) {
        if (dayCount === sessionIndex) {
          dayCount++;
          return { ...s, [field]: value };
        }
        dayCount++;
      }
      return s;
    });
    setSchedules(updated);
  };

  const getShiftType = (session: ShiftSession) => {
    if (session.session_name) {
      if (session.session_name.toLowerCase().includes('morning')) return 'Morning Shift';
      if (session.session_name.toLowerCase().includes('afternoon')) return 'Afternoon Shift';
      if (session.session_name.toLowerCase().includes('evening')) return 'Evening Shift';
    }
    const hour = parseInt((session.start_time || '09:00').split(':')[0], 10);
    if (hour < 13) return 'Morning Shift';
    if (hour >= 13 && hour < 16) return 'Afternoon Shift';
    return 'Evening Shift';
  };

  // Calculate total weekly consultation capacity
  const weeklyStats = useMemo(() => {
    let totalMinutes = 0;
    let totalSlots = 0;

    schedules.forEach(s => {
      const [sH, sM] = s.start_time.split(':').map(Number);
      const [eH, eM] = s.end_time.split(':').map(Number);
      const diff = (eH * 60 + (eM || 0)) - (sH * 60 + (sM || 0));
      if (diff > 0) {
        totalMinutes += diff;
        totalSlots += Math.floor(diff / (s.slot_duration_minutes || globalSlotDuration || 15));
      }
    });

    const activeDays = new Set(schedules.map(s => s.day_of_week)).size;

    return {
      totalHours: (totalMinutes / 60).toFixed(1),
      totalSlots,
      activeDays
    };
  }, [schedules, globalSlotDuration]);

  const handleSave = async () => {
    if (!selectedDoctorId) {
      toast.error("Please select a doctor");
      return;
    }
    setSaving(true);

    try {
      // Calculate date range
      const today = new Date();
      let startStr = today.toISOString().split('T')[0];
      let endStr = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      if (generateRange === '7') {
        endStr = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      } else if (generateRange === '90') {
        endStr = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      } else if (generateRange === 'custom') {
        startStr = customStartDate;
        endStr = customEndDate;
      }

      // Format clean time strings (HH:mm:00)
      const payload = schedules.map(s => ({
        day_of_week: s.day_of_week,
        start_time: s.start_time.length === 5 ? `${s.start_time}:00` : s.start_time,
        end_time: s.end_time.length === 5 ? `${s.end_time}:00` : s.end_time,
        slot_duration_minutes: s.slot_duration_minutes || globalSlotDuration || 15,
        slot_capacity: 1,
        session_name: s.session_name || 'General Session',
        room_number: s.room_number || null
      }));

      await api.saveSchedules(selectedDoctorId, payload, startStr, endStr);
      toast.success(`Schedule saved! Consultation slots generated from ${startStr} to ${endStr}`);
    } catch (error: any) {
      console.error("Failed to save schedules", error);
      toast.error(error?.message || "Failed to save schedule");
    } finally {
      setSaving(false);
    }
  };

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);

  return (
    <div className="space-y-6 w-full animate-fadeIn max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-textPrimary flex items-center gap-2">
            <Clock className="text-brand-primary" size={22} />
            Doctor Working Hours & Shift Rules
          </h2>
          <p className="text-xs text-brand-textSecondary mt-1">
            Configure recurring weekly consultation hours and split shifts (Morning & Evening sessions).
          </p>
        </div>

        {/* Doctor Selector */}
        {(userRole === 'Admin' || userRole === 'CRO' || userRole === 'Front Desk' || userRole === 'Super Admin') && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-brand-textSecondary">Doctor:</span>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="bg-brand-bg border border-brand-border rounded-xl px-3.5 py-2 text-xs font-bold text-brand-textPrimary outline-none focus:border-brand-primary shadow-2xs"
            >
              {doctors.map(doc => (
                <option key={doc.id} value={doc.id}>
                  {doc.name ? `Dr. ${doc.name.replace(/^Dr\.\s*/i, '')}` : (doc.email || 'Doctor')}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 shadow-2xs">
          <p className="text-xs font-semibold text-brand-textSecondary uppercase tracking-wider">Active Working Days</p>
          <p className="text-2xl font-extrabold text-brand-textPrimary mt-1">{weeklyStats.activeDays} <span className="text-xs font-medium text-brand-textSecondary">/ 7 days</span></p>
        </div>
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 shadow-2xs">
          <p className="text-xs font-semibold text-brand-textSecondary uppercase tracking-wider">Weekly Consult Time</p>
          <p className="text-2xl font-extrabold text-brand-primary mt-1">{weeklyStats.totalHours} <span className="text-xs font-medium text-brand-textSecondary">hours / week</span></p>
        </div>
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 shadow-2xs">
          <p className="text-xs font-semibold text-brand-textSecondary uppercase tracking-wider">Weekly Slot Capacity</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{weeklyStats.totalSlots} <span className="text-xs font-medium text-brand-textSecondary">patients / week</span></p>
        </div>
      </div>

      {/* Controls & Generation Range */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-border">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-brand-textPrimary">Consultation Duration:</span>
            <select
              value={globalSlotDuration}
              onChange={(e) => handleGlobalDurationChange(Number(e.target.value))}
              className="bg-brand-bg border border-brand-border rounded-lg px-3 py-1.5 text-xs font-bold text-brand-textPrimary outline-none focus:border-brand-primary"
            >
              <option value={10}>10 Minutes / Patient</option>
              <option value={15}>15 Minutes / Patient (Standard)</option>
              <option value={20}>20 Minutes / Patient</option>
              <option value={30}>30 Minutes / Patient</option>
              <option value={45}>45 Minutes / Patient</option>
              <option value={60}>60 Minutes / Patient</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-brand-textPrimary">Generate Slots For:</span>
            <div className="flex items-center bg-brand-bg p-1 rounded-xl border border-brand-border">
              <button
                type="button"
                onClick={() => setGenerateRange('7')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${generateRange === '7' ? 'bg-brand-primary text-white shadow-xs' : 'text-brand-textSecondary hover:text-brand-textPrimary'}`}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setGenerateRange('30')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${generateRange === '30' ? 'bg-brand-primary text-white shadow-xs' : 'text-brand-textSecondary hover:text-brand-textPrimary'}`}
              >
                30 Days
              </button>
              <button
                type="button"
                onClick={() => setGenerateRange('90')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${generateRange === '90' ? 'bg-brand-primary text-white shadow-xs' : 'text-brand-textSecondary hover:text-brand-textPrimary'}`}
              >
                90 Days
              </button>
            </div>
          </div>
        </div>

        {/* Weekly Day-by-Day Shift Cards */}
        {loading ? (
          <div className="py-12 flex justify-center items-center gap-2 text-sm text-brand-textSecondary">
            <RefreshCw className="animate-spin text-brand-primary" size={18} />
            Loading doctor schedule rules...
          </div>
        ) : (
          <div className="space-y-3">
            {DAYS.map((dayName, dayIndex) => {
              const daySessions = schedules.filter(s => s.day_of_week === dayIndex);
              const active = daySessions.length > 0;

              return (
                <div 
                  key={dayName}
                  className={`border rounded-xl p-4 transition-all ${
                    active ? 'border-brand-primary/30 bg-brand-primary/[0.02] shadow-2xs' : 'border-brand-border bg-brand-bg/40 opacity-75'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Day Toggle */}
                    <div className="flex items-center gap-3 w-40 flex-shrink-0">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => handleToggleDay(dayIndex)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-primary"></div>
                      </label>
                      <span className={`text-sm font-bold ${active ? 'text-brand-textPrimary' : 'text-brand-textSecondary'}`}>
                        {dayName}
                      </span>
                    </div>

                    {/* Sessions Container */}
                    <div className="flex-1 space-y-2">
                      {!active ? (
                        <p className="text-xs text-brand-textSecondary italic">Off Duty / Clinic Closed</p>
                      ) : (
                        daySessions.map((session, sIdx) => (
                          <div 
                            key={sIdx} 
                            className="flex flex-wrap items-center gap-2.5 bg-brand-surface p-2.5 rounded-lg border border-brand-border"
                          >
                            {/* Shift Type Dropdown */}
                            <select
                              value={getShiftType(session)}
                              onChange={(e) => handleShiftTypeChange(dayIndex, sIdx, e.target.value)}
                              className="text-xs font-bold text-brand-textPrimary bg-brand-bg px-2.5 py-1.5 rounded-lg border border-brand-border outline-none focus:border-brand-primary cursor-pointer shadow-2xs"
                            >
                              <option value="Morning Shift">Morning Shift (09:00 - 13:00)</option>
                              <option value="Afternoon Shift">Afternoon Shift (13:00 - 16:00)</option>
                              <option value="Evening Shift">Evening Shift (16:00 - 20:00)</option>
                            </select>

                            <div className="flex items-center gap-1.5">
                              <input
                                type="time"
                                value={session.start_time.substring(0, 5)}
                                onChange={(e) => handleUpdateSession(dayIndex, sIdx, 'start_time', e.target.value)}
                                className="text-xs font-semibold bg-brand-bg px-2 py-1 rounded border border-brand-border outline-none focus:border-brand-primary"
                              />
                              <span className="text-xs text-brand-textSecondary">to</span>
                              <input
                                type="time"
                                value={session.end_time.substring(0, 5)}
                                onChange={(e) => handleUpdateSession(dayIndex, sIdx, 'end_time', e.target.value)}
                                className="text-xs font-semibold bg-brand-bg px-2 py-1 rounded border border-brand-border outline-none focus:border-brand-primary"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={session.room_number || ''}
                                onChange={(e) => handleUpdateSession(dayIndex, sIdx, 'room_number', e.target.value)}
                                placeholder="Room (Optional)"
                                className="text-xs bg-brand-bg px-2 py-1 rounded border border-brand-border w-24 outline-none placeholder:text-[10px]"
                              />
                            </div>

                            {daySessions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSession(dayIndex, sIdx)}
                                className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors ml-auto"
                                title="Remove Session"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Session Button */}
                    {active && daySessions.length < 3 && (
                      <button
                        type="button"
                        onClick={() => handleAddSession(dayIndex)}
                        className="px-2.5 py-1 text-xs font-bold text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors flex items-center gap-1 self-start md:self-auto flex-shrink-0"
                      >
                        <Plus size={13} /> Add Shift
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Action Save Bar */}
        <div className="pt-4 border-t border-brand-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-brand-textSecondary">
            Saving will regenerate consultation slots for <span className="font-bold text-brand-textPrimary">Dr. {selectedDoctor?.name || 'Selected Doctor'}</span>.
          </p>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="w-full sm:w-auto bg-brand-primary hover:bg-brand-primaryDark text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="animate-spin" size={15} /> : <Save size={15} />}
            <span>{saving ? 'Saving & Generating Slots...' : 'Save & Generate Slots'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
