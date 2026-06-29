import React, { useState, useEffect } from 'react';
import { FileText, Image as ImageIcon, Calendar, User, FileDigit, ChevronLeft, ChevronRight, Inbox, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { TriageDocument } from '../types';
import { AssignDocumentModal } from './AssignDocumentModal';

export const UnassignedDocumentsView: React.FC = () => {
    const [documents, setDocuments] = useState<TriageDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedDocToAssign, setSelectedDocToAssign] = useState<{ id: string, name: string } | null>(null);
    const limit = 12; // Grid friendly

    useEffect(() => {
        fetchDocuments();
    }, [page]);

    const fetchDocuments = async () => {
        setIsLoading(true);
        try {
            const response = await api.getUnassignedDocuments(page, limit);
            if (response.success && response.data) {
                setDocuments(response.data);
                setTotalPages(response.meta?.totalPages || 1);
            }
        } catch (error) {
            console.error("Failed to fetch unassigned documents:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType && mimeType.includes('image')) return <ImageIcon size={24} className="text-brand-primary" />;
        return <FileText size={24} className="text-brand-accent" />;
    };

    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatBytes = (bytes: number, decimals = 2) => {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    return (
        <div className="flex flex-col h-full bg-brand-surface rounded-2xl shadow-sm border border-brand-border">
            {/* Header */}
            <div className="p-6 border-b border-brand-border flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-brand-textPrimary flex items-center gap-2">
                        <Inbox size={24} className="text-brand-primary" />
                        Pending Files
                    </h2>
                    <p className="text-sm text-brand-textSecondary mt-1">
                        Files awaiting assignment to a patient record.
                    </p>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                    </div>
                ) : documents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-brand-textSecondary">
                        <div className="w-24 h-24 bg-brand-bg rounded-full flex items-center justify-center mb-4">
                            <Inbox size={40} className="text-brand-primary/50" />
                        </div>
                        <p className="font-semibold text-lg">No pending files</p>
                        <p className="text-sm">All uploaded documents have been assigned.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {documents.map((doc) => (
                            <div key={doc.id} className="bg-brand-bg border border-brand-border rounded-xl p-5 flex flex-col hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                                        {getFileIcon(doc.mime_type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-brand-textPrimary truncate" title={doc.name}>
                                            {doc.name}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs font-medium text-brand-textSecondary mt-1">
                                            <FileDigit size={12} />
                                            <span>{formatBytes(doc.file_size)}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-2 mb-6 flex-1">
                                    <div className="flex items-center gap-2 text-xs text-brand-textSecondary">
                                        <Calendar size={14} className="text-brand-textPrimary/50" />
                                        <span>{formatDate(doc.created_at)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-brand-textSecondary">
                                        <User size={14} className="text-brand-textPrimary/50" />
                                        <span className="truncate">Uploaded by: <span className="font-semibold text-brand-textPrimary">{doc.uploader?.name || 'Unknown'}</span></span>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-auto">
                                    <button 
                                        className="flex-1 py-2 text-xs font-bold rounded-lg border border-brand-border text-brand-textPrimary hover:bg-brand-surface transition-colors"
                                        onClick={() => {
                                            if (doc.previewUrl) {
                                                window.open(doc.previewUrl, '_blank');
                                            } else {
                                                alert("Preview URL is not available. Ensure AWS credentials are correct.");
                                            }
                                        }}
                                        title="Preview Document"
                                    >
                                        Preview
                                    </button>
                                    <button 
                                        className="flex-1 py-2 text-xs font-bold rounded-lg bg-brand-primary text-white shadow-sm hover:shadow transition-shadow"
                                        onClick={() => setSelectedDocToAssign({ id: doc.id, name: doc.name })}
                                        title="Assign to Patient"
                                    >
                                        Assign
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (confirm('WARNING: Are you sure you want to permanently delete this document? This cannot be undone.')) {
                                                try {
                                                    await api.deleteDocument(doc.id);
                                                    alert('Document deleted successfully.');
                                                    fetchDocuments(); // refresh list
                                                } catch (err: any) {
                                                    alert(err.message || 'Failed to delete document.');
                                                }
                                            }
                                        }}
                                        className="px-3 py-2 text-brand-textSecondary hover:text-brand-error hover:bg-red-50 rounded-lg transition-colors border border-brand-border"
                                        title="Delete Permanently"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Assignment Modal */}
            {selectedDocToAssign && (
                <AssignDocumentModal 
                    documentId={selectedDocToAssign.id}
                    documentName={selectedDocToAssign.name}
                    onClose={() => setSelectedDocToAssign(null)}
                    onSuccess={() => {
                        setSelectedDocToAssign(null);
                        fetchDocuments(); // refresh list
                    }}
                />
            )}

            {/* Footer Pagination */}
            {!isLoading && totalPages > 1 && (
                <div className="p-4 border-t border-brand-border bg-brand-bg flex items-center justify-between rounded-b-2xl">
                    <button 
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${page === 1 ? 'text-brand-textSecondary/50 cursor-not-allowed' : 'text-brand-textPrimary hover:bg-brand-surface border border-brand-border'}`}
                    >
                        <ChevronLeft size={16} /> Prev
                    </button>
                    <span className="text-sm font-medium text-brand-textSecondary">
                        Page {page} of {totalPages}
                    </span>
                    <button 
                        disabled={page === totalPages}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${page === totalPages ? 'text-brand-textSecondary/50 cursor-not-allowed' : 'text-brand-textPrimary hover:bg-brand-surface border border-brand-border'}`}
                    >
                        Next <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};
