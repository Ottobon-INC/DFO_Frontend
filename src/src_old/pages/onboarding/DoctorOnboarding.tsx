import React from "react";
import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { motion } from 'motion/react';
import { AlertCircle, Stethoscope } from 'lucide-react';

export function DoctorOnboarding() {
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    medicalDegree: '',
    specialization: '',
    experienceYears: '',
    licenseNumber: '',
    consultationType: 'Hybrid'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError(null);

    const { error: insertError } = await supabase
      .from('onboarding_data')
      .insert([
        {
          user_id: user.id,
          role: 'doctor',
          data: formData,
          completed: true
        }
      ]);

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    await refreshProfile();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 flex justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-rose-100 p-3 rounded-lg text-rose-600">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Doctor Profile</h2>
            <p className="text-sm text-slate-500">Provide medical credentials</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Medical Degree</label>
            <input required type="text" value={formData.medicalDegree} onChange={e => setFormData({...formData, medicalDegree: e.target.value})} className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500" placeholder="e.g. MBBS, MD, DO" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Specialization</label>
            <input required type="text" value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500" placeholder="e.g. Obstetrics & Gynecology" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Yrs Practice</label>
              <input required type="number" min="0" value={formData.experienceYears} onChange={e => setFormData({...formData, experienceYears: e.target.value})} className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Consultation</label>
              <select value={formData.consultationType} onChange={e => setFormData({...formData, consultationType: e.target.value})} className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white">
                <option value="Hybrid">Hybrid</option>
                <option value="Online">Online Only</option>
                <option value="Offline">Offline Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">License Number</label>
            <input required type="text" value={formData.licenseNumber} onChange={e => setFormData({...formData, licenseNumber: e.target.value})} className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500" placeholder="Registration/License No." />
          </div>

          <Button type="submit" disabled={loading} className="w-full mt-6 bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-600/20 py-3 rounded-xl border-none text-white">
            {loading ? 'Submitting...' : 'Complete Doctor Setup'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
