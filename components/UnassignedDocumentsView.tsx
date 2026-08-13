import React, { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Image as ImageIcon, Calendar, User, FileDigit, ChevronLeft, ChevronRight, Inbox, Trash2, X, CheckCircle, AlertCircle, RefreshCw, Minus } from 'lucide-react';
import { api } from '../services/api';
import { TriageDocument } from '../types';
import { AssignDocumentModal } from './AssignDocumentModal';
import toast from 'react-hot-toast';

interface UploadTask {
    id: string;
    file: File;
    status: 'waiting' | 'uploading' | 'success' | 'error';
    errorMsg?: string;
}

export const UnassignedDocumentsView: React.FC = () => {
    const [documents, setDocuments] = useState<TriageDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedDocToAssign, setSelectedDocToAssign] = useState<{ id: string, name: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const limit = 12;

    // Bulk Upload State
    const [uploadQueue, setUploadQueue] = useState<UploadTask[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploadWidgetMinimized, setIsUploadWidgetMinimized] = useState(false);

    useEffect(() => {
        fetchDocuments();
    }, [page]);

    // Upload Queue Engine
    useEffect(() => {
        const processQueue = async () => {
            const waitingTasks = uploadQueue.filter(t => t.status === 'waiting');
            const uploadingTasks = uploadQueue.filter(t => t.status === 'uploading');
            
            // Concurrency limit of 3
            if (waitingTasks.length > 0 && uploadingTasks.length < 3) {
                const tasksToStart = waitingTasks.slice(0, 3 - uploadingTasks.length);
                
                tasksToStart.forEach(task => {
                    setUploadQueue(prev => prev.map(t => t.id === task.id ? { ...t, status: 'uploading' } : t));
                    
                    api.uploadUnassignedDocument(task.file)
                        .then(res => {
                            if (res.success) {
                                setUploadQueue(prev => prev.map(t => t.id === task.id ? { ...t, status: 'success' } : t));
                                fetchDocuments(); // Quietly refresh the grid
                            } else {
                                setUploadQueue(prev => prev.map(t => t.id === task.id ? { ...t, status: 'error', errorMsg: res.error || 'Upload failed' } : t));
                            }
                        })
                        .catch(err => {
                            setUploadQueue(prev => prev.map(t => t.id === task.id ? { ...t, status: 'error', errorMsg: err.message || 'Upload failed' } : t));
                        });
                });
            }
        };

        processQueue();
    }, [uploadQueue]);

    const handleFilesAdded = (files: FileList | File[]) => {
        if (!files || files.length === 0) return;
        
        const newTasks: UploadTask[] = Array.from(files).map(file => ({
            id: Math.random().toString(36).substring(2, 9),
            file,
            status: 'waiting'
        }));
        
        setUploadQueue(prev => [...prev, ...newTasks]);
        setIsUploadWidgetMinimized(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) handleFilesAdded(e.target.files);
    };

    // Drag and Drop Handlers
    const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const onDragEnter = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) handleFilesAdded(e.dataTransfer.files);
    };

    const retryUpload = (taskId: string) => {
        setUploadQueue(prev => prev.map(t => t.id === taskId ? { ...t, status: 'waiting', errorMsg: undefined } : t));
    };

    const removeTask = (taskId: string) => {
        setUploadQueue(prev => prev.filter(t => t.id !== taskId));
    };

    const fetchDocuments = async () => {
        // Only set loading if it's initial load or we don't have docs yet, so background refresh is invisible
        if (documents.length === 0) setIsLoading(true);
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
        <div 
            className={`flex flex-col h-full bg-brand-surface rounded-2xl shadow-sm border border-brand-border relative transition-all duration-300 ${isDragging ? 'ring-4 ring-brand-primary/50 bg-brand-primary/5' : ''}`}
            onDragOver={onDragOver}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            {/* Drag Overlay */}
            {isDragging && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-brand-surface/80 backdrop-blur-sm rounded-2xl border-4 border-dashed border-brand-primary pointer-events-none">
                    <Upload size={64} className="text-brand-primary mb-4 animate-bounce" />
                    <h2 className="text-3xl font-bold text-brand-primary">Drop files here</h2>
                    <p className="text-brand-textSecondary mt-2">Upload multiple documents to the Pending Files queue</p>
                </div>
            )}

            {/* Header */}
            <div className="p-6 border-b border-brand-border flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-brand-textPrimary flex items-center gap-2">
                        <Inbox size={24} className="text-brand-primary" />
                        Pending Files
                    </h2>
                    <p className="text-sm text-brand-textSecondary mt-1">
                        Files awaiting assignment to a patient record. Drag & Drop multiple files here.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <input 
                        type="file" 
                        multiple
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden" 
                        accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white text-sm font-bold rounded-xl shadow-sm hover:shadow transition-all"
                    >
                        <Upload size={18} />
                        Upload Files
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                    </div>
                ) : documents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-brand-textSecondary border-2 border-dashed border-brand-border rounded-xl bg-brand-bg/50">
                        <div className="w-24 h-24 bg-brand-bg rounded-full flex items-center justify-center mb-4 shadow-sm">
                            <Inbox size={40} className="text-brand-primary/50" />
                        </div>
                        <p className="font-semibold text-lg">No pending files</p>
                        <p className="text-sm mb-6">All uploaded documents have been assigned. Drag and drop new files here.</p>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white text-sm font-bold rounded-xl shadow-md hover:-translate-y-0.5 transition-all"
                        >
                            <Upload size={18} />
                            Select Files to Upload
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {documents.map((doc) => (
                            <div key={doc.id} className="bg-brand-bg border border-brand-border rounded-xl p-5 flex flex-col hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-brand-surface shadow-sm flex items-center justify-center flex-shrink-0">
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
                                            if (doc.previewUrl) window.open(doc.previewUrl, '_blank');
                                            else toast("Preview URL is not available.");
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
                                            if (confirm('WARNING: Are you sure you want to permanently delete this document?')) {
                                                try {
                                                    await api.deleteDocument(doc.id);
                                                    toast.success('Document deleted successfully.');
                                                    fetchDocuments();
                                                } catch (err: any) {
                                                    toast.error(err.message || 'Failed to delete document.');
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
                        fetchDocuments();
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

            {/* Upload Manager Widget */}
            {uploadQueue.length > 0 && (
                <div className="fixed bottom-6 right-6 w-96 bg-brand-surface shadow-2xl rounded-2xl border border-brand-border z-[100] flex flex-col overflow-hidden animate-slide-up">
                    <div className="bg-brand-bg p-3 border-b border-brand-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Upload size={16} className="text-brand-primary" />
                            <span className="font-bold text-brand-textPrimary text-sm">
                                Uploads ({uploadQueue.filter(t => t.status === 'success').length}/{uploadQueue.length})
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setIsUploadWidgetMinimized(!isUploadWidgetMinimized)} className="p-1 text-brand-textSecondary hover:bg-brand-surface rounded-md transition-colors">
                                <Minus size={16} />
                            </button>
                            <button onClick={() => setUploadQueue([])} className="p-1 text-brand-textSecondary hover:bg-brand-surface rounded-md transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                    
                    {!isUploadWidgetMinimized && (
                        <div className="max-h-64 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                            {uploadQueue.map(task => (
                                <div key={task.id} className="flex items-center p-2 hover:bg-brand-bg/50 rounded-lg transition-colors group">
                                    <div className="flex-shrink-0 w-8 flex items-center justify-center">
                                        {task.status === 'waiting' && <span className="w-2 h-2 rounded-full bg-brand-textSecondary/30"></span>}
                                        {task.status === 'uploading' && <RefreshCw size={16} className="text-brand-primary animate-spin" />}
                                        {task.status === 'success' && <CheckCircle size={16} className="text-green-500" />}
                                        {task.status === 'error' && <AlertCircle size={16} className="text-red-500" />}
                                    </div>
                                    <div className="flex-1 min-w-0 px-2">
                                        <p className="text-sm font-medium text-brand-textPrimary truncate">{task.file.name}</p>
                                        {task.status === 'error' && <p className="text-xs text-red-500 truncate">{task.errorMsg}</p>}
                                        {task.status === 'uploading' && <div className="h-1 bg-brand-border rounded-full mt-1 overflow-hidden"><div className="h-full bg-brand-primary w-1/2 animate-pulse rounded-full"></div></div>}
                                    </div>
                                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {task.status === 'error' ? (
                                            <button onClick={() => retryUpload(task.id)} className="p-1 text-brand-primary hover:bg-brand-primary/10 rounded" title="Retry">
                                                <RefreshCw size={14} />
                                            </button>
                                        ) : (
                                            <button onClick={() => removeTask(task.id)} className="p-1 text-brand-textSecondary hover:bg-brand-border rounded" title="Remove">
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
