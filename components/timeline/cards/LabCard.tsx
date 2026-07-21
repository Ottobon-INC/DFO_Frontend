import React, { useState } from 'react';
import { FileText, Download, ExternalLink, Activity } from 'lucide-react';
import { api } from '../../../services/api';

interface LabCardProps {
    event: any;
}

export const LabCard: React.FC<LabCardProps> = ({ event }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleViewDocument = async () => {
        if (!event.reference_id) {
            setError("No document attached");
            return;
        }
        
        try {
            setLoading(true);
            setError(null);
            
            // Get temporary secure URL
            const res = await api.getSecureAssetUrl(event.reference_id);
            if (res.success && res.data.url) {
                // Try to open in new tab
                const newWindow = window.open(res.data.url, '_blank');
                
                // Fallback for popup blockers
                if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                    const link = document.createElement('a');
                    link.href = res.data.url;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            } else {
                throw new Error("Failed to get document URL");
            }
        } catch (err) {
            console.error('Error viewing document:', err);
            setError("Failed to open document");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-brand-surface p-4 rounded-xl border border-brand-border/50 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2 text-brand-primary">
                    <Activity className="w-5 h-5" />
                    <h4 className="font-bold text-brand-text">{event.title || 'Laboratory Report'}</h4>
                </div>
            </div>
            
            <p className="text-sm text-brand-textSecondary mb-4">
                {event.description || 'Lab results are available for review.'}
            </p>

            {error && (
                <div className="mb-3 px-3 py-2 bg-red-50 text-red-500 text-xs rounded-lg border border-red-100">
                    {error}
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-brand-textSecondary bg-brand-bg px-3 py-1.5 rounded-full">
                    <FileText className="w-4 h-4" />
                    <span>PDF Document</span>
                </div>

                <div className="flex space-x-2">
                    <button 
                        onClick={handleViewDocument}
                        disabled={loading}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-brand-primary/10 text-brand-primary text-xs font-bold rounded-lg hover:bg-brand-primary hover:text-white transition-colors disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <ExternalLink className="w-4 h-4" />
                                <span>View</span>
                            </>
                        )}
                    </button>
                    <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-brand-bg text-brand-textSecondary text-xs font-bold rounded-lg hover:bg-brand-border transition-colors">
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
