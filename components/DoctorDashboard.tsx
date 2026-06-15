
import React, { useState } from 'react';
import {
    Calendar, Clock, Activity, Stethoscope, ClipboardList,
    CheckCircle2, Users, ArrowUpRight
} from 'lucide-react';
import { Appointment, Patient } from '../types';

// Mock Data (Fallback if no props)
// Mocks removed to rely on API data

export const DoctorDashboard: React.FC<{ appointments?: Appointment[]; onPatientSelect: (patient: Patient, initialTab?: string) => void }> = ({ appointments = [], onPatientSelect }) => {

    const handleStartConsultation = (appt: Appointment) => {
        // Construct minimal patient object from appointment to initiate profile
        // The profile component will fetch full details using patient.id
        const patient: any = {
            id: appt.patientId || 'unknown',
            name: appt.patientName,
            assignedDoctorId: appt.doctorId
        };
        onPatientSelect(patient, 'consultation');
    };

    const displayAppointments = appointments;

    // Metrics
    const total = displayAppointments.length;
    const checkedIn = displayAppointments.filter(a => a.status === 'Checked-In').length;
    const completed = displayAppointments.filter(a => a.status === 'Completed' || a.status === 'Done').length;

    return (
        <div className="p-6 space-y-8 bg-brand-bg min-h-full">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-brand-textPrimary flex items-center">
                        <Activity className="mr-3 text-brand-primary" /> Overview
                    </h1>
                    <p className="text-brand-textSecondary mt-1">Today's clinical summary</p>
                </div>
                <div className="bg-brand-surface px-4 py-2 rounded-xl border border-brand-border shadow-sm flex items-center">
                    <Clock size={18} className="text-brand-primary mr-2" />
                    <span className="font-bold text-brand-textPrimary">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border shadow-sm flex items-center justify-between group hover:border-brand-primary/50 transition-colors">
                    <div>
                        <p className="text-brand-textSecondary text-sm font-medium mb-1">Total Appointments</p>
                        <h3 className="text-3xl font-bold text-brand-textPrimary">{total}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Calendar size={24} />
                    </div>
                </div>

                <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border shadow-sm flex items-center justify-between group hover:border-brand-primary/50 transition-colors">
                    <div>
                        <p className="text-brand-textSecondary text-sm font-medium mb-1">Waiting Now</p>
                        <h3 className="text-3xl font-bold text-brand-primary">{checkedIn}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Users size={24} />
                    </div>
                </div>

                <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border shadow-sm flex items-center justify-between group hover:border-brand-primary/50 transition-colors">
                    <div>
                        <p className="text-brand-textSecondary text-sm font-medium mb-1">Assessed</p>
                        <h3 className="text-3xl font-bold text-emerald-600">{completed}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <CheckCircle2 size={24} />
                    </div>
                </div>
            </div>

            {/* Full Width Schedule List */}
            <div className="bg-brand-surface rounded-2xl shadow-sm border border-brand-border overflow-hidden flex flex-col">
                <div className="p-6 border-b border-brand-border flex justify-between items-center bg-brand-bg/50">
                    <h2 className="font-bold text-lg text-brand-textPrimary flex items-center">
                        <ClipboardList size={20} className="mr-2 text-brand-primary" /> Today's Schedule
                    </h2>
                    <button className="text-xs font-bold text-brand-primary border border-brand-primary/20 px-3 py-1.5 rounded-lg hover:bg-brand-primary/5 transition-colors">
                        View All
                    </button>
                </div>
                <div className="divide-y divide-brand-border">
                    {displayAppointments.map((appt) => (
                        <div key={appt.id} className="p-6 hover:bg-brand-bg/50 transition-colors flex flex-col md:flex-row items-center justify-between gap-4 group">

                            {/* Time & Avatar */}
                            <div className="flex items-center w-full md:w-auto space-x-6">
                                <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-2xl border shrink-0 ${appt.status === 'Checked-In' ? 'bg-brand-primary text-brand-bg border-brand-primary shadow-lg shadow-brand-primary/20' : 'bg-brand-bg border-brand-border text-brand-textSecondary'}`}>
                                    <span className="text-xs font-bold uppercase tracking-wider opacity-80">{appt.time.split(' ')[1]}</span>
                                    <span className="text-2xl font-bold">{appt.time.split(' ')[0]}</span>
                                </div>

                                <div>
                                    <h3 className="font-bold text-brand-textPrimary text-xl mb-1">{appt.patientName}</h3>
                                    <div className="flex items-center text-sm text-brand-textSecondary space-x-3">
                                        <span className="flex items-center font-medium bg-brand-bg px-2 py-1 rounded text-xs border border-brand-border">
                                            <Stethoscope size={12} className="mr-1.5 text-brand-primary" />
                                            {appt.type}
                                        </span>
                                        {appt.status === 'Checked-In' && (
                                            <span className="font-bold text-brand-primary animate-pulse flex items-center">
                                                <span className="w-2 h-2 rounded-full bg-brand-primary mr-1.5"></span>
                                                Checked In
                                            </span>
                                        )}
                                        {appt.status === 'Completed' && (
                                            <span className="font-bold text-emerald-600 flex items-center">
                                                <CheckCircle2 size={12} className="mr-1.5" />
                                                Done
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center w-full md:w-auto justify-end gap-3">
                                {appt.status === 'Completed' ? (
                                    <button
                                        disabled
                                        className="px-6 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-400 font-bold flex items-center cursor-not-allowed"
                                    >
                                        <CheckCircle2 size={18} className="mr-2" /> Completed
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleStartConsultation(appt)}
                                        className={`px-8 py-3 font-bold rounded-xl shadow-sm flex items-center transition-all active:scale-95 ${appt.status === 'Checked-In'
                                            ? 'bg-brand-primary hover:bg-brand-secondary text-white shadow-brand-primary/30 hover:shadow-brand-primary/40'
                                            : 'bg-brand-surface border border-brand-border text-brand-textSecondary hover:border-brand-primary hover:text-brand-primary'
                                            }`}
                                    >
                                        <div className="flex items-center">
                                            <span>{appt.status === 'Checked-In' ? 'Start Consult' : 'View Profile'}</span>
                                            {appt.status === 'Checked-In' && <ArrowUpRight size={18} className="ml-2" />}
                                        </div>
                                    </button>
                                )}
                            </div>

                        </div>
                    ))}
                    {displayAppointments.length === 0 && (
                        <div className="p-12 text-center text-brand-textSecondary">
                            <p>No appointments scheduled for today.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
