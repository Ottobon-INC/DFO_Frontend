import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronLeft, ChevronRight, Printer, Save, Plus, Trash2,
  User, Heart, TestTube, Microscope, FileText, Activity,
  ClipboardList, Eye, Baby, Dna, Stethoscope, Clipboard, BarChart3, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../../services/api';

// ─── Types ───────────────────────────────────────────────────
interface ObstetricRow {
  no: string; year: string; ga: string; delivery: string;
  sexWt: string; prevIvf: string; complications: string;
}

interface ProcedureRow {
  year: string; place: string; findings: string;
}

interface SemenRow {
  date: string; tc: string; motility: string; morphology: string; comment: string;
}

interface LabRow {
  testName: string; values: string[];
}

interface FollicularRow {
  date: string; dayOfCycle: string; rtOvary: string;
  ltOvary: string; et: string; mucus: string; remarks: string;
}

interface ProtocolStep {
  name: string; date: string; completed: boolean; notes: string;
}

// ─── Component ───────────────────────────────────────────────
interface IvfCaseSheetSuiteProps {
  patientId: string;
  patientName?: string;
  patientAge?: string;
  patientGender?: string;
}

export const IvfCaseSheetSuite: React.FC<IvfCaseSheetSuiteProps> = ({
  patientId,
  patientName = '',
  patientAge = '',
  patientGender = ''
}) => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isReadOnly = currentUser?.role === 'frontdesk' || currentUser?.role === 'cro';
  const [currentPage, setCurrentPage] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const tabScrollRef = useRef<HTMLDivElement>(null);

  const isPatientMale = (patientGender || '').toLowerCase() === 'male';

  // ─── Page 1 State: Female Demographics ─────────────────
  const [femName, setFemName] = useState(isPatientMale ? '' : patientName);
  const [femDate, setFemDate] = useState('');
  const [femAge, setFemAge] = useState(isPatientMale ? '' : patientAge);
  const [femEducation, setFemEducation] = useState('');
  const [femOccupation, setFemOccupation] = useState('');
  const [femMaritalLife, setFemMaritalLife] = useState('');
  const [ageOfMenarche, setAgeOfMenarche] = useState('');
  const [periods, setPeriods] = useState('');
  const [lmp, setLmp] = useState('');
  const [flow, setFlow] = useState('');
  const [dysmenorrhoea, setDysmenorrhoea] = useState('');
  const [premenstrualSpotting, setPremenstrualSpotting] = useState('');
  const [intermenstrualBleeding, setIntermenstrualBleeding] = useState('');
  const [bowels, setBowels] = useState('');
  const [consanguinity, setConsanguinity] = useState('');
  const [weightGain, setWeightGain] = useState('');
  const [freqOfIC, setFreqOfIC] = useState('');
  const [dyspareunia, setDyspareunia] = useState('');
  const [lossOfLibido, setLossOfLibido] = useState('');
  const [obstetricRows, setObstetricRows] = useState<ObstetricRow[]>([
    { no: '', year: '', ga: '', delivery: '', sexWt: '', prevIvf: '', complications: '' }
  ]);

  // ─── Page 2 State: Past History + Physical Exam ────────
  const [pastMedical, setPastMedical] = useState('');
  const [drugAllergy, setDrugAllergy] = useState('');
  const [familyHistory, setFamilyHistory] = useState('');
  const [surgicalHistory, setSurgicalHistory] = useState('');
  const [treatmentHistory, setTreatmentHistory] = useState('');
  const [prevIvfDetails, setPrevIvfDetails] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examHT, setExamHT] = useState('');
  const [examWT, setExamWT] = useState('');
  const [examBMI, setExamBMI] = useState('');
  const [examBP, setExamBP] = useState('');
  const [acne, setAcne] = useState('');
  const [hirsutism, setHirsutism] = useState('');
  const [acanthosis, setAcanthosis] = useState('');
  const [breasts, setBreasts] = useState('');
  const [galactorrhoea, setGalactorrhoea] = useState('');
  const [fgScore, setFgScore] = useState('');

  // ─── Page 3 State: HSG / Hysteroscopy / Laparoscopy ────
  const [hsgRows, setHsgRows] = useState<ProcedureRow[]>([{ year: '', place: '', findings: '' }]);
  const [hysteroscopyRows, setHysteroscopyRows] = useState<ProcedureRow[]>([{ year: '', place: '', findings: '' }]);
  const [laparoscopyRows, setLaparoscopyRows] = useState<ProcedureRow[]>([{ year: '', place: '', findings: '' }]);

  // ─── Page 4 State: Female Lab Panel ────────────────────
  const [labDates, setLabDates] = useState<string[]>(['', '', '', '', '', '']);
  const [femaleLabRows, setFemaleLabRows] = useState<LabRow[]>([
    { testName: 'TSH', values: ['', '', '', '', '', ''] },
    { testName: 'PRL', values: ['', '', '', '', '', ''] },
    { testName: 'AMH', values: ['', '', '', '', '', ''] },
    { testName: 'FSH', values: ['', '', '', '', '', ''] },
    { testName: 'LH', values: ['', '', '', '', '', ''] },
    { testName: 'GTT', values: ['', '', '', '', '', ''] },
    { testName: 'FBS', values: ['', '', '', '', '', ''] },
    { testName: 'PPBS', values: ['', '', '', '', '', ''] },
    { testName: 'HBA1C', values: ['', '', '', '', '', ''] },
    { testName: 'HB', values: ['', '', '', '', '', ''] },
    { testName: 'HIV', values: ['', '', '', '', '', ''] },
    { testName: 'HbsAg', values: ['', '', '', '', '', ''] },
    { testName: 'HCV', values: ['', '', '', '', '', ''] },
    { testName: 'VDRL', values: ['', '', '', '', '', ''] },
    { testName: 'Bl.Group', values: ['', '', '', '', '', ''] },
    { testName: 'Karyotype', values: ['', '', '', '', '', ''] },
  ]);
  const [antithyroidAntibodies, setAntithyroidAntibodies] = useState('');
  const [antimicrosomialAntibodies, setAntimicrosomialAntibodies] = useState('');

  // ─── Page 5 State: Baseline USG ────────────────────────
  const [usgDate, setUsgDate] = useState('');
  const [dayOfMC, setDayOfMC] = useState('');
  const [uterusType, setUterusType] = useState('');
  const [uterusSize, setUterusSize] = useState('');
  const [uterusVol, setUterusVol] = useState('');
  const [emzj, setEmzj] = useState('');
  const [usg3d4d, setUsg3d4d] = useState('');
  const [rtUTRI, setRtUTRI] = useState('');
  const [rtUTPI, setRtUTPI] = useState('');
  const [rtUTComment, setRtUTComment] = useState('');
  const [ltUTRI, setLtUTRI] = useState('');
  const [ltUTPI, setLtUTPI] = useState('');
  const [ltUTComment, setLtUTComment] = useState('');
  const [rtOvarySize, setRtOvarySize] = useState('');
  const [rtOvaryVol, setRtOvaryVol] = useState('');
  const [rtOvaryAccess, setRtOvaryAccess] = useState('');
  const [rtOvaryPAF, setRtOvaryPAF] = useState('');
  const [rtOvaryComment, setRtOvaryComment] = useState('');
  const [ltOvarySize, setLtOvarySize] = useState('');
  const [ltOvaryVol, setLtOvaryVol] = useState('');
  const [ltOvaryAccess, setLtOvaryAccess] = useState('');
  const [ltOvaryPAF, setLtOvaryPAF] = useState('');
  const [ltOvaryComment, setLtOvaryComment] = useState('');

  // ─── Page 7 State: Male Partner Profile ────────────────
  const [maleName, setMaleName] = useState(isPatientMale ? patientName : '');
  const [maleAge, setMaleAge] = useState(isPatientMale ? patientAge : '');
  const [maleHT, setMaleHT] = useState('');
  const [maleWT, setMaleWT] = useState('');
  const [maleBMI, setMaleBMI] = useState('');
  const [maleOccupation, setMaleOccupation] = useState('');
  const [smoking, setSmoking] = useState('');
  const [alcohol, setAlcohol] = useState('');
  const [panparag, setPanparag] = useState('');
  const [retrogradeEjaculation, setRetrogradeEjaculation] = useState('');
  const [prematureEjaculation, setPrematureEjaculation] = useState('');
  const [erectileDysfunction, setErectileDysfunction] = useState('');
  const [maleLossOfLibido, setMaleLossOfLibido] = useState('');
  const [maleMedicalHistory, setMaleMedicalHistory] = useState('');
  const [maleSurgicalHistory, setMaleSurgicalHistory] = useState('');
  const [maleTreatmentHistory, setMaleTreatmentHistory] = useState('');
  const [familyHT, setFamilyHT] = useState('');
  const [familyDM, setFamilyDM] = useState('');
  const [familyHypothyroid, setFamilyHypothyroid] = useState('');
  const [urologistOpinion, setUrologistOpinion] = useState('');

  // ─── Page 8 State: Semen Analysis ─────────────────────
  const [semenCount, setSemenCount] = useState('');
  const [progressiveA, setProgressiveA] = useState({ pct: '', conc: '' });
  const [sluggishB, setSluggishB] = useState({ pct: '', conc: '' });
  const [nonProgressiveC, setNonProgressiveC] = useState({ pct: '', conc: '' });
  const [staticD, setStaticD] = useState({ pct: '', conc: '' });
  const [typeAB, setTypeAB] = useState({ pct: '', conc: '' });
  const [morphNormal, setMorphNormal] = useState({ pct: '', conc: '' });
  const [morphAbnormal, setMorphAbnormal] = useState({ pct: '', conc: '' });
  const [morphHead, setMorphHead] = useState({ pct: '', conc: '' });
  const [morphMid, setMorphMid] = useState({ pct: '', conc: '' });
  const [morphTail, setMorphTail] = useState({ pct: '', conc: '' });
  const [teratoIndex, setTeratoIndex] = useState({ pct: '', conc: '' });

  // ─── Page 9 State: DNA Fragmentation ──────────────────
  const [fragmented, setFragmented] = useState('');
  const [nonFragmented, setNonFragmented] = useState('');
  const [dfiValue, setDfiValue] = useState('');
  const [dnaImpression, setDnaImpression] = useState('');

  // ─── Page 10 State: Male Investigations ────────────────
  const [maleUSGDate, setMaleUSGDate] = useState('');
  const [testicularBiopsyDate, setTesticularBiopsyDate] = useState('');
  const [maleSemenRows, setMaleSemenRows] = useState<SemenRow[]>([
    { date: '', tc: '', motility: '', morphology: '', comment: '' }
  ]);
  const [maleLabDates, setMaleLabDates] = useState<string[]>(['', '', '', '', '', '']);
  const [maleLabRows, setMaleLabRows] = useState<LabRow[]>([
    { testName: 'FBS', values: ['', '', '', '', '', ''] },
    { testName: 'PPBS', values: ['', '', '', '', '', ''] },
    { testName: 'GTT', values: ['', '', '', '', '', ''] },
    { testName: 'HBA1C', values: ['', '', '', '', '', ''] },
    { testName: 'TSH', values: ['', '', '', '', '', ''] },
    { testName: 'TESTO', values: ['', '', '', '', '', ''] },
    { testName: 'HB', values: ['', '', '', '', '', ''] },
    { testName: 'FSH', values: ['', '', '', '', '', ''] },
    { testName: 'LH', values: ['', '', '', '', '', ''] },
    { testName: 'PRL', values: ['', '', '', '', '', ''] },
    { testName: 'HIV', values: ['', '', '', '', '', ''] },
    { testName: 'HCV', values: ['', '', '', '', '', ''] },
    { testName: 'HBSAG', values: ['', '', '', '', '', ''] },
    { testName: 'VDRL', values: ['', '', '', '', '', ''] },
    { testName: 'Karyotyping', values: ['', '', '', '', '', ''] },
    { testName: 'Bl Group', values: ['', '', '', '', '', ''] },
  ]);

  // ─── Page 11 State: Clinical Summary ──────────────────
  const [summaryFemName, setSummaryFemName] = useState('');
  const [summaryFemAge, setSummaryFemAge] = useState('');
  const [summaryFemBMI, setSummaryFemBMI] = useState('');
  const [summaryMaleName, setSummaryMaleName] = useState('');
  const [summaryMaleAge, setSummaryMaleAge] = useState('');
  const [summaryMaleBMI, setSummaryMaleBMI] = useState('');
  const [tubalFactor, setTubalFactor] = useState('');
  const [ovarianFactor, setOvarianFactor] = useState('');
  const [uterineFactor, setUterineFactor] = useState('');
  const [unexplainedInfertility, setUnexplainedInfertility] = useState('');
  const [hormonesComment, setHormonesComment] = useState('');
  const [saCasaComments, setSaCasaComments] = useState('');
  const [dnaFragSummary, setDnaFragSummary] = useState('');
  const [medicalDisorder, setMedicalDisorder] = useState('');

  // ─── Page 12 State: Protocol Tracker ──────────────────
  const [protocolSteps, setProtocolSteps] = useState<ProtocolStep[]>([
    { name: 'IVF Profile', date: '', completed: false, notes: '' },
    { name: 'Counselling', date: '', completed: false, notes: '' },
    { name: 'Basal Scan', date: '', completed: false, notes: '' },
    { name: '3D Gynaec + Doppler', date: '', completed: false, notes: '' },
    { name: 'Semen Freezing', date: '', completed: false, notes: '' },
    { name: 'DNA Fragmentation', date: '', completed: false, notes: '' },
    { name: 'Tab to Continue', date: '', completed: false, notes: '' },
    { name: 'Hysteroscopy', date: '', completed: false, notes: '' },
    { name: 'Downregulation', date: '', completed: false, notes: '' },
    { name: 'Review', date: '', completed: false, notes: '' },
    { name: 'Stimulation', date: '', completed: false, notes: '' },
  ]);
  const [counsellingDate, setCounsellingDate] = useState('');
  const [costExplained, setCostExplained] = useState(false);
  const [riskExplained, setRiskExplained] = useState(false);
  const [successRateExplained, setSuccessRateExplained] = useState(false);

  // ─── Page 13 State: Follicular Monitoring ─────────────
  const [fmDate, setFmDate] = useState('');
  const [fmWt, setFmWt] = useState('');
  const [fmBMI, setFmBMI] = useState('');
  const [fmDiagnosis, setFmDiagnosis] = useState('');
  const [fmProtocol, setFmProtocol] = useState('');
  const [follicularRows, setFollicularRows] = useState<FollicularRow[]>([
    { date: '', dayOfCycle: '', rtOvary: '', ltOvary: '', et: '', mucus: '', remarks: '' },
    { date: '', dayOfCycle: '', rtOvary: '', ltOvary: '', et: '', mucus: '', remarks: '' },
    { date: '', dayOfCycle: '', rtOvary: '', ltOvary: '', et: '', mucus: '', remarks: '' },
  ]);

  // ─── Page Config ───────────────────────────────────────
  const TOTAL_PAGES = 12; // We merged page 6 into page 3

  const pageConfig = [
    { num: 1, title: 'Female Profile & History', shortTitle: 'Female Profile', icon: <User size={13} /> },
    { num: 2, title: 'Past History & Physical Exam', shortTitle: 'History & Exam', icon: <Stethoscope size={13} /> },
    { num: 3, title: 'HSG / Hysteroscopy / Laparoscopy', shortTitle: 'Procedures', icon: <Eye size={13} /> },
    { num: 4, title: 'Female Diagnostic Lab Panel', shortTitle: 'Female Labs', icon: <TestTube size={13} /> },
    { num: 5, title: 'Baseline Pelvic USG', shortTitle: 'Baseline USG', icon: <Activity size={13} /> },
    { num: 6, title: 'Male Partner Profile', shortTitle: 'Male Partner', icon: <User size={13} /> },
    { num: 7, title: 'Semen Analysis & Tracking', shortTitle: 'Semen Analysis', icon: <Microscope size={13} /> },
    { num: 8, title: 'Sperm DNA Fragmentation (DFI)', shortTitle: 'Sperm DFI', icon: <Dna size={13} /> },
    { num: 9, title: 'Male Endocrine & Lab Investigations', shortTitle: 'Male Labs', icon: <TestTube size={13} /> },
    { num: 10, title: 'Clinical Summary & Treatment Plan', shortTitle: 'Summary & Plan', icon: <Clipboard size={13} /> },
    { num: 11, title: 'IVF / ICSI Protocol Tracker', shortTitle: 'Protocol Track', icon: <ClipboardList size={13} /> },
    { num: 12, title: 'Follicular Monitoring & Trigger Tracker', shortTitle: 'Follicular Scan', icon: <BarChart3 size={13} /> },
  ];

  // ─── Helpers ───────────────────────────────────────────
  const addObstetricRow = () => setObstetricRows(prev => [...prev, { no: '', year: '', ga: '', delivery: '', sexWt: '', prevIvf: '', complications: '' }]);
  const removeObstetricRow = (i: number) => setObstetricRows(prev => prev.filter((_, idx) => idx !== i));

  const addProcedureRow = (type: 'hsg' | 'hysteroscopy' | 'laparoscopy') => {
    const newRow = { year: '', place: '', findings: '' };
    if (type === 'hsg') setHsgRows(prev => [...prev, newRow]);
    else if (type === 'hysteroscopy') setHysteroscopyRows(prev => [...prev, newRow]);
    else setLaparoscopyRows(prev => [...prev, newRow]);
  };

  const addFollicularRow = () => setFollicularRows(prev => [...prev, { date: '', dayOfCycle: '', rtOvary: '', ltOvary: '', et: '', mucus: '', remarks: '' }]);
  const removeFollicularRow = (i: number) => setFollicularRows(prev => prev.filter((_, idx) => idx !== i));

  const addMaleSemenRow = () => setMaleSemenRows(prev => [...prev, { date: '', tc: '', motility: '', morphology: '', comment: '' }]);

  const addLabRow = (setRows: React.Dispatch<React.SetStateAction<LabRow[]>>) => {
    setRows(prev => [...prev, { testName: '', values: Array(prev[0]?.values?.length || labDates.length || 6).fill('') }]);
  };

  const addLabColumn = (setDates: React.Dispatch<React.SetStateAction<string[]>>, setRows: React.Dispatch<React.SetStateAction<LabRow[]>>) => {
    setDates(prev => [...prev, '']);
    setRows(prev => prev.map(row => ({ ...row, values: [...row.values, ''] })));
  };

  const addProtocolStep = () => {
    setProtocolSteps(prev => [...prev, { name: '', date: '', completed: false, notes: '' }]);
  };

  const updateLabValue = (rows: LabRow[], setRows: React.Dispatch<React.SetStateAction<LabRow[]>>, rowIdx: number, colIdx: number, value: string) => {
    setRows(prev => prev.map((row, i) => i === rowIdx ? { ...row, values: row.values.map((v, j) => j === colIdx ? value : v) } : row));
  };

  // ─── Shared Styles ────────────────────────────────────
  const inputCls = "w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md focus:ring-1 focus:ring-sky-400 focus:border-sky-400 outline-none bg-white transition-all placeholder:text-slate-300";
  const labelCls = "text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1 block";
  const sectionCls = "bg-white rounded-xl border border-slate-200 p-4 mb-4 shadow-xs";
  const headerCls = "text-sm font-bold text-slate-800 mb-3 flex items-center gap-2 pb-2 border-b border-slate-100";

  // ─── Page Renderers ───────────────────────────────────────
  

  // Helper to format date strings for HTML5 <input type="date" />
  const formatDateForInput = (val: any): string => {
    if (!val) return '';
    if (typeof val !== 'string') return '';
    if (val.includes('T')) return val.split('T')[0];
    return val.slice(0, 10);
  };

  // Load data on mount
  const fetchData = React.useCallback(async () => {
    if (!patientId) return;
    try {
      setIsLoading(true);
      const res = await api.getIvfCaseSheet(patientId);
      const d = res?.data?.cycle_id ? res.data : (res?.cycle_id ? res : (res?.data || res));
      if (d && (d.cycle_id || d.femaleProfile || d.maleProfile)) {
        if (d.femaleProfile) {
          setFemName(d.femaleProfile.name !== undefined && d.femaleProfile.name !== null ? d.femaleProfile.name : (isPatientMale ? '' : patientName));
          setFemDate(formatDateForInput(d.femaleProfile.date));
          setFemAge(d.femaleProfile.age !== undefined && d.femaleProfile.age !== null ? d.femaleProfile.age : (isPatientMale ? '' : patientAge));
          setFemEducation(d.femaleProfile.education || '');
          setFemOccupation(d.femaleProfile.occupation || '');
          setFemMaritalLife(d.femaleProfile.marital_life_years || '');
          setAgeOfMenarche(d.femaleProfile.age_of_menarche || '');
          setPeriods(d.femaleProfile.periods || '');
          setLmp(formatDateForInput(d.femaleProfile.lmp));
          setFlow(d.femaleProfile.flow || '');
          setDysmenorrhoea(d.femaleProfile.dysmenorrhoea || '');
          setPremenstrualSpotting(d.femaleProfile.premenstrual_spotting || '');
          setIntermenstrualBleeding(d.femaleProfile.intermenstrual_bleeding || '');
          setBowels(d.femaleProfile.bowels || '');
          setConsanguinity(d.femaleProfile.consanguinity || '');
          setWeightGain(d.femaleProfile.weight_gain || '');
          setFreqOfIC(d.femaleProfile.freq_of_ic || '');
          setDyspareunia(d.femaleProfile.dyspareunia || '');
          setLossOfLibido(d.femaleProfile.loss_of_libido || '');
          if (d.femaleProfile.obstetric_history && Array.isArray(d.femaleProfile.obstetric_history) && d.femaleProfile.obstetric_history.length > 0) {
            setObstetricRows(d.femaleProfile.obstetric_history);
          }
          setPastMedical(d.femaleProfile.past_medical || '');
          setDrugAllergy(d.femaleProfile.drug_allergy || '');
          setFamilyHistory(d.femaleProfile.family_history || '');
          setSurgicalHistory(d.femaleProfile.surgical_history || '');
          setTreatmentHistory(d.femaleProfile.treatment_history || '');
          setPrevIvfDetails(d.femaleProfile.prev_ivf_details || '');
          setExamDate(formatDateForInput(d.femaleProfile.exam_date));
          setExamHT(d.femaleProfile.exam_ht || '');
          setExamWT(d.femaleProfile.exam_wt || '');
          setExamBMI(d.femaleProfile.exam_bmi || '');
          setExamBP(d.femaleProfile.exam_bp || '');
          setAcne(d.femaleProfile.acne || '');
          setHirsutism(d.femaleProfile.hirsutism || '');
          setAcanthosis(d.femaleProfile.acanthosis || '');
          setBreasts(d.femaleProfile.breasts || '');
          setGalactorrhoea(d.femaleProfile.galactorrhoea || '');
          setFgScore(d.femaleProfile.fg_score || '');
        }

        if (d.procedures) {
          if (d.procedures.hsg_rows && Array.isArray(d.procedures.hsg_rows) && d.procedures.hsg_rows.length > 0) setHsgRows(d.procedures.hsg_rows);
          if (d.procedures.hysteroscopy_rows && Array.isArray(d.procedures.hysteroscopy_rows) && d.procedures.hysteroscopy_rows.length > 0) setHysteroscopyRows(d.procedures.hysteroscopy_rows);
          if (d.procedures.laparoscopy_rows && Array.isArray(d.procedures.laparoscopy_rows) && d.procedures.laparoscopy_rows.length > 0) setLaparoscopyRows(d.procedures.laparoscopy_rows);
        }

        if (d.femaleLabPanels) {
          if (d.femaleLabPanels.dates && Array.isArray(d.femaleLabPanels.dates) && d.femaleLabPanels.dates.length > 0) setLabDates(d.femaleLabPanels.dates);
          if (d.femaleLabPanels.lab_rows && Array.isArray(d.femaleLabPanels.lab_rows) && d.femaleLabPanels.lab_rows.length > 0) setFemaleLabRows(d.femaleLabPanels.lab_rows);
          setAntithyroidAntibodies(d.femaleLabPanels.antithyroid_antibodies || '');
          setAntimicrosomialAntibodies(d.femaleLabPanels.antimicrosomial_antibodies || '');
        }

        if (d.baselineUsg) {
          setUsgDate(formatDateForInput(d.baselineUsg.usg_date));
          setDayOfMC(d.baselineUsg.day_of_mc || '');
          setUterusType(d.baselineUsg.uterus_type || '');
          setUterusSize(d.baselineUsg.uterus_size || '');
          setUterusVol(d.baselineUsg.uterus_vol || '');
          setEmzj(d.baselineUsg.emzj || '');
          setUsg3d4d(d.baselineUsg.usg_3d_4d || '');
          setRtUTRI(d.baselineUsg.rt_ut_ri || '');
          setRtUTPI(d.baselineUsg.rt_ut_pi || '');
          setRtUTComment(d.baselineUsg.rt_ut_comment || '');
          setLtUTRI(d.baselineUsg.lt_ut_ri || '');
          setLtUTPI(d.baselineUsg.lt_ut_pi || '');
          setLtUTComment(d.baselineUsg.lt_ut_comment || '');
          setRtOvarySize(d.baselineUsg.rt_ovary_size || '');
          setRtOvaryVol(d.baselineUsg.rt_ovary_vol || '');
          setRtOvaryAccess(d.baselineUsg.rt_ovary_access || '');
          setRtOvaryPAF(d.baselineUsg.rt_ovary_paf || '');
          setRtOvaryComment(d.baselineUsg.rt_ovary_comment || '');
          setLtOvarySize(d.baselineUsg.lt_ovary_size || '');
          setLtOvaryVol(d.baselineUsg.lt_ovary_vol || '');
          setLtOvaryAccess(d.baselineUsg.lt_ovary_access || '');
          setLtOvaryPAF(d.baselineUsg.lt_ovary_paf || '');
          setLtOvaryComment(d.baselineUsg.lt_ovary_comment || '');
        }

        if (d.maleProfile) {
          setMaleName(d.maleProfile.name !== undefined && d.maleProfile.name !== null ? d.maleProfile.name : (!isPatientMale ? '' : patientName));
          setMaleAge(d.maleProfile.age !== undefined && d.maleProfile.age !== null ? d.maleProfile.age : (!isPatientMale ? '' : patientAge));
          setMaleHT(d.maleProfile.height || '');
          setMaleWT(d.maleProfile.weight || '');
          setMaleBMI(d.maleProfile.bmi || '');
          setMaleOccupation(d.maleProfile.occupation || '');
          setSmoking(d.maleProfile.smoking || '');
          setAlcohol(d.maleProfile.alcohol || '');
          setPanparag(d.maleProfile.pan_parag || '');
          setRetrogradeEjaculation(d.maleProfile.retrograde_ejaculation || '');
          setPrematureEjaculation(d.maleProfile.premature_ejaculation || '');
          setErectileDysfunction(d.maleProfile.erectile_dysfunction || '');
          setMaleLossOfLibido(d.maleProfile.loss_of_libido || '');
          setMaleMedicalHistory(d.maleProfile.medical_history || '');
          setMaleSurgicalHistory(d.maleProfile.surgical_history || '');
          setMaleTreatmentHistory(d.maleProfile.treatment_history || '');
          setFamilyHT(d.maleProfile.family_ht || '');
          setFamilyDM(d.maleProfile.family_dm || '');
          setFamilyHypothyroid(d.maleProfile.family_hypothyroid || '');
          setUrologistOpinion(d.maleProfile.urologist_opinion || '');
        }

        if (d.semenAnalysis) {
          setSemenCount(d.semenAnalysis.semen_count || '');
          setProgressiveA({ pct: d.semenAnalysis.progressive_a_pct || '', conc: d.semenAnalysis.progressive_a_conc || '' });
          setSluggishB({ pct: d.semenAnalysis.sluggish_b_pct || '', conc: d.semenAnalysis.sluggish_b_conc || '' });
          setNonProgressiveC({ pct: d.semenAnalysis.non_progressive_c_pct || '', conc: d.semenAnalysis.non_progressive_c_conc || '' });
          setStaticD({ pct: d.semenAnalysis.static_d_pct || '', conc: d.semenAnalysis.static_d_conc || '' });
          setTypeAB({ pct: d.semenAnalysis.type_ab_pct || '', conc: d.semenAnalysis.type_ab_conc || '' });
          setMorphNormal({ pct: d.semenAnalysis.morph_normal_pct || '', conc: d.semenAnalysis.morph_normal_conc || '' });
          setMorphAbnormal({ pct: d.semenAnalysis.morph_abnormal_pct || '', conc: d.semenAnalysis.morph_abnormal_conc || '' });
          setMorphHead({ pct: d.semenAnalysis.morph_head_pct || '', conc: d.semenAnalysis.morph_head_conc || '' });
          setMorphMid({ pct: d.semenAnalysis.morph_mid_pct || '', conc: d.semenAnalysis.morph_mid_conc || '' });
          setMorphTail({ pct: d.semenAnalysis.morph_tail_pct || '', conc: d.semenAnalysis.morph_tail_conc || '' });
          setTeratoIndex({ pct: d.semenAnalysis.terato_index_pct || '', conc: d.semenAnalysis.terato_index_conc || '' });
          setFragmented(d.semenAnalysis.fragmented || '');
          setNonFragmented(d.semenAnalysis.non_fragmented || '');
          setDfiValue(d.semenAnalysis.dfi_value || '');
          setDnaImpression(d.semenAnalysis.dna_impression || '');
          setMaleUSGDate(formatDateForInput(d.semenAnalysis.male_usg_date));
          setTesticularBiopsyDate(formatDateForInput(d.semenAnalysis.testicular_biopsy_date));
          if (d.semenAnalysis.semen_comparison_rows && Array.isArray(d.semenAnalysis.semen_comparison_rows) && d.semenAnalysis.semen_comparison_rows.length > 0) {
            setMaleSemenRows(d.semenAnalysis.semen_comparison_rows);
          }
        }

        if (d.maleLabPanels) {
          if (d.maleLabPanels.dates && Array.isArray(d.maleLabPanels.dates) && d.maleLabPanels.dates.length > 0) setMaleLabDates(d.maleLabPanels.dates);
          if (d.maleLabPanels.lab_rows && Array.isArray(d.maleLabPanels.lab_rows) && d.maleLabPanels.lab_rows.length > 0) setMaleLabRows(d.maleLabPanels.lab_rows);
        }

        if (d.treatmentTracking) {
          setTubalFactor(d.treatmentTracking.tubal_factor || '');
          setOvarianFactor(d.treatmentTracking.ovarian_factor || '');
          setUterineFactor(d.treatmentTracking.uterine_factor || '');
          setUnexplainedInfertility(d.treatmentTracking.unexplained_infertility || '');
          setHormonesComment(d.treatmentTracking.hormones_comment || '');
          setSaCasaComments(d.treatmentTracking.sa_casa_comments || '');
          setDnaFragSummary(d.treatmentTracking.dna_frag_summary || '');
          setMedicalDisorder(d.treatmentTracking.medical_disorder || '');
          if (d.treatmentTracking.protocol_steps && Array.isArray(d.treatmentTracking.protocol_steps) && d.treatmentTracking.protocol_steps.length > 0) {
            setProtocolSteps(d.treatmentTracking.protocol_steps);
          }
          setCounsellingDate(formatDateForInput(d.treatmentTracking.counselling_date));
          setCostExplained(!!d.treatmentTracking.cost_explained);
          setRiskExplained(!!d.treatmentTracking.risk_explained);
          setSuccessRateExplained(!!d.treatmentTracking.success_rate_explained);
          setFmDate(formatDateForInput(d.treatmentTracking.fm_date));
          setFmWt(d.treatmentTracking.fm_wt || '');
          setFmBMI(d.treatmentTracking.fm_bmi || '');
          setFmDiagnosis(d.treatmentTracking.fm_diagnosis || '');
          setFmProtocol(d.treatmentTracking.fm_protocol || '');
          if (d.treatmentTracking.follicular_rows && Array.isArray(d.treatmentTracking.follicular_rows) && d.treatmentTracking.follicular_rows.length > 0) {
            setFollicularRows(d.treatmentTracking.follicular_rows);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load IVF case sheet", e);
    } finally {
      setIsLoading(false);
    }
  }, [patientId, isPatientMale, patientName, patientAge]);

  React.useEffect(() => {
    fetchData();
  }, [patientId, fetchData]);

  const handleSave = async () => {
    if (!patientId) {
      alert("No patient ID found.");
      return;
    }
    try {
      setIsSaving(true);
      const payload = {
        femaleProfile: {
          name: femName,
          date: femDate || null,
          age: femAge,
          education: femEducation,
          occupation: femOccupation,
          marital_life_years: femMaritalLife,
          age_of_menarche: ageOfMenarche,
          periods,
          lmp: lmp || null,
          flow,
          dysmenorrhoea,
          premenstrual_spotting: premenstrualSpotting,
          intermenstrual_bleeding: intermenstrualBleeding,
          bowels,
          consanguinity,
          weight_gain: weightGain,
          freq_of_ic: freqOfIC,
          dyspareunia,
          loss_of_libido: lossOfLibido,
          obstetric_history: obstetricRows,
          past_medical: pastMedical,
          drug_allergy: drugAllergy,
          family_history: familyHistory,
          surgical_history: surgicalHistory,
          treatment_history: treatmentHistory,
          prev_ivf_details: prevIvfDetails,
          exam_date: examDate || null,
          exam_ht: examHT,
          exam_wt: examWT,
          exam_bmi: examBMI,
          exam_bp: examBP,
          acne,
          hirsutism,
          acanthosis,
          breasts,
          galactorrhoea,
          fg_score: fgScore,
        },
        procedures: {
          hsg_rows: hsgRows,
          hysteroscopy_rows: hysteroscopyRows,
          laparoscopy_rows: laparoscopyRows,
        },
        femaleLabPanels: {
          panel_type: 'FEMALE' as const,
          dates: labDates,
          lab_rows: femaleLabRows,
          antithyroid_antibodies: antithyroidAntibodies,
          antimicrosomial_antibodies: antimicrosomialAntibodies,
        },
        baselineUsg: {
          usg_date: usgDate || null,
          day_of_mc: dayOfMC,
          uterus_type: uterusType,
          uterus_size: uterusSize,
          uterus_vol: uterusVol,
          emzj,
          usg_3d_4d: usg3d4d,
          rt_ut_ri: rtUTRI,
          rt_ut_pi: rtUTPI,
          rt_ut_comment: rtUTComment,
          lt_ut_ri: ltUTRI,
          lt_ut_pi: ltUTPI,
          lt_ut_comment: ltUTComment,
          rt_ovary_size: rtOvarySize,
          rt_ovary_vol: rtOvaryVol,
          rt_ovary_access: rtOvaryAccess,
          rt_ovary_paf: rtOvaryPAF,
          rt_ovary_comment: rtOvaryComment,
          lt_ovary_size: ltOvarySize,
          lt_ovary_vol: ltOvaryVol,
          lt_ovary_access: ltOvaryAccess,
          lt_ovary_paf: ltOvaryPAF,
          lt_ovary_comment: ltOvaryComment,
        },
        maleProfile: {
          name: maleName,
          age: maleAge,
          height: maleHT,
          weight: maleWT,
          bmi: maleBMI,
          occupation: maleOccupation,
          smoking,
          alcohol,
          pan_parag: panparag,
          retrograde_ejaculation: retrogradeEjaculation,
          premature_ejaculation: prematureEjaculation,
          erectile_dysfunction: erectileDysfunction,
          loss_of_libido: maleLossOfLibido,
          medical_history: maleMedicalHistory,
          surgical_history: maleSurgicalHistory,
          treatment_history: maleTreatmentHistory,
          family_ht: familyHT,
          family_dm: familyDM,
          family_hypothyroid: familyHypothyroid,
          urologist_opinion: urologistOpinion,
        },
        semenAnalysis: {
          semen_count: semenCount,
          progressive_a_pct: progressiveA.pct,
          progressive_a_conc: progressiveA.conc,
          sluggish_b_pct: sluggishB.pct,
          sluggish_b_conc: sluggishB.conc,
          non_progressive_c_pct: nonProgressiveC.pct,
          non_progressive_c_conc: nonProgressiveC.conc,
          static_d_pct: staticD.pct,
          static_d_conc: staticD.conc,
          type_ab_pct: typeAB.pct,
          type_ab_conc: typeAB.conc,
          morph_normal_pct: morphNormal.pct,
          morph_normal_conc: morphNormal.conc,
          morph_abnormal_pct: morphAbnormal.pct,
          morph_abnormal_conc: morphAbnormal.conc,
          morph_head_pct: morphHead.pct,
          morph_head_conc: morphHead.conc,
          morph_mid_pct: morphMid.pct,
          morph_mid_conc: morphMid.conc,
          morph_tail_pct: morphTail.pct,
          morph_tail_conc: morphTail.conc,
          terato_index_pct: teratoIndex.pct,
          terato_index_conc: teratoIndex.conc,
          fragmented,
          non_fragmented: nonFragmented,
          dfi_value: dfiValue,
          dna_impression: dnaImpression,
          male_usg_date: maleUSGDate || null,
          testicular_biopsy_date: testicularBiopsyDate || null,
          semen_comparison_rows: maleSemenRows,
        },
        maleLabPanels: {
          panel_type: 'MALE' as const,
          dates: maleLabDates,
          lab_rows: maleLabRows,
        },
        treatmentTracking: {
          tubal_factor: tubalFactor,
          ovarian_factor: ovarianFactor,
          uterine_factor: uterineFactor,
          unexplained_infertility: unexplainedInfertility,
          hormones_comment: hormonesComment,
          sa_casa_comments: saCasaComments,
          dna_frag_summary: dnaFragSummary,
          medical_disorder: medicalDisorder,
          protocol_steps: protocolSteps,
          counselling_date: counsellingDate || null,
          cost_explained: costExplained,
          risk_explained: riskExplained,
          success_rate_explained: successRateExplained,
          fm_date: fmDate || null,
          fm_wt: fmWt,
          fm_bmi: fmBMI,
          fm_diagnosis: fmDiagnosis,
          fm_protocol: fmProtocol,
          follicular_rows: follicularRows,
        },
      };

      await api.saveIvfCaseSheet(patientId, payload);
      await fetchData();
      toast.success('IVF Case Sheet saved successfully!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to save IVF Case Sheet');
    } finally {
      setIsSaving(false);
    }
  };

  const renderPage1 = () => (
    <div className="space-y-4">
      {/* Header Fields */}
      <div className={sectionCls}>
        <h3 className={headerCls}><User size={16} className="text-sky-500" /> Female Demographics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><label className={labelCls}>Name</label><textarea value={femName} onChange={e => setFemName(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} placeholder="Patient name" /></div>
          <div><label className={labelCls}>Date</label><input type="date" value={femDate} onChange={e => setFemDate(e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Age</label><textarea value={femAge} onChange={e => setFemAge(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} placeholder="Age" /></div>
          <div><label className={labelCls}>Education</label><textarea value={femEducation} onChange={e => setFemEducation(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} placeholder="Education" /></div>
          <div><label className={labelCls}>Occupation</label><textarea value={femOccupation} onChange={e => setFemOccupation(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} placeholder="Occupation" /></div>
          <div><label className={labelCls}>Marital Life</label><textarea value={femMaritalLife} onChange={e => setFemMaritalLife(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} placeholder="Years" /></div>
        </div>
      </div>

      {/* Menstrual History */}
      <div className={sectionCls}>
        <h3 className={headerCls}><Heart size={16} className="text-pink-500" /> Menstrual History</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div><label className={labelCls}>Age of Menarche</label><textarea value={ageOfMenarche} onChange={e => setAgeOfMenarche(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} placeholder="Age" /></div>
          <div><label className={labelCls}>Periods</label>
            <select value={periods} onChange={e => setPeriods(e.target.value)} className={inputCls}>
              <option value="">Select</option><option>Regular</option><option>Irregular</option>
            </select>
          </div>
          <div><label className={labelCls}>LMP</label><input type="date" value={lmp} onChange={e => setLmp(e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Flow</label>
            <select value={flow} onChange={e => setFlow(e.target.value)} className={inputCls}>
              <option value="">Select</option><option>Normal</option><option>Scanty</option><option>Heavy</option>
            </select>
          </div>
          <div><label className={labelCls}>Dysmenorrhoea</label>
            <select value={dysmenorrhoea} onChange={e => setDysmenorrhoea(e.target.value)} className={inputCls}>
              <option value="">Select</option><option>None</option><option>Congestive</option><option>Spasmodic</option>
            </select>
          </div>
          <div><label className={labelCls}>Premenstrual Spotting</label>
            <textarea value={premenstrualSpotting} onChange={e => setPremenstrualSpotting(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} />
          </div>
          <div><label className={labelCls}>Intermenstrual Bleeding</label>
            <textarea value={intermenstrualBleeding} onChange={e => setIntermenstrualBleeding(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} />
          </div>
        </div>
      </div>

      {/* Other Fields */}
      <div className={sectionCls}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div><label className={labelCls}>Bowels</label><textarea value={bowels} onChange={e => setBowels(e.target.value)} className={inputCls + " min-h-[40px] resize-y"} placeholder="" /></div>
          <div><label className={labelCls}>Consanguinity</label>
            <textarea value={consanguinity} onChange={e => setConsanguinity(e.target.value)} className={inputCls + " min-h-[40px] resize-y"} />
          </div>
          <div><label className={labelCls}>Weight Gain</label><textarea value={weightGain} onChange={e => setWeightGain(e.target.value)} className={inputCls + " min-h-[40px] resize-y"} placeholder="" /></div>
        </div>
      </div>

      {/* Sexual History */}
      <div className={sectionCls}>
        <h3 className={headerCls}>Sexual History</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div><label className={labelCls}>Freq of IC</label><textarea value={freqOfIC} onChange={e => setFreqOfIC(e.target.value)} className={inputCls + " min-h-[40px] resize-y"} placeholder="" /></div>
          <div><label className={labelCls}>Dyspareunia</label>
            <textarea value={dyspareunia} onChange={e => setDyspareunia(e.target.value)} className={inputCls + " min-h-[40px] resize-y"} />
          </div>
          <div><label className={labelCls}>Loss of Libido</label>
            <textarea value={lossOfLibido} onChange={e => setLossOfLibido(e.target.value)} className={inputCls + " min-h-[40px] resize-y"} />
          </div>
        </div>
      </div>

      {/* Obstetric History Table */}
      <div className={sectionCls}>
        <h3 className={headerCls}><Baby size={16} className="text-purple-500" /> Obstetric History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-2 py-2 text-left font-bold text-slate-600 border-b">No.</th>
                <th className="px-2 py-2 text-left font-bold text-slate-600 border-b">Year</th>
                <th className="px-2 py-2 text-left font-bold text-slate-600 border-b">GA</th>
                <th className="px-2 py-2 text-left font-bold text-slate-600 border-b">Delivery</th>
                <th className="px-2 py-2 text-left font-bold text-slate-600 border-b">Sex/Wt</th>
                <th className="px-2 py-2 text-left font-bold text-slate-600 border-b">Prev IVF</th>
                <th className="px-2 py-2 text-left font-bold text-slate-600 border-b">Complications</th>
                <th className="px-2 py-2 border-b w-8"></th>
              </tr>
            </thead>
            <tbody>
              {obstetricRows.map((row, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-sky-50/30">
                  {Object.keys(row).map(key => (
                    <td key={key} className="px-1 py-1">
                      <textarea
                        value={row[key as keyof ObstetricRow]}
                        onChange={e => setObstetricRows(prev => prev.map((r, idx) => idx === i ? { ...r, [key]: e.target.value } : r))}
                        className={inputCls + " min-h-[36px] resize-y"}
                      />
                    </td>
                  ))}
                  <td className="px-1 py-1">
                    {obstetricRows.length > 1 && (
                      <button onClick={() => removeObstetricRow(i)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={addObstetricRow} className="mt-2 text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1">
          <Plus size={12} /> Add Row
        </button>
      </div>
    </div>
  );

  const renderPage2 = () => (
    <div className="space-y-4">
      <div className={sectionCls}>
        <h3 className={headerCls}><FileText size={16} className="text-amber-500" /> Past History</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><label className={labelCls}>Past Medical History</label><textarea value={pastMedical} onChange={e => setPastMedical(e.target.value)} className={inputCls + " min-h-[60px] resize-y"} /></div>
          <div><label className={labelCls}>Drug Allergy</label><textarea value={drugAllergy} onChange={e => setDrugAllergy(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
          <div><label className={labelCls}>Family History</label><textarea value={familyHistory} onChange={e => setFamilyHistory(e.target.value)} className={inputCls + " min-h-[60px] resize-y"} /></div>
          <div><label className={labelCls}>Surgical History</label><textarea value={surgicalHistory} onChange={e => setSurgicalHistory(e.target.value)} className={inputCls + " min-h-[60px] resize-y"} /></div>
          <div><label className={labelCls}>Treatment History</label><textarea value={treatmentHistory} onChange={e => setTreatmentHistory(e.target.value)} className={inputCls + " min-h-[60px] resize-y"} /></div>
          <div><label className={labelCls}>Prev IVF Details</label><textarea value={prevIvfDetails} onChange={e => setPrevIvfDetails(e.target.value)} className={inputCls + " min-h-[60px] resize-y"} /></div>
        </div>
      </div>

      <div className={sectionCls}>
        <h3 className={headerCls}><Stethoscope size={16} className="text-emerald-500" /> Physical Examination</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><label className={labelCls}>Exam Date</label><input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>HT (cm)</label><textarea value={examHT} onChange={e => setExamHT(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
          <div><label className={labelCls}>WT (kg)</label><textarea value={examWT} onChange={e => setExamWT(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
          <div><label className={labelCls}>BMI</label><textarea value={examBMI} onChange={e => setExamBMI(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
          <div><label className={labelCls}>BP</label><textarea value={examBP} onChange={e => setExamBP(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
          <div><label className={labelCls}>Acne</label><textarea value={acne} onChange={e => setAcne(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
          <div><label className={labelCls}>Hirsutism</label>
            <select value={hirsutism} onChange={e => setHirsutism(e.target.value)} className={inputCls}>
              <option value="">Select</option><option>Yes</option><option>No</option>
            </select>
          </div>
          <div><label className={labelCls}>Acanthosis</label>
            <select value={acanthosis} onChange={e => setAcanthosis(e.target.value)} className={inputCls}>
              <option value="">Select</option><option>Yes</option><option>No</option>
            </select>
          </div>
          <div><label className={labelCls}>Breasts</label><textarea value={breasts} onChange={e => setBreasts(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
          <div><label className={labelCls}>Galactorrhoea</label>
            <select value={galactorrhoea} onChange={e => setGalactorrhoea(e.target.value)} className={inputCls}>
              <option value="">Select</option><option>Yes</option><option>No</option>
            </select>
          </div>
          <div><label className={labelCls}>FG Score</label><textarea value={fgScore} onChange={e => setFgScore(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
        </div>
      </div>
    </div>
  );

  const renderProcedureTable = (title: string, rows: ProcedureRow[], setRows: React.Dispatch<React.SetStateAction<ProcedureRow[]>>, type: 'hsg' | 'hysteroscopy' | 'laparoscopy') => (
    <div className={sectionCls}>
      <h3 className={headerCls}>{title}</h3>
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50">
            <th className="px-2 py-2 text-left font-bold text-slate-600 border-b">Year</th>
            <th className="px-2 py-2 text-left font-bold text-slate-600 border-b">Place</th>
            <th className="px-2 py-2 text-left font-bold text-slate-600 border-b">Findings</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-100">
              <td className="px-1 py-1"><textarea value={row.year} onChange={e => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, year: e.target.value } : r))} className={inputCls + " min-h-[36px] resize-y"} /></td>
              <td className="px-1 py-1"><textarea value={row.place} onChange={e => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, place: e.target.value } : r))} className={inputCls + " min-h-[36px] resize-y"} /></td>
              <td className="px-1 py-1"><textarea value={row.findings} onChange={e => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, findings: e.target.value } : r))} className={inputCls + " min-h-[36px] resize-y"} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={() => addProcedureRow(type)} className="mt-2 text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1">
        <Plus size={12} /> Add Row
      </button>
    </div>
  );

  const renderPage3 = () => (
    <div className="space-y-4">
      {renderProcedureTable('HSG (Hysterosalpingography)', hsgRows, setHsgRows, 'hsg')}
      {renderProcedureTable('Hysteroscopy', hysteroscopyRows, setHysteroscopyRows, 'hysteroscopy')}
      {renderProcedureTable('Laparoscopy', laparoscopyRows, setLaparoscopyRows, 'laparoscopy')}
    </div>
  );

  const renderLabPanel = (title: string, dates: string[], setDates: React.Dispatch<React.SetStateAction<string[]>>, rows: LabRow[], setRows: React.Dispatch<React.SetStateAction<LabRow[]>>, extra?: React.ReactNode) => (
    <div className={sectionCls}>
      <h3 className={headerCls}><TestTube size={16} className="text-blue-500" /> {title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50">
              <th className="sticky left-0 z-20 bg-slate-50 px-2 py-2 text-left font-bold text-slate-600 border-b min-w-[100px]">Test</th>
              {dates.map((d, i) => (
                <th key={i} className="px-1 py-1 border-b min-w-[80px]">
                  <input type="date" value={d} onChange={e => {
                    const newDates = [...dates]; newDates[i] = e.target.value; setDates(newDates);
                  }} className="text-[10px] w-full border border-slate-200 rounded px-1 py-0.5 focus:ring-1 focus:ring-sky-400 outline-none" />
                </th>
              ))}
              <th className="px-1 py-1 border-b w-8">
                <button onClick={() => addLabColumn(setDates, setRows)} className="text-sky-500 hover:text-sky-600 p-1 flex items-center justify-center w-full" title="Add Date Column">
                  <Plus size={14} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => (
              <tr key={rIdx} className="border-b border-slate-100 hover:bg-sky-50/30">
                <td className="sticky left-0 z-10 bg-white px-2 py-1.5 font-bold text-slate-700 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                  {row.testName ? row.testName : <textarea placeholder="Custom Test" onChange={e => setRows(prev => prev.map((r, idx) => idx === rIdx ? { ...r, testName: e.target.value } : r))} className={inputCls + " min-h-[36px] resize-y"} />}
                </td>
                {row.values.map((val, cIdx) => (
                  <td key={cIdx} className="px-1 py-1 border-l border-slate-100">
                    <textarea value={val} onChange={e => updateLabValue(rows, setRows, rIdx, cIdx, e.target.value)} className={inputCls + " min-h-[36px] resize-y"} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={() => addLabRow(setRows)} className="mt-2 text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1">
          <Plus size={12} /> Add Custom Test
        </button>
      </div>
      {extra}
    </div>
  );

  const renderPage4 = () => (
    <div className="space-y-4">
      {renderLabPanel('Female Hormone & Infection Panel', labDates, setLabDates, femaleLabRows, setFemaleLabRows,
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100">
          <div><label className={labelCls}>Antithyroid Antibodies</label><textarea value={antithyroidAntibodies} onChange={e => setAntithyroidAntibodies(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
          <div><label className={labelCls}>Antimicrosomal Antibodies</label><textarea value={antimicrosomialAntibodies} onChange={e => setAntimicrosomialAntibodies(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
        </div>
      )}
    </div>
  );

  const renderPage5 = () => (
    <div className="space-y-4">
      <div className={sectionCls}>
        <h3 className={headerCls}><Activity size={16} className="text-violet-500" /> Baseline USG Evaluation</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div><label className={labelCls}>Date</label><input type="date" value={usgDate} onChange={e => setUsgDate(e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Day of MC</label><textarea value={dayOfMC} onChange={e => setDayOfMC(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
        </div>

        {/* Uterus */}
        <div className="mb-4">
          <h4 className="text-xs font-bold text-slate-700 mb-2 bg-slate-50 px-2 py-1 rounded">Uterus</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div><label className={labelCls}>Type (AV/MP/RV)</label>
              <select value={uterusType} onChange={e => setUterusType(e.target.value)} className={inputCls}>
                <option value="">Select</option><option>AV</option><option>MP</option><option>RV</option>
              </select>
            </div>
            <div><label className={labelCls}>Size</label><textarea value={uterusSize} onChange={e => setUterusSize(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
            <div><label className={labelCls}>Volume</label><textarea value={uterusVol} onChange={e => setUterusVol(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
            <div><label className={labelCls}>EMZJ</label><textarea value={emzj} onChange={e => setEmzj(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
            <div><label className={labelCls}>3D/4D</label><textarea value={usg3d4d} onChange={e => setUsg3d4d(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
          </div>
        </div>

        {/* Uterine Artery */}
        <div className="mb-4">
          <h4 className="text-xs font-bold text-slate-700 mb-2 bg-slate-50 px-2 py-1 rounded">Uterine Artery</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-sky-600 mb-1">RT Uterine Artery</p>
              <div className="grid grid-cols-3 gap-2">
                <div><label className={labelCls}>RI</label><textarea value={rtUTRI} onChange={e => setRtUTRI(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
                <div><label className={labelCls}>PI</label><textarea value={rtUTPI} onChange={e => setRtUTPI(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
                <div><label className={labelCls}>Comment</label><textarea value={rtUTComment} onChange={e => setRtUTComment(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-sky-600 mb-1">LT Uterine Artery</p>
              <div className="grid grid-cols-3 gap-2">
                <div><label className={labelCls}>RI</label><textarea value={ltUTRI} onChange={e => setLtUTRI(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
                <div><label className={labelCls}>PI</label><textarea value={ltUTPI} onChange={e => setLtUTPI(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
                <div><label className={labelCls}>Comment</label><textarea value={ltUTComment} onChange={e => setLtUTComment(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
              </div>
            </div>
          </div>
        </div>

        {/* Ovaries */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-2 bg-slate-50 px-2 py-1 rounded">RT Ovary</h4>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelCls}>Size</label><textarea value={rtOvarySize} onChange={e => setRtOvarySize(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
              <div><label className={labelCls}>Volume</label><textarea value={rtOvaryVol} onChange={e => setRtOvaryVol(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
              <div><label className={labelCls}>Accessibility</label><textarea value={rtOvaryAccess} onChange={e => setRtOvaryAccess(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
              <div><label className={labelCls}>PAF</label><textarea value={rtOvaryPAF} onChange={e => setRtOvaryPAF(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
              <div className="col-span-2"><label className={labelCls}>Comment</label><textarea value={rtOvaryComment} onChange={e => setRtOvaryComment(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-2 bg-slate-50 px-2 py-1 rounded">LT Ovary</h4>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelCls}>Size</label><textarea value={ltOvarySize} onChange={e => setLtOvarySize(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
              <div><label className={labelCls}>Volume</label><textarea value={ltOvaryVol} onChange={e => setLtOvaryVol(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
              <div><label className={labelCls}>Accessibility</label><textarea value={ltOvaryAccess} onChange={e => setLtOvaryAccess(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
              <div><label className={labelCls}>PAF</label><textarea value={ltOvaryPAF} onChange={e => setLtOvaryPAF(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
              <div className="col-span-2"><label className={labelCls}>Comment</label><textarea value={ltOvaryComment} onChange={e => setLtOvaryComment(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Page 6 = Male Partner (was Page 7 in PDF, Page 6 was dropped)
  const renderPage6 = () => (
    <div className="space-y-4">
      <div className={sectionCls}>
        <h3 className={headerCls}><User size={16} className="text-blue-600" /> Evaluation of Male Partner</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <div><label className={labelCls}>Name</label><textarea value={maleName} onChange={e => setMaleName(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} placeholder="Partner name" /></div>
          <div><label className={labelCls}>Age</label><textarea value={maleAge} onChange={e => setMaleAge(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
          <div><label className={labelCls}>HT (cm)</label><textarea value={maleHT} onChange={e => setMaleHT(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
          <div><label className={labelCls}>WT (kg)</label><textarea value={maleWT} onChange={e => setMaleWT(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
          <div><label className={labelCls}>BMI</label><textarea value={maleBMI} onChange={e => setMaleBMI(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div><label className={labelCls}>Occupation</label><textarea value={maleOccupation} onChange={e => setMaleOccupation(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
          <div><label className={labelCls}>Smoking</label>
            <select value={smoking} onChange={e => setSmoking(e.target.value)} className={inputCls}>
              <option value="">Select</option><option>Yes</option><option>No</option>
            </select>
          </div>
          <div><label className={labelCls}>Alcohol</label>
            <select value={alcohol} onChange={e => setAlcohol(e.target.value)} className={inputCls}>
              <option value="">Select</option><option>Yes</option><option>No</option><option>Occasional</option>
            </select>
          </div>
          <div><label className={labelCls}>Panparag</label>
            <select value={panparag} onChange={e => setPanparag(e.target.value)} className={inputCls}>
              <option value="">Select</option><option>Yes</option><option>No</option>
            </select>
          </div>
        </div>
      </div>

      <div className={sectionCls}>
        <h3 className={headerCls}>Sexual History</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><label className={labelCls}>AN / Retrograde Ejaculation</label>
            <select value={retrogradeEjaculation} onChange={e => setRetrogradeEjaculation(e.target.value)} className={inputCls}>
              <option value="">Select</option><option>Yes</option><option>No</option>
            </select>
          </div>
          <div><label className={labelCls}>Premature Ejaculation</label>
            <select value={prematureEjaculation} onChange={e => setPrematureEjaculation(e.target.value)} className={inputCls}>
              <option value="">Select</option><option>Yes</option><option>No</option>
            </select>
          </div>
          <div><label className={labelCls}>Erectile Dysfunction</label>
            <select value={erectileDysfunction} onChange={e => setErectileDysfunction(e.target.value)} className={inputCls}>
              <option value="">Select</option><option>Yes</option><option>No</option>
            </select>
          </div>
          <div><label className={labelCls}>Loss of Libido</label>
            <select value={maleLossOfLibido} onChange={e => setMaleLossOfLibido(e.target.value)} className={inputCls}>
              <option value="">Select</option><option>Yes</option><option>No</option>
            </select>
          </div>
        </div>
      </div>

      <div className={sectionCls}>
        <h3 className={headerCls}>Medical & Family History</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><label className={labelCls}>Medical History</label><textarea value={maleMedicalHistory} onChange={e => setMaleMedicalHistory(e.target.value)} className={inputCls + " min-h-[60px] resize-y"} /></div>
          <div><label className={labelCls}>Surgical History</label><textarea value={maleSurgicalHistory} onChange={e => setMaleSurgicalHistory(e.target.value)} className={inputCls + " min-h-[60px] resize-y"} /></div>
          <div><label className={labelCls}>Treatment History</label><textarea value={maleTreatmentHistory} onChange={e => setMaleTreatmentHistory(e.target.value)} className={inputCls + " min-h-[60px] resize-y"} /></div>
          <div>
            <label className={labelCls}>Family History — H/O Infertility</label>
            <div className="grid grid-cols-3 gap-2">
              <div><label className="text-[10px] text-slate-500">HT</label>
                <select value={familyHT} onChange={e => setFamilyHT(e.target.value)} className={inputCls}><option value="">-</option><option>Yes</option><option>No</option></select>
              </div>
              <div><label className="text-[10px] text-slate-500">DM</label>
                <select value={familyDM} onChange={e => setFamilyDM(e.target.value)} className={inputCls}><option value="">-</option><option>Yes</option><option>No</option></select>
              </div>
              <div><label className="text-[10px] text-slate-500">Hypothyroid</label>
                <select value={familyHypothyroid} onChange={e => setFamilyHypothyroid(e.target.value)} className={inputCls}><option value="">-</option><option>Yes</option><option>No</option></select>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3"><label className={labelCls}>Urologist Opinion</label><textarea value={urologistOpinion} onChange={e => setUrologistOpinion(e.target.value)} className={inputCls + " min-h-[60px] resize-y"} /></div>
      </div>
    </div>
  );

  // Page 7 = Semen Analysis (was Page 8 in PDF)
  const renderPage7 = () => {
    const motilityFields = [
      { label: 'Progressive (a)', state: progressiveA, setter: setProgressiveA },
      { label: 'Sluggish (b)', state: sluggishB, setter: setSluggishB },
      { label: 'Non Progressive (c)', state: nonProgressiveC, setter: setNonProgressiveC },
      { label: 'Static (d)', state: staticD, setter: setStaticD },
      { label: 'Type a+b', state: typeAB, setter: setTypeAB },
    ];
    const morphFields = [
      { label: 'Normal', state: morphNormal, setter: setMorphNormal },
      { label: 'Abnormal', state: morphAbnormal, setter: setMorphAbnormal },
      { label: 'Head Defects', state: morphHead, setter: setMorphHead },
      { label: 'Mid Piece Defects', state: morphMid, setter: setMorphMid },
      { label: 'Tail Defects', state: morphTail, setter: setMorphTail },
      { label: 'Teratozoospermic Index', state: teratoIndex, setter: setTeratoIndex },
    ];

    return (
      <div className="space-y-4">
        <div className={sectionCls}>
          <h3 className={headerCls}><Microscope size={16} className="text-indigo-500" /> Semen Analysis</h3>
          <div className="mb-3"><label className={labelCls}>Count</label><textarea value={semenCount} onChange={e => setSemenCount(e.target.value)} className={inputCls + " min-h-[36px] resize-y" + " max-w-[200px]"} /></div>

          <h4 className="text-xs font-bold text-slate-700 mb-2 bg-slate-50 px-2 py-1 rounded">Motility</h4>
          <table className="w-full text-xs mb-4">
            <thead><tr className="bg-slate-50"><th className="px-2 py-2 text-left border-b">Parameter</th><th className="px-2 py-2 text-left border-b">%</th><th className="px-2 py-2 text-left border-b">CONC</th></tr></thead>
            <tbody>
              {motilityFields.map((f, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="px-2 py-1.5 font-medium text-slate-700">{f.label}</td>
                  <td className="px-1 py-1"><textarea value={f.state.pct} onChange={e => f.setter({ ...f.state, pct: e.target.value })} className={inputCls + " min-h-[36px] resize-y"} /></td>
                  <td className="px-1 py-1"><textarea value={f.state.conc} onChange={e => f.setter({ ...f.state, conc: e.target.value })} className={inputCls + " min-h-[36px] resize-y"} /></td>
                </tr>
              ))}
            </tbody>
          </table>

          <h4 className="text-xs font-bold text-slate-700 mb-2 bg-slate-50 px-2 py-1 rounded">Morphology</h4>
          <table className="w-full text-xs">
            <thead><tr className="bg-slate-50"><th className="px-2 py-2 text-left border-b">Parameter</th><th className="px-2 py-2 text-left border-b">%</th><th className="px-2 py-2 text-left border-b">CONC</th></tr></thead>
            <tbody>
              {morphFields.map((f, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="px-2 py-1.5 font-medium text-slate-700">{f.label}</td>
                  <td className="px-1 py-1"><textarea value={f.state.pct} onChange={e => f.setter({ ...f.state, pct: e.target.value })} className={inputCls + " min-h-[36px] resize-y"} /></td>
                  <td className="px-1 py-1"><textarea value={f.state.conc} onChange={e => f.setter({ ...f.state, conc: e.target.value })} className={inputCls + " min-h-[36px] resize-y"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Page 8 = DNA Fragmentation (was Page 9)
  const renderPage8 = () => (
    <div className="space-y-4">
      <div className={sectionCls}>
        <h3 className={headerCls}><Dna size={16} className="text-rose-500" /> DNA Fragmentation</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><label className={labelCls}>Fragmented %</label><textarea value={fragmented} onChange={e => setFragmented(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
          <div><label className={labelCls}>Non Fragmented %</label><textarea value={nonFragmented} onChange={e => setNonFragmented(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
          <div><label className={labelCls}>DFI Value</label><textarea value={dfiValue} onChange={e => setDfiValue(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
          <div><label className={labelCls}>Impression</label><textarea value={dnaImpression} onChange={e => setDnaImpression(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
        </div>
      </div>
    </div>
  );

  // Page 9 = Male Investigations (was Page 10)
  const renderPage9 = () => (
    <div className="space-y-4">
      <div className={sectionCls}>
        <h3 className={headerCls}><TestTube size={16} className="text-teal-500" /> Male Investigations</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div><label className={labelCls}>USG Date</label><input type="date" value={maleUSGDate} onChange={e => setMaleUSGDate(e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Testicular Biopsy Date</label><input type="date" value={testicularBiopsyDate} onChange={e => setTesticularBiopsyDate(e.target.value)} className={inputCls} /></div>
        </div>

        {/* Repeat Semen Analysis */}
        <h4 className="text-xs font-bold text-slate-700 mb-2 bg-slate-50 px-2 py-1 rounded">Semen Analysis (Repeat)</h4>
        <table className="w-full text-xs mb-3">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-2 py-2 text-left border-b">Date</th>
              <th className="px-2 py-2 text-left border-b">TC</th>
              <th className="px-2 py-2 text-left border-b">Motility</th>
              <th className="px-2 py-2 text-left border-b">Morphology</th>
              <th className="px-2 py-2 text-left border-b">Comment</th>
            </tr>
          </thead>
          <tbody>
            {maleSemenRows.map((row, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="px-1 py-1"><input type="date" value={row.date} onChange={e => setMaleSemenRows(prev => prev.map((r, idx) => idx === i ? { ...r, date: e.target.value } : r))} className={inputCls} /></td>
                <td className="px-1 py-1"><textarea value={row.tc} onChange={e => setMaleSemenRows(prev => prev.map((r, idx) => idx === i ? { ...r, tc: e.target.value } : r))} className={inputCls + " min-h-[36px] resize-y"} /></td>
                <td className="px-1 py-1"><textarea value={row.motility} onChange={e => setMaleSemenRows(prev => prev.map((r, idx) => idx === i ? { ...r, motility: e.target.value } : r))} className={inputCls + " min-h-[36px] resize-y"} /></td>
                <td className="px-1 py-1"><textarea value={row.morphology} onChange={e => setMaleSemenRows(prev => prev.map((r, idx) => idx === i ? { ...r, morphology: e.target.value } : r))} className={inputCls + " min-h-[36px] resize-y"} /></td>
                <td className="px-1 py-1"><textarea value={row.comment} onChange={e => setMaleSemenRows(prev => prev.map((r, idx) => idx === i ? { ...r, comment: e.target.value } : r))} className={inputCls + " min-h-[36px] resize-y"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={addMaleSemenRow} className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 mb-4">
          <Plus size={12} /> Add Row
        </button>
      </div>

      {/* Male Blood Panel */}
      {renderLabPanel('Male Blood Investigation Panel', maleLabDates, setMaleLabDates, maleLabRows, setMaleLabRows)}
    </div>
  );

  // Page 10 = Clinical Summary (was Page 11)
  const renderPage10 = () => (
    <div className="space-y-4">
      <div className={sectionCls}>
        <h3 className={headerCls}><Clipboard size={16} className="text-orange-500" /> Clinical Summary / Diagnosis</h3>

        {/* Couple Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-pink-50/50 rounded-lg p-3 border border-pink-100">
            <p className="text-[10px] font-bold text-pink-600 mb-2">MRS (Female)</p>
            <div className="grid grid-cols-3 gap-2">
              <div><label className={labelCls}>Name</label><textarea value={summaryFemName} onChange={e => setSummaryFemName(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
              <div><label className={labelCls}>Age</label><textarea value={summaryFemAge} onChange={e => setSummaryFemAge(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
              <div><label className={labelCls}>BMI</label><textarea value={summaryFemBMI} onChange={e => setSummaryFemBMI(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
            </div>
          </div>
          <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100">
            <p className="text-[10px] font-bold text-blue-600 mb-2">MR (Male)</p>
            <div className="grid grid-cols-3 gap-2">
              <div><label className={labelCls}>Name</label><textarea value={summaryMaleName} onChange={e => setSummaryMaleName(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
              <div><label className={labelCls}>Age</label><textarea value={summaryMaleAge} onChange={e => setSummaryMaleAge(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
              <div><label className={labelCls}>BMI</label><textarea value={summaryMaleBMI} onChange={e => setSummaryMaleBMI(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
            </div>
          </div>
        </div>

        {/* Diagnosis Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-2 bg-slate-50 px-2 py-1 rounded">Female Factors</h4>
            <div className="space-y-2">
              <div><label className={labelCls}>Tubal Factor</label><textarea value={tubalFactor} onChange={e => setTubalFactor(e.target.value)} className={inputCls + " min-h-[50px] resize-y"} /></div>
              <div><label className={labelCls}>Ovarian Factor</label><textarea value={ovarianFactor} onChange={e => setOvarianFactor(e.target.value)} className={inputCls + " min-h-[50px] resize-y"} /></div>
              <div><label className={labelCls}>Uterine Factor</label><textarea value={uterineFactor} onChange={e => setUterineFactor(e.target.value)} className={inputCls + " min-h-[50px] resize-y"} /></div>
              <div><label className={labelCls}>Unexplained Infertility</label><textarea value={unexplainedInfertility} onChange={e => setUnexplainedInfertility(e.target.value)} className={inputCls + " min-h-[50px] resize-y"} /></div>
              <div><label className={labelCls}>Hormones Comment</label><textarea value={hormonesComment} onChange={e => setHormonesComment(e.target.value)} className={inputCls + " min-h-[50px] resize-y"} /></div>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-2 bg-slate-50 px-2 py-1 rounded">Male Factors</h4>
            <div className="space-y-2">
              <div><label className={labelCls}>SA/CASA Comments</label><textarea value={saCasaComments} onChange={e => setSaCasaComments(e.target.value)} className={inputCls + " min-h-[50px] resize-y"} /></div>
              <div><label className={labelCls}>DNA Fragmentation</label><textarea value={dnaFragSummary} onChange={e => setDnaFragSummary(e.target.value)} className={inputCls + " min-h-[50px] resize-y"} /></div>
              <div><label className={labelCls}>Medical Disorder</label><textarea value={medicalDisorder} onChange={e => setMedicalDisorder(e.target.value)} className={inputCls + " min-h-[50px] resize-y"} /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Page 11 = Protocol Tracker (was Page 12)
  const renderPage11 = () => (
    <div className="space-y-4">
      <div className={sectionCls}>
        <h3 className={headerCls}><ClipboardList size={16} className="text-cyan-500" /> Treatment Protocol Tracker</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-2 py-2 text-left border-b w-6">✓</th>
              <th className="px-2 py-2 text-left border-b">Step</th>
              <th className="px-2 py-2 text-left border-b">Date</th>
              <th className="px-2 py-2 text-left border-b">Notes</th>
            </tr>
          </thead>
          <tbody>
            {protocolSteps.map((step, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-sky-50/30">
                <td className="px-2 py-1.5">
                  <input type="checkbox" checked={step.completed} onChange={e => setProtocolSteps(prev => prev.map((s, idx) => idx === i ? { ...s, completed: e.target.checked } : s))}
                    className="rounded border-slate-300 text-sky-500 focus:ring-sky-400" />
                </td>
                <td className="px-2 py-1.5 font-medium text-slate-700">
                    {step.name ? step.name : <textarea placeholder="Custom Step" onChange={e => setProtocolSteps(prev => prev.map((s, idx) => idx === i ? { ...s, name: e.target.value } : s))} className={inputCls + " min-h-[36px] resize-y"} />}
                </td>
                <td className="px-1 py-1"><input type="date" value={step.date} onChange={e => setProtocolSteps(prev => prev.map((s, idx) => idx === i ? { ...s, date: e.target.value } : s))} className={inputCls} /></td>
                <td className="px-1 py-1"><textarea value={step.notes} onChange={e => setProtocolSteps(prev => prev.map((s, idx) => idx === i ? { ...s, notes: e.target.value } : s))} className={inputCls + " min-h-[36px] resize-y"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={sectionCls}>
        <h3 className={headerCls}>Counselling Record</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><label className={labelCls}>Counselling Date</label><input type="date" value={counsellingDate} onChange={e => setCounsellingDate(e.target.value)} className={inputCls} /></div>
          <div className="flex items-center gap-2 pt-5">
            <input type="checkbox" checked={costExplained} onChange={e => setCostExplained(e.target.checked)} className="rounded border-slate-300 text-sky-500" />
            <span className="text-xs text-slate-700">Cost Explained</span>
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input type="checkbox" checked={riskExplained} onChange={e => setRiskExplained(e.target.checked)} className="rounded border-slate-300 text-sky-500" />
            <span className="text-xs text-slate-700">Risk Explained</span>
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input type="checkbox" checked={successRateExplained} onChange={e => setSuccessRateExplained(e.target.checked)} className="rounded border-slate-300 text-sky-500" />
            <span className="text-xs text-slate-700">Success Rate Explained</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Page 12 = Follicular Monitoring (was Page 13)
  const renderPage12 = () => (
    <div className="space-y-4">
      <div className={sectionCls}>
        <h3 className={headerCls}><BarChart3 size={16} className="text-emerald-500" /> Follicular Monitoring Log</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <div><label className={labelCls}>Date</label><input type="date" value={fmDate} onChange={e => setFmDate(e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Wt</label><textarea value={fmWt} onChange={e => setFmWt(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
          <div><label className={labelCls}>BMI</label><textarea value={fmBMI} onChange={e => setFmBMI(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
          <div><label className={labelCls}>Diagnosis</label><textarea value={fmDiagnosis} onChange={e => setFmDiagnosis(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
          <div><label className={labelCls}>Protocol</label><textarea value={fmProtocol} onChange={e => setFmProtocol(e.target.value)} className={inputCls + " min-h-[36px] resize-y"} /></div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-2 py-2 text-left border-b">Date</th>
                <th className="px-2 py-2 text-left border-b">Day of Cycle</th>
                <th className="px-2 py-2 text-left border-b">R.T.Ovary</th>
                <th className="px-2 py-2 text-left border-b">L.T.Ovary</th>
                <th className="px-2 py-2 text-left border-b">E.T.</th>
                <th className="px-2 py-2 text-left border-b">Mucus</th>
                <th className="px-2 py-2 text-left border-b">Remarks</th>
                <th className="px-2 py-2 border-b w-8"></th>
              </tr>
            </thead>
            <tbody>
              {follicularRows.map((row, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-emerald-50/30">
                  <td className="px-1 py-1"><input type="date" value={row.date} onChange={e => setFollicularRows(prev => prev.map((r, idx) => idx === i ? { ...r, date: e.target.value } : r))} className={inputCls} /></td>
                  <td className="px-1 py-1"><textarea value={row.dayOfCycle} onChange={e => setFollicularRows(prev => prev.map((r, idx) => idx === i ? { ...r, dayOfCycle: e.target.value } : r))} className={inputCls + " min-h-[36px] resize-y"} /></td>
                  <td className="px-1 py-1"><textarea value={row.rtOvary} onChange={e => setFollicularRows(prev => prev.map((r, idx) => idx === i ? { ...r, rtOvary: e.target.value } : r))} className={inputCls + " min-h-[36px] resize-y"} /></td>
                  <td className="px-1 py-1"><textarea value={row.ltOvary} onChange={e => setFollicularRows(prev => prev.map((r, idx) => idx === i ? { ...r, ltOvary: e.target.value } : r))} className={inputCls + " min-h-[36px] resize-y"} /></td>
                  <td className="px-1 py-1"><textarea value={row.et} onChange={e => setFollicularRows(prev => prev.map((r, idx) => idx === i ? { ...r, et: e.target.value } : r))} className={inputCls + " min-h-[36px] resize-y"} /></td>
                  <td className="px-1 py-1"><textarea value={row.mucus} onChange={e => setFollicularRows(prev => prev.map((r, idx) => idx === i ? { ...r, mucus: e.target.value } : r))} className={inputCls + " min-h-[36px] resize-y"} /></td>
                  <td className="px-1 py-1"><textarea value={row.remarks} onChange={e => setFollicularRows(prev => prev.map((r, idx) => idx === i ? { ...r, remarks: e.target.value } : r))} className={inputCls + " min-h-[36px] resize-y"} /></td>
                  <td className="px-1 py-1">
                    {follicularRows.length > 1 && (
                      <button onClick={() => removeFollicularRow(i)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={addFollicularRow} className="mt-2 text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1">
          <Plus size={12} /> Add Monitoring Row
        </button>
      </div>
    </div>
  );

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 1: return renderPage1();
      case 2: return renderPage2();
      case 3: return renderPage3();
      case 4: return renderPage4();
      case 5: return renderPage5();
      case 6: return renderPage6();
      case 7: return renderPage7();
      case 8: return renderPage8();
      case 9: return renderPage9();
      case 10: return renderPage10();
      case 11: return renderPage11();
      case 12: return renderPage12();
      default: return renderPage1();
    }
  };

  // Helper to sanitize fields for clean printout (removes placeholder text, unselected dropdown text, and dd-mm-yyyy watermarks)
  const preparePrintElements = () => {
    const printContainer = document.getElementById('ivf-print-container');
    if (!printContainer) return () => {};

    // 1. Convert empty date inputs to text type so Chrome doesn't print "dd-mm-yyyy"
    const dateInputs = printContainer.querySelectorAll<HTMLInputElement>('input[type="date"]');
    const restoredDates: HTMLInputElement[] = [];
    dateInputs.forEach(input => {
      if (!input.value) {
        input.dataset.wasDate = 'true';
        input.type = 'text';
        input.value = '';
        input.placeholder = '';
        restoredDates.push(input);
      }
    });

    // 2. Hide unselected/empty selects so Chrome doesn't print "Select"
    const selects = printContainer.querySelectorAll<HTMLSelectElement>('select');
    const restoredSelects: { el: HTMLSelectElement; origColor: string }[] = [];
    selects.forEach(select => {
      if (!select.value || select.value.toLowerCase() === 'select') {
        restoredSelects.push({ el: select, origColor: select.style.color });
        select.style.color = 'transparent';
      }
    });

    // 3. Clear placeholders from text inputs/textareas so they don't print "Years", "Age", "Education", etc.
    const textInputs = printContainer.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
    const restoredPlaceholders: { el: HTMLInputElement | HTMLTextAreaElement; origPlaceholder: string }[] = [];
    textInputs.forEach(input => {
      if (input.placeholder) {
        restoredPlaceholders.push({ el: input, origPlaceholder: input.placeholder });
        input.placeholder = '';
      }
    });

    return () => {
      restoredDates.forEach(input => {
        input.type = 'date';
      });
      restoredSelects.forEach(({ el, origColor }) => {
        el.style.color = origColor;
      });
      restoredPlaceholders.forEach(({ el, origPlaceholder }) => {
        el.placeholder = origPlaceholder;
      });
    };
  };

  // Print handler that ensures document.title is set to "<Patient Name> IVF Case Sheet" and cleans elements
  const handlePrint = () => {
    const originalTitle = document.title;
    const originalBodyOverflow = document.body.style.overflow;
    const cleanName = (patientName || femName || 'Patient').trim();
    document.title = `${cleanName} IVF Case Sheet`;
    document.body.style.overflow = 'visible';

    const cleanup = preparePrintElements();

    window.print();

    const restore = () => {
      document.title = originalTitle;
      document.body.style.overflow = originalBodyOverflow;
      cleanup();
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    setTimeout(restore, 3000);
  };

  // Keyboard shortcut Ctrl+P / browser print menu listener
  useEffect(() => {
    const originalTitle = document.title;
    const originalBodyOverflow = document.body.style.overflow;
    let cleanupFn: (() => void) | null = null;

    const handleBefore = () => {
      const cleanName = (patientName || femName || 'Patient').trim();
      document.title = `${cleanName} IVF Case Sheet`;
      document.body.style.overflow = 'visible';
      cleanupFn = preparePrintElements();
    };

    const handleAfter = () => {
      document.title = originalTitle;
      document.body.style.overflow = originalBodyOverflow;
      if (cleanupFn) {
        cleanupFn();
        cleanupFn = null;
      }
    };

    window.addEventListener('beforeprint', handleBefore);
    window.addEventListener('afterprint', handleAfter);
    return () => {
      window.removeEventListener('beforeprint', handleBefore);
      window.removeEventListener('afterprint', handleAfter);
    };
  }, [patientName, femName]);

  // Auto-scroll active tab into view smoothly
  useEffect(() => {
    if (tabScrollRef.current) {
      const activeBtn = tabScrollRef.current.querySelector<HTMLButtonElement>(`[data-page="${currentPage}"]`);
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentPage]);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabScrollRef.current) {
      const amount = direction === 'left' ? -250 : 250;
      tabScrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // ─── Main Layout ───────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      {/* ─── Top Command Header: Section Title, Quick Nav, Actions ─── */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 print:hidden shadow-xs">
        {/* Left: Active Section & Quick Navigation */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200/60">
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 bg-sky-100/80 px-1.5 py-0.5 rounded">
              Page {currentPage}/{TOTAL_PAGES}
            </span>
            <div className="h-3.5 w-px bg-slate-300" />
            <select
              value={currentPage}
              onChange={(e) => setCurrentPage(Number(e.target.value))}
              aria-label="Jump to IVF Case Sheet section"
              className="bg-transparent text-xs font-semibold text-slate-700 border-none outline-none cursor-pointer focus:ring-0 pr-2 py-0.5"
            >
              {pageConfig.map(p => (
                <option key={p.num} value={p.num}>
                  {p.num}. {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Section Title */}
          <h2 className="text-sm font-bold text-slate-800 truncate hidden sm:block">
            {pageConfig.find(p => p.num === currentPage)?.title}
          </h2>

          {/* Prev / Next buttons */}
          <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5 border border-slate-200/70">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-1 rounded text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
              title="Previous Page"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-[11px] font-semibold text-slate-500 px-1 select-none">
              {currentPage} / {TOTAL_PAGES}
            </span>
            <button
              type="button"
              disabled={currentPage === TOTAL_PAGES}
              onClick={() => setCurrentPage(prev => Math.min(TOTAL_PAGES, prev + 1))}
              className="p-1 rounded text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
              title="Next Page"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* Right: Actions (Print & Save) */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 shadow-2xs transition-all active:scale-95"
            title="Print Full Case Sheet as PDF"
          >
            <Printer size={14} className="text-slate-500" />
            <span>Print Case Sheet</span>
          </button>
          {!isReadOnly && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow transition-all disabled:opacity-50 active:scale-95"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span>{isSaving ? 'Saving...' : 'Save Case Sheet'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Bottom Tabs Ribbon: Scrollable with No Ugly Scrollbar ─── */}
      <div className="bg-slate-50 border-b border-slate-200 px-2 py-1.5 flex items-center gap-1 flex-shrink-0 print:hidden relative">
        {/* Scroll Left Button */}
        <button
          type="button"
          onClick={() => scrollTabs('left')}
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 transition-all flex-shrink-0"
          title="Scroll tabs left"
        >
          <ChevronLeft size={15} />
        </button>

        {/* Tab Buttons Container (Scrollbar completely hidden on all browsers) */}
        <div
          ref={tabScrollRef}
          className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex-1 scroll-smooth py-0.5 px-1"
        >
          {pageConfig.map(p => {
            const isActive = currentPage === p.num;
            return (
              <button
                key={p.num}
                data-page={p.num}
                onClick={() => setCurrentPage(p.num)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-xs font-bold ring-1 ring-sky-700/20'
                    : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80 shadow-2xs'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive ? 'bg-sky-700/40 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {p.num}
                </span>
                <span className={isActive ? 'text-white' : 'text-slate-400'}>{p.icon}</span>
                <span>{p.shortTitle || p.title}</span>
              </button>
            );
          })}
        </div>

        {/* Scroll Right Button */}
        <button
          type="button"
          onClick={() => scrollTabs('right')}
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 transition-all flex-shrink-0"
          title="Scroll tabs right"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Scrollable Content (Screen Only) */}
      <div ref={contentRef} className="flex-1 overflow-y-auto p-4 print:hidden">
        {isReadOnly && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium rounded-lg flex items-center gap-2">
            You are viewing this record in Read-Only mode.
          </div>
        )}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
            <p className="text-xs font-medium text-slate-500">Loading IVF specialty record...</p>
          </div>
        ) : (
          <fieldset disabled={isReadOnly} className="border-0 p-0 m-0 min-w-0">
            {renderCurrentPage()}
          </fieldset>
        )}
      </div>

      {/* ─── Dedicated Multi-Page Print Layout (Direct Body Portal) ─── */}
      {typeof document !== 'undefined' && createPortal(
        <div id="ivf-print-container" className="hidden print:block font-sans text-slate-900 bg-white">
          {/* Printable Master Header */}
          <div className="border-b-2 border-slate-900 pb-2 mb-3">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="bg-sky-800 text-white text-[9px] font-bold px-2 py-0.5 rounded tracking-wider uppercase inline-block">
                    Janmasethu Specialty Record
                  </span>
                  <span className="text-[11px] font-semibold text-slate-700">
                    Department of Reproductive Medicine & IVF
                  </span>
                </div>
                <h1 className="text-xl font-black text-slate-950 tracking-tight leading-tight">
                  {patientName || femName ? `${(patientName || femName).trim()} IVF Case Sheet` : 'IVF Case Sheet'}
                </h1>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Comprehensive Fertility Assessment, Clinical Diagnostic Workup & Protocol Flowsheet
                </p>
              </div>
              <div className="w-64 flex-shrink-0 text-right text-[10px] text-slate-800 space-y-0.5 bg-slate-50 p-2 rounded-lg border border-slate-300">
                <p className="truncate"><span className="font-bold text-slate-900">Patient:</span> {patientName || femName || 'N/A'}</p>
                <p><span className="font-bold text-slate-900">Age / Gender:</span> {patientAge || femAge || '—'} Y / {patientGender || 'Female'}</p>
                <p className="truncate"><span className="font-bold text-slate-900">Patient ID:</span> <span className="font-mono text-[9px] font-semibold">{patientId}</span></p>
                <p><span className="font-bold text-slate-900">Printed On:</span> {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>
          </div>

          {/* All 12 Sections Sequentially for Printing */}
          <div className="space-y-6">
            {/* Section 1 */}
            <div className="print-section print-page-break">
              <div className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-t-md uppercase tracking-wider mb-2">
                Page 1: Female Partner Profile & Obstetric History
              </div>
              {renderPage1()}
            </div>

            {/* Section 2 */}
            <div className="print-section print-page-break">
              <div className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-t-md uppercase tracking-wider mb-2">
                Page 2: Past History & Clinical Examination
              </div>
              {renderPage2()}
            </div>

            {/* Section 3 */}
            <div className="print-section print-page-break">
              <div className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-t-md uppercase tracking-wider mb-2">
                Page 3: HSG / Hysteroscopy / Laparoscopy Findings
              </div>
              {renderPage3()}
            </div>

            {/* Section 4 */}
            <div className="print-section print-page-break">
              <div className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-t-md uppercase tracking-wider mb-2">
                Page 4: Female Hormonal & Laboratory Investigations
              </div>
              {renderPage4()}
            </div>

            {/* Section 5 */}
            <div className="print-section print-page-break">
              <div className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-t-md uppercase tracking-wider mb-2">
                Page 5: Baseline Pelvic Ultrasound (USG) & Antral Follicle Count
              </div>
              {renderPage5()}
            </div>

            {/* Section 6 */}
            <div className="print-section print-page-break">
              <div className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-t-md uppercase tracking-wider mb-2">
                Page 6: Male Partner Profile & Personal History
              </div>
              {renderPage6()}
            </div>

            {/* Section 7 */}
            <div className="print-section print-page-break">
              <div className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-t-md uppercase tracking-wider mb-2">
                Page 7: Semen Analysis & Sperm Morphology
              </div>
              {renderPage7()}
            </div>

            {/* Section 8 */}
            <div className="print-section print-page-break">
              <div className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-t-md uppercase tracking-wider mb-2">
                Page 8: Sperm DNA Fragmentation Index (DFI)
              </div>
              {renderPage8()}
            </div>

            {/* Section 9 */}
            <div className="print-section print-page-break">
              <div className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-t-md uppercase tracking-wider mb-2">
                Page 9: Male Endocrine & Infectious Disease Investigations
              </div>
              {renderPage9()}
            </div>

            {/* Section 10 */}
            <div className="print-section print-page-break">
              <div className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-t-md uppercase tracking-wider mb-2">
                Page 10: Clinical Summary, Infertility Factors & Treatment Plan
              </div>
              {renderPage10()}
            </div>

            {/* Section 11 */}
            <div className="print-section print-page-break">
              <div className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-t-md uppercase tracking-wider mb-2">
                Page 11: IVF Protocol Milestones & Pre-Treatment Checklist
              </div>
              {renderPage11()}
            </div>

            {/* Section 12 */}
            <div className="print-section">
              <div className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-t-md uppercase tracking-wider mb-2">
                Page 12: Follicular Monitoring & Ovarian Stimulation Sheet
              </div>
              {renderPage12()}

              {/* Print Sign-off Block */}
              <div className="mt-8 pt-4 border-t-2 border-slate-400 print-avoid-break flex justify-between items-end text-xs text-slate-700">
                <div>
                  <p className="font-bold text-slate-900">Janmasethu Clinical Control Tower</p>
                  <p className="text-[10px] text-slate-500">Confidential Electronic Medical Record. Verified Specialty Case Sheet.</p>
                </div>
                <div className="text-right space-y-1">
                  <div className="w-56 border-b border-slate-600 mb-1 inline-block"></div>
                  <p className="font-bold text-slate-900">Authorized IVF Specialist / Clinician</p>
                  <p className="text-[10px] text-slate-500">Signature & Medical Registration Number</p>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default IvfCaseSheetSuite;
