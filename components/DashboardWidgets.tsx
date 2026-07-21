import React from 'react';
import { Activity, AlertTriangle, Pill, FileText, Info } from 'lucide-react';

export const DynamicTrendChart = ({ vitals }: { vitals: any[] }) => {
    if (!vitals || vitals.length === 0 || (vitals.length === 1 && vitals[0].vital_type === 'System')) {
        return (
            <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border shadow-sm flex flex-col items-center justify-center h-48">
                <Activity size={32} className="text-brand-textSecondary mb-2 opacity-50" />
                <p className="text-sm font-bold text-brand-textSecondary">No Metrics Logged</p>
            </div>
        );
    }

    // Determine the most frequently logged metric type to chart
    const typeCounts: Record<string, number> = {};
    vitals.forEach(v => {
        typeCounts[v.vital_type] = (typeCounts[v.vital_type] || 0) + 1;
    });
    const primaryType = Object.keys(typeCounts).reduce((a, b) => typeCounts[a] > typeCounts[b] ? a : b);
    
    const readings = vitals.filter(v => v.vital_type === primaryType).reverse(); // Oldest to newest
    const isComposite = readings[0].vital_value.includes('/');

    // Parse Data with NaN Crash Protection
    const parsedData = readings.map(v => {
        if (isComposite) {
            const parts = v.vital_value.split('/');
            const sys = parseInt(parts[0]?.replace(/[^\d]/g, '') || '0', 10);
            const dia = parseInt(parts[1]?.replace(/[^\d]/g, '') || '0', 10);
            return { val1: isNaN(sys) ? 0 : sys, val2: isNaN(dia) ? 0 : dia };
        } else {
            const val = parseInt(v.vital_value.replace(/[^\d.]/g, '') || '0', 10);
            return { val1: isNaN(val) ? 0 : val, val2: null };
        }
    });

    const width = 400;
    const height = 150;
    const padding = 20;

    const maxVal = Math.max(...parsedData.map(p => Math.max(p.val1, p.val2 || 0)), 100);
    const minVal = Math.min(...parsedData.map(p => Math.min(p.val1, p.val2 || p.val1)), 0);
    const range = Math.max(maxVal - minVal + 20, 10); // Prevent divide by zero

    const stepX = (width - padding * 2) / Math.max(parsedData.length - 1, 1);

    const line1Points = parsedData.map((p, i) => `${padding + i * stepX},${height - padding - ((p.val1 - minVal) / range) * (height - padding * 2)}`).join(' ');
    const line2Points = isComposite ? parsedData.map((p, i) => `${padding + i * stepX},${height - padding - (((p.val2 as number) - minVal) / range) * (height - padding * 2)}`).join(' ') : '';

    const formatType = (type: string) => type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    return (
        <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border shadow-sm">
            <h3 className="font-bold text-brand-textPrimary mb-4 flex items-center">
                <Activity size={18} className="mr-2 text-brand-primary" /> {formatType(primaryType)} Trend
            </h3>
            <div className="relative w-full overflow-x-auto">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[300px]">
                    <line x1={padding} y1={padding} x2={width-padding} y2={padding} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1={padding} y1={height/2} x2={width-padding} y2={height/2} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1={padding} y1={height-padding} x2={width-padding} y2={height-padding} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
                    
                    <polyline points={line1Points} fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    {isComposite && <polyline points={line2Points} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
                    
                    {parsedData.map((p, i) => {
                        const x = padding + i * stepX;
                        const y1 = height - padding - ((p.val1 - minVal) / range) * (height - padding * 2);
                        const y2 = isComposite ? height - padding - (((p.val2 as number) - minVal) / range) * (height - padding * 2) : 0;
                        return (
                            <g key={i}>
                                <circle cx={x} cy={y1} r="4" fill="#ef4444" />
                                {isComposite && <circle cx={x} cy={y2} r="4" fill="#3b82f6" />}
                                {i === parsedData.length - 1 && (
                                    <>
                                        <text x={x - 25} y={y1 - 10} fontSize="10" fill="#ef4444" fontWeight="bold">{p.val1}</text>
                                        {isComposite && <text x={x - 25} y={y2 + 15} fontSize="10" fill="#3b82f6" fontWeight="bold">{p.val2}</text>}
                                    </>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>
            {isComposite && (
                <div className="flex justify-center space-x-6 mt-2 text-xs font-bold text-brand-textSecondary">
                    <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span> High/Sys</div>
                    <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span> Low/Dia</div>
                </div>
            )}
        </div>
    );
};

export const ClinicalAlertsWidget = ({ alerts }: { alerts: any[] }) => {
    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return 'bg-red-100 text-red-700 border-red-200';
            case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'LOW': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-gray-50 text-gray-600 border-gray-200';
        }
    };

    return (
        <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border shadow-sm">
            <h3 className="font-bold text-brand-textPrimary mb-4 flex items-center">
                <AlertTriangle size={18} className="mr-2 text-orange-500" /> Clinical Alerts & Tags
            </h3>
            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {alerts?.map((alert, idx) => (
                    <div 
                        key={idx} 
                        className={`p-3 rounded-xl border flex flex-col ${getSeverityColor(alert.severity)}`}
                        title={alert.reaction || alert.allergy_name} // Tooltip for full text
                    >
                        <div className="flex justify-between items-start">
                            <span className="text-sm font-bold line-clamp-1">{alert.allergy_name}</span>
                            {alert.severity && <span className="opacity-80 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-white/50 rounded-full ml-2">{alert.severity}</span>}
                        </div>
                        {alert.reaction && (
                            <div className="flex items-start mt-2 text-xs opacity-90 line-clamp-2">
                                <Info size={12} className="mr-1 mt-0.5 flex-shrink-0" />
                                <span>{alert.reaction}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export const ConditionsWidget = ({ conditions }: { conditions: any[] }) => {
    return (
        <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border shadow-sm">
            <h3 className="font-bold text-brand-textPrimary mb-4 flex items-center">
                <FileText size={18} className="mr-2 text-brand-primary" /> Active Conditions
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {conditions?.map((cond, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-brand-bg rounded-xl border border-brand-border" title={cond.condition_name}>
                        <span className="text-sm font-bold text-brand-textPrimary line-clamp-1 pr-2">{cond.condition_name}</span>
                        {cond.status === 'ACTIVE' ? (
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0"></span>
                        ) : (
                            <span className="text-xs text-brand-textSecondary flex-shrink-0">{cond.status}</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export const TreatmentsWidget = ({ treatments }: { treatments: any[] }) => {
    return (
        <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border shadow-sm">
            <h3 className="font-bold text-brand-textPrimary mb-4 flex items-center">
                <Pill size={18} className="mr-2 text-green-500" /> Ongoing Treatments
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {treatments?.map((treatment, idx) => (
                    <div key={idx} className="p-3 bg-brand-bg rounded-xl border border-brand-border" title={treatment.treatment_name}>
                        <p className="text-sm font-bold text-brand-textPrimary line-clamp-1">{treatment.treatment_name}</p>
                        {treatment.status && <p className="text-xs text-brand-textSecondary mt-1">{treatment.status}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
};
