import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { 
  Calendar as CalendarIcon, Clock, User, CheckCircle2, XCircle, ChevronLeft, ChevronRight, 
  Stethoscope, Sun, Sunrise, Sunset, Settings, Plus, AlertCircle, Sparkles, 
  CalendarDays, LayoutGrid, ListFilter, UserCheck, ShieldAlert, RefreshCw, Palmtree
} from 'lucide-react';
import { Doctor } from '../../types';
import { BookAppointmentModal } from '../AppointmentModals';
import DoctorScheduleSettings from './DoctorScheduleSettings';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface DoctorSchedulesViewProps {
  userRole: string;
  currentUser: any;
}

type ViewMode = 'day' | 'week' | 'month';
type MainTab = 'calendar' | 'settings';

export const DoctorSchedulesView: React.FC<DoctorSchedulesViewProps> = ({ userRole, currentUser }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MainTab>('calendar');
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [slots, setSlots] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Date State (Current selected date: YYYY-MM-DD)
  const todayStr = useMemo(() => formatLocalDate(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [monthOffset, setMonthOffset] = useState<number>(0);

  // Quick booking modal
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingSlot, setBookingSlot] = useState<{ date: string; time: string } | null>(null);

  // Day Override / Leave Modal
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveModalDate, setLeaveModalDate] = useState<string>(todayStr);
  const [leaveReason, setLeaveReason] = useState<string>('Personal Leave');
  const [leaveType, setLeaveType] = useState<string>('Full Day');
  const [submittingLeave, setSubmittingLeave] = useState(false);

  const formatDoctorName = (name?: string) => {
    let raw = (name || '').trim();
    if (!raw || raw.toLowerCase() === 'unassigned') return 'Consultant';
    if (/^dr\.?\s+/i.test(raw)) {
      return raw.replace(/^dr\.?\s+/i, 'Dr. ');
    }
    return `Dr. ${raw}`;
  };

  useEffect(() => {
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
      }
    };

    if (userRole === 'Doctor') {
      setSelectedDoctorId(currentUser?.id || '');
    } else {
      fetchDoctors();
    }
  }, [userRole, currentUser]);

  useEffect(() => {
    if (selectedDoctorId) {
      fetchData(selectedDoctorId);
    }
  }, [selectedDoctorId, weekOffset, monthOffset]);

  const fetchData = async (doctorId: string) => {
    setLoading(true);
    try {
      // Calculate broad date range based on month/week
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() + monthOffset - 1, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + monthOffset + 2, 0);
      
      const sStr = formatLocalDate(startDate);
      const eStr = formatLocalDate(endDate);

      const [slotsRes, leavesRes] = await Promise.all([
        api.getDoctorSlots(doctorId, sStr, eStr).catch(() => ({ data: [] })),
        api.getDoctorLeaves(doctorId, sStr, eStr).catch(() => ({ data: [] }))
      ]);

      if (slotsRes && slotsRes.data) {
        setSlots(slotsRes.data);
      }
      if (leavesRes && leavesRes.data) {
        setLeaves(leavesRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch schedule data", error);
    } finally {
      setLoading(false);
    }
  };

  const activeDoctor = useMemo(() => {
    return doctors.find(d => d.id === selectedDoctorId) || doctors[0];
  }, [doctors, selectedDoctorId]);

  // Group slots by date string (YYYY-MM-DD)
  const slotsByDate = useMemo(() => {
    return slots.reduce((acc: Record<string, any[]>, slot: any) => {
      const date = slot.slot_date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(slot);
      return acc;
    }, {});
  }, [slots]);

  // Map leaves by date
  const leavesByDate = useMemo(() => {
    return leaves.reduce((acc: Record<string, any>, leave: any) => {
      acc[leave.leave_date] = leave;
      return acc;
    }, {});
  }, [leaves]);

  // Calculate 7 Days for the Selected Week (Monday to Sunday)
  const currentWeekDays = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
    const distanceToMonday = (dayOfWeek + 6) % 7;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday + (weekOffset * 7));

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = formatLocalDate(d);
      const daySlots = slotsByDate[dateStr] || [];
      const isToday = dateStr === todayStr;
      const leave = leavesByDate[dateStr];

      const availableSlots = daySlots.filter((s: any) => s.status !== 'LEAVE' && s.booked_count < s.capacity);
      const bookedSlots = daySlots.filter((s: any) => s.booked_count >= s.capacity);

      weekDays.push({
        dateStr,
        fullDate: d,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        monthName: d.toLocaleDateString('en-US', { month: 'short' }),
        isToday,
        isLeave: !!leave || daySlots.some((s: any) => s.status === 'LEAVE'),
        leaveReason: leave?.reason || 'Doctor on Leave',
        totalSlots: daySlots.length,
        availableCount: availableSlots.length,
        bookedCount: bookedSlots.length
      });
    }
    return weekDays;
  }, [weekOffset, slotsByDate, leavesByDate, todayStr]);

  // Format week range label (e.g. "Aug 31 – Sep 6, 2026")
  const weekRangeLabel = useMemo(() => {
    if (currentWeekDays.length === 0) return '';
    const start = currentWeekDays[0].fullDate;
    const end = currentWeekDays[6].fullDate;
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} – ${endStr}`;
  }, [currentWeekDays]);

  // Calculate Days for Month View
  const monthGridDays = useMemo(() => {
    const now = new Date();
    const targetMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const year = targetMonth.getFullYear();
    const month = targetMonth.getMonth();

    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const grid = [];
    // Padding before
    for (let i = 0; i < firstDayIndex; i++) {
      grid.push({ isPadding: true, key: `pad-${i}` });
    }
    // Real days
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const d = new Date(year, month, day);
      const dateStr = formatLocalDate(d);
      const daySlots = slotsByDate[dateStr] || [];
      const leave = leavesByDate[dateStr];
      const isToday = dateStr === todayStr;

      grid.push({
        isPadding: false,
        key: dateStr,
        dateStr,
        day,
        isToday,
        isLeave: !!leave || daySlots.some((s: any) => s.status === 'LEAVE'),
        leaveReason: leave?.reason,
        totalSlots: daySlots.length,
        availableSlots: daySlots.filter((s: any) => s.status !== 'LEAVE' && s.booked_count < s.capacity).length,
        bookedSlots: daySlots.filter((s: any) => s.booked_count >= s.capacity).length
      });
    }
    return grid;
  }, [monthOffset, slotsByDate, leavesByDate, todayStr]);

  const monthLabel = useMemo(() => {
    const now = new Date();
    const targetMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    return targetMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [monthOffset]);

  // Current Selected Day's Slots
  const currentDaySlots = useMemo(() => {
    return slotsByDate[selectedDate] || [];
  }, [slotsByDate, selectedDate]);

  const isCurrentDayOnLeave = useMemo(() => {
    return !!leavesByDate[selectedDate] || currentDaySlots.some((s: any) => s.status === 'LEAVE');
  }, [leavesByDate, selectedDate, currentDaySlots]);

  // Time-of-Day Segments for Selected Day
  const morningSlots = useMemo(() => {
    return currentDaySlots.filter((s: any) => {
      const hour = parseInt(s.start_time.split(':')[0], 10);
      return hour < 13;
    });
  }, [currentDaySlots]);

  const afternoonSlots = useMemo(() => {
    return currentDaySlots.filter((s: any) => {
      const hour = parseInt(s.start_time.split(':')[0], 10);
      return hour >= 13 && hour < 17;
    });
  }, [currentDaySlots]);

  const eveningSlots = useMemo(() => {
    return currentDaySlots.filter((s: any) => {
      const hour = parseInt(s.start_time.split(':')[0], 10);
      return hour >= 17;
    });
  }, [currentDaySlots]);

  const handleSlotClick = (slot: any) => {
    if (slot.status === 'LEAVE') {
      toast.error("Doctor is on leave during this slot");
      return;
    }
    if (slot.booked_count >= slot.capacity) {
      toast.error("This slot is already fully booked");
      return;
    }
    setBookingSlot({
      date: selectedDate,
      time: slot.start_time.substring(0, 5)
    });
    setIsBookingModalOpen(true);
  };

  const handleBookingConfirm = async (formData: any) => {
    try {
      const payload = {
        appointment_date: formData.date,
        start_time: formData.time,
        doctor_id: selectedDoctorId,
        doctor_name_snapshot: activeDoctor?.name || 'Doctor',
        type: formData.speciality || 'Consultation',
        status: 'Scheduled',
        visit_reason: formData.visitReason || formData.speciality || 'Consultation',
        notes: formData.visitReason || '',
        patient_name_snapshot: formData.name,
        patient_phone_snapshot: formData.phone,
        patient_email_snapshot: formData.email,
        patient_age_snapshot: formData.age,
        sex_snapshot: formData.sex,
        source: 'Schedule View'
      };

      await api.createAppointment(payload);
      toast.success("Appointment booked successfully!");
      setIsBookingModalOpen(false);
      if (selectedDoctorId) fetchData(selectedDoctorId);
    } catch (err: any) {
      console.error("Booking error", err);
      toast.error(err?.message || "Failed to book slot");
    }
  };

  // Open Leave / Day Customization Modal
  const handleOpenLeaveModal = (dateStr: string) => {
    setLeaveModalDate(dateStr);
    setLeaveReason(leavesByDate[dateStr]?.reason || 'Doctor on Leave');
    setLeaveType(leavesByDate[dateStr]?.leave_type || 'Full Day');
    setIsLeaveModalOpen(true);
  };

  const handleToggleLeave = async () => {
    if (!selectedDoctorId) return;
    setSubmittingLeave(true);
    const existingLeave = leavesByDate[leaveModalDate];

    try {
      if (existingLeave) {
        // Remove Leave
        await api.removeDoctorLeave(selectedDoctorId, leaveModalDate);
        toast.success(`Leave removed for ${leaveModalDate}`);
      } else {
        // Apply Leave
        await api.setDoctorLeave(selectedDoctorId, leaveModalDate, leaveType, leaveReason);
        toast.success(`Doctor marked on leave for ${leaveModalDate}`);
      }
      setIsLeaveModalOpen(false);
      fetchData(selectedDoctorId);
    } catch (err: any) {
      console.error("Leave error", err);
      toast.error(err?.message || "Failed to update leave status");
    } finally {
      setSubmittingLeave(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-5 animate-fadeIn pb-12">
      {/* Top Header & Tab Navigation */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary flex-shrink-0">
            <CalendarIcon size={22} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-brand-textPrimary tracking-tight">
              Doctor Schedules & Clinical Roster
            </h1>
            <p className="text-xs text-brand-textSecondary mt-0.5">
              Live consultation calendar, multi-shift availability, and day-wise leaves
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-brand-bg p-1 rounded-xl border border-brand-border self-start md:self-auto">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'calendar' ? 'bg-brand-primary text-white shadow-xs' : 'text-brand-textSecondary hover:text-brand-textPrimary'
            }`}
          >
            <CalendarDays size={14} />
            <span>Calendar & Slots</span>
          </button>
          
          {(userRole === 'Admin' || userRole === 'Super Admin' || userRole === 'Doctor') && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'settings' ? 'bg-brand-primary text-white shadow-xs' : 'text-brand-textSecondary hover:text-brand-textPrimary'
              }`}
            >
              <Settings size={14} />
              <span>Shift Rules (Template)</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'settings' ? (
        <DoctorScheduleSettings 
          userRole={userRole} 
          currentUser={currentUser} 
          onNavigateToCalendar={(docId) => {
            setSelectedDoctorId(docId);
            setActiveTab('calendar');
          }}
        />
      ) : (
        <>
          {/* Consultant Horizontal Selector Strip */}
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-3 sm:p-4 shadow-2xs">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-textSecondary border-r border-brand-border pr-3 flex-shrink-0">
                <Stethoscope size={15} className="text-brand-primary" />
                <span>Consultant:</span>
              </div>

              {doctors.map((doctor) => {
                const isSelected = doctor.id === selectedDoctorId;
                return (
                  <button
                    key={doctor.id}
                    onClick={() => setSelectedDoctorId(doctor.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                      isSelected
                        ? 'bg-brand-primary text-white shadow-xs scale-100'
                        : 'bg-brand-bg hover:bg-brand-border/40 text-brand-textPrimary border border-brand-border/60'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white animate-pulse' : 'bg-emerald-500'}`} />
                    <span>{formatDoctorName(doctor.name)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* View Mode & Date Navigation Toolbar */}
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* View Mode Toggle: Day / Week / Month */}
            <div className="flex items-center bg-brand-bg p-1 rounded-xl border border-brand-border self-start sm:self-auto">
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  viewMode === 'day' ? 'bg-brand-surface text-brand-primary shadow-2xs border border-brand-border' : 'text-brand-textSecondary'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  viewMode === 'week' ? 'bg-brand-surface text-brand-primary shadow-2xs border border-brand-border' : 'text-brand-textSecondary'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  viewMode === 'month' ? 'bg-brand-surface text-brand-primary shadow-2xs border border-brand-border' : 'text-brand-textSecondary'
                }`}
              >
                Month
              </button>
            </div>

            {/* Date Navigator */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (viewMode === 'day') {
                    const prev = new Date(selectedDate);
                    prev.setDate(prev.getDate() - 1);
                    setSelectedDate(formatLocalDate(prev));
                  } else if (viewMode === 'week') {
                    setWeekOffset(w => w - 1);
                  } else {
                    setMonthOffset(m => m - 1);
                  }
                }}
                className="w-8 h-8 rounded-lg bg-brand-bg hover:bg-brand-border border border-brand-border flex items-center justify-center text-brand-textPrimary transition-all shadow-2xs"
                title="Previous"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="text-xs font-extrabold text-brand-textPrimary px-3 min-w-36 text-center">
                {viewMode === 'day' && new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                {viewMode === 'week' && weekRangeLabel}
                {viewMode === 'month' && monthLabel}
              </span>

              <button
                onClick={() => {
                  if (viewMode === 'day') {
                    const next = new Date(selectedDate);
                    next.setDate(next.getDate() + 1);
                    setSelectedDate(formatLocalDate(next));
                  } else if (viewMode === 'week') {
                    setWeekOffset(w => w + 1);
                  } else {
                    setMonthOffset(m => m + 1);
                  }
                }}
                className="w-8 h-8 rounded-lg bg-brand-bg hover:bg-brand-border border border-brand-border flex items-center justify-center text-brand-textPrimary transition-all shadow-2xs"
                title="Next"
              >
                <ChevronRight size={16} />
              </button>

              <button
                onClick={() => {
                  setSelectedDate(todayStr);
                  setWeekOffset(0);
                  setMonthOffset(0);
                }}
                className="px-2.5 py-1 text-[11px] font-bold text-brand-primary hover:bg-brand-primary/10 rounded-lg border border-brand-primary/20 transition-all ml-1"
              >
                Today
              </button>
            </div>
          </div>

          {/* MAIN CALENDAR DISPLAY */}
          {loading ? (
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-16 flex flex-col items-center justify-center gap-3 text-brand-textSecondary shadow-2xs">
              <RefreshCw className="animate-spin text-brand-primary" size={24} />
              <p className="text-xs font-semibold">Loading consultation slots...</p>
            </div>
          ) : viewMode === 'week' ? (
            /* WEEK VIEW: 7-DAY MATRIX + DAY SLOTS */
            <div className="space-y-5">
              {/* 7-Day Card Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                {currentWeekDays.map((day) => {
                  const isSelected = day.dateStr === selectedDate;
                  return (
                    <div
                      key={day.dateStr}
                      onClick={() => setSelectedDate(day.dateStr)}
                      className={`cursor-pointer rounded-2xl p-3.5 border transition-all flex flex-col justify-between min-h-[100px] ${
                        isSelected
                          ? 'bg-brand-primary text-white border-brand-primary shadow-md scale-[1.02]'
                          : day.isLeave
                          ? 'bg-red-50/50 border-red-200 hover:border-red-300 text-brand-textPrimary'
                          : 'bg-brand-surface hover:border-brand-primary/40 border-brand-border text-brand-textPrimary'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${isSelected ? 'text-white/80' : 'text-brand-textSecondary'}`}>
                          {day.dayName}
                        </span>
                        {day.isToday && (
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-brand-primary/10 text-brand-primary'}`}>
                            Today
                          </span>
                        )}
                      </div>

                      <div className="my-1">
                        <span className={`text-xl font-extrabold ${isSelected ? 'text-white' : 'text-brand-textPrimary'}`}>
                          {day.dayNum}
                        </span>
                        <span className={`text-[11px] ml-1 ${isSelected ? 'text-white/75' : 'text-brand-textSecondary'}`}>
                          {day.monthName}
                        </span>
                      </div>

                      {/* Capacity badge */}
                      <div>
                        {day.isLeave ? (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-block ${isSelected ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'}`}>
                            On Leave
                          </span>
                        ) : day.totalSlots === 0 ? (
                          <span className={`text-[10px] font-medium ${isSelected ? 'text-white/60' : 'text-brand-textSecondary'}`}>
                            Off
                          </span>
                        ) : (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-block ${isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'}`}>
                            {day.availableCount} open ({day.totalSlots} total)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Day Slot Container */}
              <SelectedDaySlotBoard
                selectedDate={selectedDate}
                isLeave={isCurrentDayOnLeave}
                activeDoctor={activeDoctor}
                morningSlots={morningSlots}
                afternoonSlots={afternoonSlots}
                eveningSlots={eveningSlots}
                totalSlots={currentDaySlots.length}
                onSlotClick={handleSlotClick}
                onOpenLeaveModal={() => handleOpenLeaveModal(selectedDate)}
              />
            </div>
          ) : viewMode === 'month' ? (
            /* MONTH VIEW: 30-DAY GRID */
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-xs space-y-4">
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-brand-textSecondary border-b border-brand-border pb-2">
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
                <div>Sun</div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {monthGridDays.map((cell) => {
                  if (cell.isPadding) {
                    return <div key={cell.key} className="min-h-[85px] bg-brand-bg/30 rounded-xl border border-transparent" />;
                  }

                  const isSelected = cell.dateStr === selectedDate;
                  return (
                    <div
                      key={cell.key}
                      onClick={() => {
                        setSelectedDate(cell.dateStr!);
                        setViewMode('day');
                      }}
                      className={`min-h-[85px] p-2 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-brand-primary bg-brand-primary/10 shadow-xs'
                          : cell.isLeave
                          ? 'bg-red-50/50 border-red-200 hover:border-red-300'
                          : cell.totalSlots > 0
                          ? 'bg-brand-surface hover:border-brand-primary/40 border-brand-border'
                          : 'bg-brand-bg/40 border-brand-border/60 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-extrabold ${cell.isToday ? 'bg-brand-primary text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]' : 'text-brand-textPrimary'}`}>
                          {cell.day}
                        </span>
                        {cell.isLeave && <Palmtree size={12} className="text-red-500" />}
                      </div>

                      <div className="mt-1">
                        {cell.isLeave ? (
                          <span className="text-[9px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                            Leave
                          </span>
                        ) : cell.totalSlots > 0 ? (
                          <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/50">
                            {cell.availableSlots} Slots
                          </div>
                        ) : (
                          <span className="text-[9px] text-brand-textSecondary">Off</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* DAY VIEW */
            <SelectedDaySlotBoard
              selectedDate={selectedDate}
              isLeave={isCurrentDayOnLeave}
              activeDoctor={activeDoctor}
              morningSlots={morningSlots}
              afternoonSlots={afternoonSlots}
              eveningSlots={eveningSlots}
              totalSlots={currentDaySlots.length}
              onSlotClick={handleSlotClick}
              onOpenLeaveModal={() => handleOpenLeaveModal(selectedDate)}
            />
          )}
        </>
      )}

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <BookAppointmentModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          onConfirm={handleBookingConfirm}
          initialDate={bookingSlot?.date}
          initialTime={bookingSlot?.time}
          selectedDoctor={activeDoctor}
        />
      )}

      {/* Leave / Day Override Modal */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-brand-surface border border-brand-border rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div className="flex items-center gap-2 text-brand-textPrimary font-bold text-base">
                <Palmtree className="text-amber-500" size={20} />
                <span>Day Override & Leave Management</span>
              </div>
              <button
                onClick={() => setIsLeaveModalOpen(false)}
                className="text-brand-textSecondary hover:text-brand-textPrimary"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div>
              <p className="text-xs text-brand-textSecondary">
                Target Date: <span className="font-bold text-brand-textPrimary">{leaveModalDate}</span>
              </p>
              <p className="text-xs text-brand-textSecondary mt-0.5">
                Doctor: <span className="font-bold text-brand-textPrimary">{formatDoctorName(activeDoctor?.name)}</span>
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-brand-textPrimary mb-1">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border rounded-xl px-3 py-2 text-xs font-bold text-brand-textPrimary outline-none focus:border-brand-primary"
                >
                  <option value="Full Day">Full Day Off</option>
                  <option value="Morning Shift">Morning Shift Only</option>
                  <option value="Evening Shift">Evening Shift Only</option>
                  <option value="Emergency">Emergency Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-textPrimary mb-1">Reason / Note</label>
                <input
                  type="text"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="e.g. Attending Medical Conference, Vacation"
                  className="w-full bg-brand-bg border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-textPrimary outline-none focus:border-brand-primary"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-brand-border flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsLeaveModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-brand-textSecondary hover:bg-brand-bg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleLeave}
                disabled={submittingLeave}
                className="bg-brand-primary hover:bg-brand-primaryDark text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
              >
                {submittingLeave ? 'Saving...' : leavesByDate[leaveModalDate] ? 'Remove Leave' : 'Confirm Leave'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Subcomponent: Selected Day Slot Board
const SelectedDaySlotBoard: React.FC<{
  selectedDate: string;
  isLeave: boolean;
  activeDoctor: any;
  morningSlots: any[];
  afternoonSlots: any[];
  eveningSlots: any[];
  totalSlots: number;
  onSlotClick: (slot: any) => void;
  onOpenLeaveModal: () => void;
}> = ({
  selectedDate,
  isLeave,
  activeDoctor,
  morningSlots,
  afternoonSlots,
  eveningSlots,
  totalSlots,
  onSlotClick,
  onOpenLeaveModal
}) => {
  const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
      {/* Day Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-brand-border">
        <div>
          <h2 className="text-base font-extrabold text-brand-textPrimary flex items-center gap-2">
            <Clock className="text-brand-primary" size={18} />
            <span>Consultations for {formattedDate}</span>
          </h2>
          <p className="text-xs text-brand-textSecondary mt-0.5">
            {totalSlots} total generated slots for {activeDoctor?.name ? `Dr. ${activeDoctor.name.replace(/^Dr\.\s*/i, '')}` : 'Doctor'}
          </p>
        </div>

        <button
          onClick={onOpenLeaveModal}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 self-start sm:self-auto ${
            isLeave 
              ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' 
              : 'bg-brand-bg text-brand-textPrimary border-brand-border hover:border-brand-primary/40'
          }`}
        >
          <Palmtree size={14} className={isLeave ? 'text-red-500' : 'text-amber-500'} />
          <span>{isLeave ? 'Doctor On Leave (Edit)' : 'Mark Day as Leave'}</span>
        </button>
      </div>

      {isLeave ? (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-500">
            <Palmtree size={24} />
          </div>
          <h3 className="text-sm font-bold text-brand-textPrimary">Doctor is On Leave for This Day</h3>
          <p className="text-xs text-brand-textSecondary max-w-sm">
            Consultation slots are blocked and inactive. Click "Doctor On Leave (Edit)" above to resume schedule.
          </p>
        </div>
      ) : totalSlots === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-bg border border-brand-border flex items-center justify-center text-brand-textSecondary">
            <CalendarIcon size={24} />
          </div>
          <h3 className="text-sm font-bold text-brand-textPrimary">No Active Shifts for this Day</h3>
          <p className="text-xs text-brand-textSecondary max-w-sm">
            No working hours or consultation slots were configured for this day in the shift template.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Morning Section */}
          {morningSlots.length > 0 && (
            <SlotSection
              title="Morning Sessions"
              icon={<Sunrise size={16} className="text-amber-500" />}
              slots={morningSlots}
              onSlotClick={onSlotClick}
            />
          )}

          {/* Afternoon Section */}
          {afternoonSlots.length > 0 && (
            <SlotSection
              title="Afternoon Sessions"
              icon={<Sun size={16} className="text-amber-600" />}
              slots={afternoonSlots}
              onSlotClick={onSlotClick}
            />
          )}

          {/* Evening Section */}
          {eveningSlots.length > 0 && (
            <SlotSection
              title="Evening Sessions"
              icon={<Sunset size={16} className="text-purple-500" />}
              slots={eveningSlots}
              onSlotClick={onSlotClick}
            />
          )}
        </div>
      )}
    </div>
  );
};

// Slot Grid Section
const SlotSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  slots: any[];
  onSlotClick: (slot: any) => void;
}> = ({ title, icon, slots, onSlotClick }) => {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 text-xs font-bold text-brand-textPrimary">
        {icon}
        <span>{title}</span>
        <span className="text-[10px] text-brand-textSecondary font-medium">({slots.length} slots)</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {slots.map((slot) => {
          const isBooked = slot.booked_count >= slot.capacity;
          const isLeave = slot.status === 'LEAVE';
          const startTime = slot.start_time.substring(0, 5);
          const endTime = slot.end_time.substring(0, 5);

          return (
            <button
              key={slot.id || `${slot.slot_date}-${slot.start_time}`}
              onClick={() => onSlotClick(slot)}
              disabled={isBooked || isLeave}
              className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                isLeave
                  ? 'bg-red-50 border-red-200 text-red-500 cursor-not-allowed opacity-60'
                  : isBooked
                  ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary font-bold cursor-not-allowed'
                  : 'bg-brand-surface hover:bg-brand-primary/5 hover:border-brand-primary border-brand-border text-brand-textPrimary shadow-2xs hover:shadow-xs active:scale-95'
              }`}
            >
              <span className="text-xs font-extrabold">{startTime}</span>
              <span className="text-[10px] text-brand-textSecondary mt-0.5">{endTime}</span>
              <span className={`text-[9px] font-bold mt-1 px-1.5 py-0.2 rounded-full ${
                isLeave ? 'bg-red-100 text-red-700' : isBooked ? 'bg-brand-primary text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {isLeave ? 'Leave' : isBooked ? 'Booked' : 'Open'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
