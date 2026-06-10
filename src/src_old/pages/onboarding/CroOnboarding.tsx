import React from "react";
import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { motion } from 'motion/react';
import { AlertCircle, Building2 } from 'lucide-react';

export function CroOnboarding() {
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    organizationName: '',
    clinicName: '',
    experienceYears: '',
    doctorsManaged: '',
    workflowType: 'hybrid' // Default
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
          role: 'cro',
          data: formData,
          completed: true
        }
      ]);

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    await refreshProfile(); // Triggers navigation to dashboard
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 flex justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">CRO Setup</h2>
            <p className="text-sm text-slate-500">Configure clinic defaults</p>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Organization Name</label>
            <input required type="text" value={formData.organizationName} onChange={e => setFormData({...formData, organizationName: e.target.value})} className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500" placeholder="e.g. HealthCorp Inc" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Clinic Name</label>
            <input required type="text" value={formData.clinicName} onChange={e => setFormData({...formData, clinicName: e.target.value})} className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500" placeholder="e.g. City Maternity Center" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Yrs Experience</label>
              <input required type="number" min="0" value={formData.experienceYears} onChange={e => setFormData({...formData, experienceYears: e.target.value})} className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Doctors Managed</label>
              <input required type="number" min="1" value={formData.doctorsManaged} onChange={e => setFormData({...formData, doctorsManaged: e.target.value})} className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Workflow Type</label>
            <select value={formData.workflowType} onChange={e => setFormData({...formData, workflowType: e.target.value})} className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white">
              <option value="hybrid">Hybrid (Rules + Manual)</option>
              <option value="manual">Manual Assignment Only</option>
              <option value="automated">Strict Automated Routing</option>
            </select>
          </div>

          <Button type="submit" disabled={loading} className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 py-3 rounded-xl border-none">
            {loading ? 'Saving Pipeline...' : 'Complete Initialization'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
