import React from "react";
import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { motion } from 'motion/react';
import { AlertCircle, HeartPulse } from 'lucide-react';

export function NurseOnboarding() {
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    qualification: '',
    experienceYears: '',
    specialization: 'General',
    languagesKnown: ''
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
          role: 'nurse',
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
          <div className="bg-amber-100 p-3 rounded-lg text-amber-600">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Nurse Profile</h2>
            <p className="text-sm text-slate-500">Triage capabilities setup</p>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Highest Qualification</label>
            <input required type="text" value={formData.qualification} onChange={e => setFormData({...formData, qualification: e.target.value})} className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500" placeholder="e.g. B.Sc Nursing, ANM" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Yrs Experience</label>
              <input required type="number" min="0" value={formData.experienceYears} onChange={e => setFormData({...formData, experienceYears: e.target.value})} className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Specialization</label>
              <select value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white">
                <option value="General">General</option>
                <option value="Fertility">Fertility</option>
                <option value="Pregnancy">Pregnancy</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Languages Known (comma separated)</label>
            <input required type="text" value={formData.languagesKnown} onChange={e => setFormData({...formData, languagesKnown: e.target.value})} className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500" placeholder="English, Spanish, Hindi..." />
          </div>

          <Button type="submit" disabled={loading} className="w-full mt-6 bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-600/20 py-3 rounded-xl border-none text-white">
            {loading ? 'Submitting...' : 'Complete Nurse Profile'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
