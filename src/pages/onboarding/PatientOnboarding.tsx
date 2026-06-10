import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Baby, Activity, Heart, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/button';

export function PatientOnboarding() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    journey_stage: 'pregnant' as 'trying_to_conceive' | 'pregnant' | 'postpartum',
    pregnancy_stage: 12,
    medical_history: [] as string[]
  });

  const handleComplete = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      // 1. Create/Update patient record in dfo_patients
      const { error: patientError } = await supabase
        .from('dfo_patients')
        .upsert({
          auth_user_id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          phone_number: user.user_metadata?.phone || '0000000000',
          email: user.email,
          journey_stage: formData.journey_stage,
          pregnancy_stage: formData.journey_stage === 'pregnant' ? formData.pregnancy_stage : 0,
          medical_history: formData.medical_history,
          updated_at: new Date().toISOString()
        });

      if (patientError) throw patientError;

      // 2. Update user role to patient in users table
      await supabase
        .from('users')
        .update({ role: 'patient' })
        .eq('id', user.id);

      await refreshProfile();
      navigate('/dashboard/patient');
    } catch (err) {
      console.error("Onboarding failed:", err);
      alert("Failed to save onboarding data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sky-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl w-full bg-white rounded-xl shadow-bespoke p-10 overflow-hidden relative"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-slate-100">
           <motion.div 
             initial={{ width: '0%' }}
             animate={{ width: `${(step / 3) * 100}%` }}
             className="h-full bg-sky-500"
           />
        </div>

        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-sky-50 rounded-3xl flex items-center justify-center text-sky-600 mx-auto mb-6">
                 <Heart className="w-10 h-10" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-3">Your Journey Starts Here</h1>
              <p className="text-slate-500 font-bold">Where are you in your maternal journey today?</p>
            </div>

            <div className="grid gap-4">
              {[
                { id: 'trying_to_conceive', label: 'Trying to Conceive', icon: Activity },
                { id: 'pregnant', label: 'Currently Pregnant', icon: Baby },
                { id: 'postpartum', label: 'Postpartum Care', icon: Heart }
              ].map((stage) => (
                <button
                  key={stage.id}
                  onClick={() => setFormData({ ...formData, journey_stage: stage.id as any })}
                  className={`flex items-center justify-between p-6 rounded-xl border-2 transition-all group ${
                    formData.journey_stage === stage.id 
                      ? 'border-sky-500 bg-sky-50/50 shadow-lg' 
                      : 'border-slate-100 hover:border-sky-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${formData.journey_stage === stage.id ? 'bg-sky-500 text-white' : 'bg-slate-50 text-slate-400 group-hover:text-sky-500'}`}>
                      <stage.icon className="w-6 h-6" />
                    </div>
                    <span className={`font-black uppercase tracking-widest text-[10px] ${formData.journey_stage === stage.id ? 'text-sky-900' : 'text-slate-500'}`}>
                      {stage.label}
                    </span>
                  </div>
                  {formData.journey_stage === stage.id && <CheckCircle2 className="w-5 h-5 text-sky-500" />}
                </button>
              ))}
            </div>

            <Button onClick={() => setStep(2)} className="w-full bg-slate-900 h-16 rounded-3xl text-sm font-black uppercase tracking-widest shadow-xl">
              Next Step
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
             <div className="text-center">
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-3">Maternal Progress</h1>
                <p className="text-slate-500 font-bold">How many weeks along are you?</p>
             </div>

             <div className="space-y-12 py-8">
                <div className="relative">
                   <div className="flex justify-between mb-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Start</span>
                      <span className="text-2xl font-black text-sky-600">{formData.pregnancy_stage} Weeks</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase">Term</span>
                   </div>
                   <input 
                     type="range" 
                     min="1" 
                     max="42" 
                     value={formData.pregnancy_stage}
                     onChange={(e) => setFormData({ ...formData, pregnancy_stage: parseInt(e.target.value) })}
                     className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-sky-500"
                   />
                </div>
             </div>

             <div className="flex gap-4">
                <Button variant="ghost" onClick={() => setStep(1)} className="flex-1 h-16 rounded-3xl font-black uppercase tracking-widest">Back</Button>
                <Button onClick={() => setStep(3)} className="flex-[2] bg-slate-900 h-16 rounded-3xl text-sm font-black uppercase tracking-widest shadow-xl">Continue</Button>
             </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
             <div className="text-center">
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-3">Clinical History</h1>
                <p className="text-slate-500 font-bold">Any existing conditions we should be aware of?</p>
             </div>

             <div className="grid grid-cols-2 gap-3">
                {['Diabetes', 'Hypertension', 'PCOS', 'Thyroid', 'Anemia', 'None'].map((condition) => (
                  <button
                    key={condition}
                    onClick={() => {
                        if (condition === 'None') setFormData({ ...formData, medical_history: [] });
                        else if (formData.medical_history.includes(condition)) setFormData({ ...formData, medical_history: formData.medical_history.filter(c => c !== condition) });
                        else setFormData({ ...formData, medical_history: [...formData.medical_history, condition] });
                    }}
                    className={`p-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                        formData.medical_history.includes(condition) || (condition === 'None' && formData.medical_history.length === 0)
                        ? 'border-sky-500 bg-sky-50 text-sky-700'
                        : 'border-slate-100 text-slate-400 hover:border-sky-200'
                    }`}
                  >
                    {condition}
                  </button>
                ))}
             </div>

             <div className="flex gap-4">
                <Button variant="ghost" onClick={() => setStep(2)} className="flex-1 h-16 rounded-3xl font-black uppercase tracking-widest">Back</Button>
                <Button 
                  onClick={handleComplete} 
                  disabled={loading}
                  className="flex-[2] bg-sky-500 h-16 rounded-3xl text-sm font-black uppercase tracking-widest shadow-xl hover:bg-sky-600 transition-all"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Start My Journey'}
                </Button>
             </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
