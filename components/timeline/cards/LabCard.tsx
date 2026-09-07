import React, { useState } from 'react';
import { FileText, Download, ExternalLink, Activity, Image, FileCode, CheckCircle2 } from 'lucide-react';
import { api } from '../../../services/api';
import toast from 'react-hot-toast';

interface LabCardProps {
    event: any;
}

export const LabCard: React.FC<LabCardProps> = ({ event }) => {
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const rawTitle = event.title || 'Laboratory Report / Document';
    const isImage = rawTitle.match(/\.(png|jpg|jpeg|webp|gif)$/i);
    const isPdf = rawTitle.match(/\.pdf$/i);

    // Clean human-friendly name
    let cleanTitle = rawTitle;
    if (rawTitle.startsWith('prescription_') && rawTitle.endsWith('.pdf')) {
        cleanTitle = 'Prescription Record Document (PDF)';
    }

    const fetchUrl = async () => {
        if (!event.reference_id && !event.id) {
            throw new Error("No document ID attached");
        }
        const docId = event.reference_id || event.id;
        const res = await api.getSecureAssetUrl(docId);
        if (res.success && res.data?.url) {
            return res.data.url;
        }
        throw new Error(res.error || "Failed to retrieve secure document link");
    };

    const handleViewDocument = async () => {
        try {
            setLoading(true);
            setError(null);
            const url = await fetchUrl();
            window.open(url, '_blank', 'noopener,noreferrer');
        } catch (err: any) {
            console.error('Error viewing document:', err);
            const msg = err.message || "Failed to open document";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadDocument = async () => {
        try {
            setDownloading(true);
            setError(null);
            const url = await fetchUrl();
            const link = document.createElement('a');
            link.href = url;
            link.download = cleanTitle;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Download started");
        } catch (err: any) {
            console.error('Error downloading document:', err);
            const msg = err.message || "Failed to download document";
            setError(msg);
            toast.error(msg);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs p-3 hover:border-slate-300 transition-colors">
            <div className="flex justify-between items-start gap-2 mb-2">
                <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-violet-50 text-violet-700 flex items-center justify-center border border-violet-200/80 flex-shrink-0">
                        {isImage ? <Image size={13} /> : <FileText size={13} />}
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 truncate" title={rawTitle}>
                            {cleanTitle}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            {event.description || 'Clinical document record uploaded to file'}
                        </p>
                    </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 border border-violet-200 flex-shrink-0">
                    {isImage ? 'Image Record' : isPdf ? 'PDF Report' : 'Document'}
                </span>
            </div>

            {error && (
                <div className="mb-2 px-2.5 py-1.5 bg-rose-50 text-rose-700 text-[11px] font-medium rounded-md border border-rose-200">
                    {error}
                </div>
            )}

            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <CheckCircle2 size={11} className="text-emerald-600" />
                    <span>Verified in patient chart</span>
                </div>

                <div className="flex items-center space-x-1.5">
                    <button 
                        onClick={handleViewDocument}
                        disabled={loading}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50 shadow-2xs"
                    >
                        {loading ? (
                            <div className="w-3 h-3 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <ExternalLink size={11} className="text-slate-500" />
                        )}
                        <span>View</span>
                    </button>
                    <button 
                        onClick={handleDownloadDocument}
                        disabled={downloading}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-primary text-white text-xs font-semibold rounded-md hover:bg-brand-primaryDark transition-colors disabled:opacity-50 shadow-2xs"
                    >
                        {downloading ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <Download size={11} />
                        )}
                        <span>Download</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
