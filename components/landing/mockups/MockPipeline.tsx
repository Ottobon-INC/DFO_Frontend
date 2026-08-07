import React from 'react';

export const MockPipeline: React.FC = () => {
    return (
        <div className="w-full h-full bg-white flex flex-col overflow-hidden relative select-none">
            <div className="h-10 border-b border-slate-100 flex items-center px-4 justify-between bg-white">
                <div className="h-4 w-24 bg-slate-800 rounded"></div>
                <div className="flex space-x-2">
                    <div className="h-6 w-20 bg-brand-primary text-white text-[8px] flex items-center justify-center rounded">Add Lead</div>
                </div>
            </div>
            <div className="flex-1 p-4 bg-slate-50 flex space-x-4 overflow-hidden">
                {['New Leads', 'Contacted', 'Consultation'].map((col, i) => (
                    <div key={i} className="flex-1 flex flex-col">
                        <div className="h-3 w-16 bg-slate-400 rounded mb-3 opacity-50"></div>
                        <div className="space-y-3">
                            <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100">
                                <div className="h-2 w-12 bg-brand-secondary/20 rounded mb-2"></div>
                                <div className="h-3 w-24 bg-slate-700 rounded mb-2"></div>
                                <div className="flex justify-between items-center">
                                    <div className="h-4 w-4 rounded-full bg-slate-100"></div>
                                    <div className="h-2 w-8 bg-slate-200 rounded"></div>
                                </div>
                            </div>
                            {i === 0 && (
                                <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 opacity-60">
                                    <div className="h-2 w-12 bg-brand-accent/20 rounded mb-2"></div>
                                    <div className="h-3 w-20 bg-slate-700 rounded"></div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
