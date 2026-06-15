import React from 'react';

export const MockDashboard: React.FC<{ variant?: 'main' | 'secondary' | 'tertiary' }> = ({ variant = 'main' }) => {
    return (
        <div className="w-full h-full bg-white flex flex-col overflow-hidden relative select-none">
            {/* Header */}
            <div className="h-8 border-b border-slate-100 flex items-center px-4 justify-between bg-slate-50/50">
                <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-red-400/80"></div>
                    <div className="w-2 h-2 rounded-full bg-amber-400/80"></div>
                    <div className="w-2 h-2 rounded-full bg-green-400/80"></div>
                </div>
                <div className="h-2 w-20 bg-slate-200 rounded-full"></div>
            </div>

            {/* Body */}
            <div className="flex-1 flex">
                {/* Sidebar */}
                <div className="w-16 border-r border-slate-100 flex flex-col items-center py-4 space-y-4 bg-slate-50/30">
                    <div className="w-8 h-8 rounded-lg bg-brand-primary/10"></div>
                    <div className="w-6 h-6 rounded-md bg-slate-100"></div>
                    <div className="w-6 h-6 rounded-md bg-slate-100"></div>
                    <div className="w-6 h-6 rounded-md bg-slate-100"></div>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 bg-white">
                    {variant === 'main' && (
                        <>
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <div className="h-4 w-32 bg-slate-100 rounded mb-2"></div>
                                    <div className="h-6 w-48 bg-slate-800 rounded"></div>
                                </div>
                                <div className="h-8 w-8 rounded-full bg-brand-accent/20"></div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="h-20 rounded-xl bg-brand-soft/30 border border-brand-soft p-3">
                                    <div className="h-3 w-3 rounded-full bg-brand-primary mb-2"></div>
                                    <div className="h-2 w-12 bg-slate-200 rounded"></div>
                                </div>
                                <div className="h-20 rounded-xl bg-slate-50 border border-slate-100 p-3">
                                    <div className="h-3 w-3 rounded-full bg-brand-secondary mb-2"></div>
                                    <div className="h-2 w-12 bg-slate-200 rounded"></div>
                                </div>
                                <div className="h-20 rounded-xl bg-slate-50 border border-slate-100 p-3">
                                    <div className="h-3 w-3 rounded-full bg-brand-accent mb-2"></div>
                                    <div className="h-2 w-12 bg-slate-200 rounded"></div>
                                </div>
                            </div>
                            <div className="h-32 rounded-xl bg-slate-50 border border-slate-100 p-4 flex items-end space-x-2">
                                {[40, 60, 45, 70, 50, 80, 65].map((h, i) => (
                                    <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-brand-primary/20 rounded-t-sm hover:bg-brand-primary/40 transition-colors"></div>
                                ))}
                            </div>
                        </>
                    )}

                    {variant === 'secondary' && (
                        <div className="space-y-3">
                            <div className="h-4 w-24 bg-slate-100 rounded mb-4"></div>
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="flex items-center p-2 rounded-lg border border-slate-50 hover:bg-slate-50 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 mr-3"></div>
                                    <div className="flex-1">
                                        <div className="h-2 w-20 bg-slate-200 rounded mb-1"></div>
                                        <div className="h-2 w-12 bg-slate-100 rounded"></div>
                                    </div>
                                    <div className="w-16 h-6 rounded-full bg-brand-soft/50"></div>
                                </div>
                            ))}
                        </div>
                    )}

                    {variant === 'tertiary' && (
                        <div className="h-full flex flex-col">
                            <div className="h-4 w-32 bg-slate-100 rounded mb-4"></div>
                            <div className="flex-1 rounded-xl bg-slate-50 border border-slate-100 p-4 relative overflow-hidden">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-32 h-32 rounded-full border-8 border-slate-100 border-t-brand-accent rotate-45"></div>
                                </div>
                                <div className="absolute bottom-4 left-4 right-4 flex justify-between">
                                    <div className="h-2 w-10 bg-slate-200 rounded"></div>
                                    <div className="h-2 w-10 bg-slate-200 rounded"></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
