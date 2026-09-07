import React, { useState } from 'react';
import { 
    Stethoscope, 
    Calendar, 
    Pill, 
    FileText, 
    Image as ImageIcon, 
    ExternalLink, 
    Download, 
    CheckCircle2, 
    Clock, 
    Activity, 
    ChevronDown, 
    ChevronUp,
    User
} from 'lucide-react';
import { api } from '../../../services/api';
import toast from 'react-hot-toast';
import { formatLocalTime } from '../../../utils/dateFormatter';

export interface EncounterGroup {
    dateKey: string;
    formattedDate: string;
    latestTimestamp: string;
    consultations: any[];
    appointments: any[];
    prescriptions: any[];
    investigations: any[];
    treatments: any[];
    otherEvents: any[];
}

interface EncounterCardProps {
    encounter: EncounterGroup;
    patientId: string;
}

export const EncounterCard: React.FC<EncounterCardProps> = ({ encounter, patientId }) => {
    const [expanded, setExpanded] = useState(true);
    const [loadingDocId, setLoadingDocId] = useState<string | null>(null);
    const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);

    const hasConsultation = encounter.consultations.length > 0;
    const hasAppointments = encounter.appointments.length > 0;
    const hasPrescriptions = encounter.prescriptions.length > 0;
    const hasDocuments = encounter.investigations.length > 0;
    const hasTreatments = encounter.treatments.length > 0;

    // Determine primary encounter title and icon
    let encounterTitle = 'Clinical Encounter & Records';
    let PrimaryIcon = Activity;
    let headerBorder = 'border-slate-200 bg-slate-50/70';

    if (hasConsultation || hasAppointments) {
        encounterTitle = 'OPD Consultation & Care Encounter';
        PrimaryIcon = Stethoscope;
        headerBorder = 'border-blue-200/80 bg-blue-50/30';
    } else if (hasPrescriptions) {
        encounterTitle = 'Prescription & Medication Order';
        PrimaryIcon = Pill;
        headerBorder = 'border-emerald-200/80 bg-emerald-50/30';
    } else if (hasDocuments) {
        encounterTitle = 'Diagnostic Reports & Document Uploads';
        PrimaryIcon = FileText;
        headerBorder = 'border-violet-200/80 bg-violet-50/30';
    }

    const fetchDocumentUrl = async (doc: any) => {
        const docId = doc.source_id || doc.reference_id || doc.id;
        if (!docId) throw new Error("Document reference ID missing");
        const res = await api.getSecureAssetUrl(docId);
        if (res.success && res.data?.url) {
            return res.data.url;
        }
        throw new Error(res.error || "Failed to retrieve secure document link");
    };

    const handleViewDocument = async (doc: any) => {
        const docId = doc.source_id || doc.reference_id || doc.id;
        try {
            setLoadingDocId(docId);
            const url = await fetchDocumentUrl(doc);
            window.open(url, '_blank', 'noopener,noreferrer');
        } catch (err: any) {
            console.error('Error viewing document:', err);
            toast.error(err.message || 'Failed to open document');
        } finally {
            setLoadingDocId(null);
        }
    };

    const handleDownloadDocument = async (doc: any) => {
        const docId = doc.source_id || doc.reference_id || doc.id;
        try {
            setDownloadingDocId(docId);
            const url = await fetchDocumentUrl(doc);
            const link = document.createElement('a');
            link.href = url;
            link.download = doc.title || 'clinical_document';
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Download started');
        } catch (err: any) {
            console.error('Error downloading document:', err);
            toast.error(err.message || 'Failed to download document');
        } finally {
            setDownloadingDocId(null);
        }
    };

    return (
        <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden transition-all duration-200 hover:border-slate-300">
            {/* Encounter Header Bar */}
            <div className={`px-3 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 ${headerBorder}`}>
                <div className="flex items-center space-x-2 min-w-0">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-xs text-slate-900 truncate">
                                {encounterTitle}
                            </h3>
                        </div>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock size={11} className="text-slate-400" />
                            <span>Recorded at {formatLocalTime(encounter.latestTimestamp)}</span>
                        </p>
                    </div>
                </div>

                {/* Right Summary Badges & Collapse Toggle */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    {hasConsultation && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            <Stethoscope size={10} />
                            <span>{encounter.consultations.length} Consult</span>
                        </span>
                    )}
                    {hasPrescriptions && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Pill size={10} />
                            <span>{encounter.prescriptions.length} Rx</span>
                        </span>
                    )}
                    {hasDocuments && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200">
                            <FileText size={10} />
                            <span>{encounter.investigations.length} File{encounter.investigations.length > 1 ? 's' : ''}</span>
                        </span>
                    )}

                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-white transition-colors"
                        title={expanded ? 'Collapse encounter' : 'Expand encounter'}
                    >
                        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                </div>
            </div>

            {/* Encounter Body Content */}
            {expanded && (
                <div className="p-3 space-y-3 bg-white divide-y divide-slate-100">
                    {/* 1. Consultations & Clinical Notes */}
                    {hasConsultation && (
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                                <Stethoscope size={11} className="text-blue-600" />
                                <span>Consultation Notes & Diagnosis</span>
                            </div>
                            {encounter.consultations.map((note, idx) => (
                                <div key={idx} className="bg-slate-50 p-2.5 rounded border border-slate-200/70 text-xs space-y-1">
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="font-bold text-slate-800 flex items-center gap-1">
                                            <User size={11} className="text-slate-400" />
                                            {note.doctor_name || 'Attending Physician'}
                                        </span>
                                        <span className="text-slate-400 font-semibold">{formatLocalTime(note.event_date)}</span>
                                    </div>
                                    <p className="text-slate-700 leading-relaxed whitespace-pre-line bg-white p-2 rounded border border-slate-200/50">
                                        {note.description || 'Consultation completed.'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 2. Appointments / Visit Context */}
                    {hasAppointments && !hasConsultation && (
                        <div className="space-y-1.5 pt-2 first:pt-0">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                                <Calendar size={11} className="text-sky-600" />
                                <span>Visit & Appointment</span>
                            </div>
                            {encounter.appointments.map((apt, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-sky-50/50 rounded border border-sky-100 text-xs">
                                    <div>
                                        <p className="font-bold text-slate-900">{apt.title || 'OPD Visit'}</p>
                                        <p className="text-[11px] text-slate-500">{apt.description}</p>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-sky-700 border border-sky-200">
                                        Completed Visit
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 3. Prescribed Medications (Rx) */}
                    {hasPrescriptions && (
                        <div className="space-y-1.5 pt-2.5 first:pt-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                                    <Pill size={11} className="text-emerald-600" />
                                    <span>Prescribed Medications (Rx)</span>
                                </div>
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Active Orders
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {encounter.prescriptions.map((rx, idx) => {
                                    const drugs = (rx.description || '').split(',').map((d: string) => d.trim()).filter(Boolean);
                                    return (
                                        <div key={idx} className="bg-emerald-50/30 p-2 rounded border border-emerald-100/80 space-y-1">
                                            <div className="flex items-center justify-between text-[10px]">
                                                <span className="font-bold text-slate-800">{rx.title || 'Prescription Order'}</span>
                                                <span className="text-slate-400 font-semibold">{formatLocalTime(rx.event_date)}</span>
                                            </div>
                                            <div className="space-y-1">
                                                {drugs.length > 0 ? (
                                                    drugs.map((drug: string, dIdx: number) => (
                                                        <div key={dIdx} className="flex items-center justify-between text-xs px-2 py-1 bg-white rounded border border-emerald-200/60">
                                                            <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                                <span>{drug}</span>
                                                            </div>
                                                            <span className="text-[10px] text-slate-500 font-semibold">Prescribed</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-xs text-slate-600">{rx.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 4. Attached Lab Reports & Uploaded Files */}
                    {hasDocuments && (
                        <div className="space-y-1.5 pt-2.5 first:pt-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                                    <FileText size={11} className="text-violet-600" />
                                    <span>Attached Reports & Generated Files</span>
                                </div>
                                <span className="text-[10px] text-slate-500 font-semibold">
                                    {encounter.investigations.length} File{encounter.investigations.length > 1 ? 's' : ''}
                                </span>
                            </div>
                            <div className="space-y-1.5">
                                {encounter.investigations.map((doc, idx) => {
                                    const docId = doc.source_id || doc.reference_id || doc.id || `doc-${idx}`;
                                    const rawTitle = doc.title || 'Medical Record File';
                                    const isImage = rawTitle.match(/\.(png|jpg|jpeg|webp|gif)$/i);
                                    const isPdf = rawTitle.match(/\.pdf$/i);
                                    let cleanName = rawTitle;
                                    if (rawTitle.startsWith('prescription_') && rawTitle.endsWith('.pdf')) {
                                        cleanName = 'Prescription Chart Document (PDF)';
                                    }

                                    return (
                                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 hover:bg-slate-100/70 rounded border border-slate-200 transition-colors">
                                            <div className="flex items-center space-x-2 min-w-0">
                                                <div className="w-6 h-6 rounded bg-violet-50 text-violet-700 border border-violet-200 flex items-center justify-center flex-shrink-0">
                                                    {isImage ? <ImageIcon size={12} /> : <FileText size={12} />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-800 truncate" title={rawTitle}>
                                                        {cleanName}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">
                                                        {isImage ? 'Diagnostic Image' : isPdf ? 'PDF Report' : 'Document'} • {formatLocalTime(doc.event_date)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-1.5 flex-shrink-0">
                                                <button
                                                    onClick={() => handleViewDocument(doc)}
                                                    disabled={loadingDocId === docId}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50 shadow-2xs"
                                                >
                                                    {loadingDocId === docId ? (
                                                        <div className="w-3 h-3 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                                                    ) : (
                                                        <ExternalLink size={11} className="text-slate-500" />
                                                    )}
                                                    <span>View</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadDocument(doc)}
                                                    disabled={downloadingDocId === docId}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-brand-primaryDark transition-colors disabled:opacity-50 shadow-2xs"
                                                >
                                                    {downloadingDocId === docId ? (
                                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    ) : (
                                                        <Download size={11} />
                                                    )}
                                                    <span>Download</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 5. Treatments (if any) */}
                    {hasTreatments && (
                        <div className="space-y-1 pt-2.5 first:pt-0">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                                <Activity size={11} className="text-indigo-600" />
                                <span>Treatments & Procedures</span>
                            </div>
                            {encounter.treatments.map((t, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-indigo-50/50 rounded border border-indigo-100 text-xs">
                                    <span className="font-bold text-slate-800">{t.title}</span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-indigo-700 border border-indigo-200">
                                        {t.description || 'Completed'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
