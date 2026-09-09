import React from 'react';
import { Activity, AlertTriangle, Pill, FileText, Info, HeartPulse, Thermometer, Weight, Stethoscope, Calendar, Droplet, Heart, ChevronRight } from 'lucide-react';

export const DynamicTrendChart = ({ vitals }: { vitals: any[] }) => {
    if (!vitals || vitals.length === 0 || (vitals.length === 1 && vitals[0].vital_type === 'System')) {
        return (
            <div className="bg-slate-50/50 rounded-lg border border-dashed border-brand-border p-6 flex flex-col items-center justify-center text-center">
                <HeartPulse size={24} className="text-slate-300 mb-1.5" />
                <p className="text-xs font-semibold text-brand-textSecondary">No physiological trend data logged yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Record multiple readings to view baseline trend graphs</p>
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
    const height = 120;
    const padding = 15;

    const maxVal = Math.max(...parsedData.map(p => Math.max(p.val1, p.val2 || 0)), 100);
    const minVal = Math.min(...parsedData.map(p => Math.min(p.val1, p.val2 || p.val1)), 0);
    const range = Math.max(maxVal - minVal + 20, 10); // Prevent divide by zero

    const stepX = (width - padding * 2) / Math.max(parsedData.length - 1, 1);

    const line1Points = parsedData.map((p, i) => `${padding + i * stepX},${height - padding - ((p.val1 - minVal) / range) * (height - padding * 2)}`).join(' ');
    const line2Points = isComposite ? parsedData.map((p, i) => `${padding + i * stepX},${height - padding - (((p.val2 as number) - minVal) / range) * (height - padding * 2)}`).join(' ') : '';

    const formatType = (type: string) => type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    return (
        <div className="bg-white p-3.5 rounded-lg border border-brand-border shadow-2xs">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold text-brand-textPrimary flex items-center gap-1.5">
                    <Activity size={14} className="text-brand-primary" /> {formatType(primaryType)} Trend
                </h4>
                {isComposite && (
                    <div className="flex items-center space-x-3 text-[10px] font-semibold text-brand-textSecondary">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Systolic</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Diastolic</span>
                    </div>
                )}
            </div>
            <div className="relative w-full overflow-x-auto">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[280px]">
                    <line x1={padding} y1={padding} x2={width-padding} y2={padding} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1={padding} y1={height/2} x2={width-padding} y2={height/2} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1={padding} y1={height-padding} x2={width-padding} y2={height-padding} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                    
                    <polyline points={line1Points} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {isComposite && <polyline points={line2Points} fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
                    
                    {parsedData.map((p, i) => {
                        const x = padding + i * stepX;
                        const y1 = height - padding - ((p.val1 - minVal) / range) * (height - padding * 2);
                        const y2 = isComposite ? height - padding - (((p.val2 as number) - minVal) / range) * (height - padding * 2) : 0;
                        return (
                            <g key={i}>
                                <circle cx={x} cy={y1} r="3.5" fill="#ef4444" />
                                {isComposite && <circle cx={x} cy={y2} r="3.5" fill="#0284c7" />}
                                {i === parsedData.length - 1 && (
                                    <>
                                        <text x={x - 20} y={y1 - 8} fontSize="9" fill="#ef4444" fontWeight="bold">{p.val1}</text>
                                        {isComposite && <text x={x - 20} y={y2 + 12} fontSize="9" fill="#0284c7" fontWeight="bold">{p.val2}</text>}
                                    </>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>
            <div className="flex justify-end mt-2 pt-2 border-t border-slate-100">
                <button
                    onClick={() => {
                        const el = document.getElementById('vitals-history-table');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-2.5 py-1 text-xs font-bold text-brand-primary hover:text-brand-primaryDark hover:bg-blue-50 rounded transition-colors flex items-center gap-1"
                >
                    View History <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
};

export const ClinicalAlertsWidget = ({ alerts }: { alerts: any[] }) => {
    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return 'bg-red-50 text-red-700 border-red-200';
            case 'HIGH': return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'MEDIUM': return 'bg-amber-50 text-amber-700 border-amber-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="bg-white p-3.5 rounded-lg border border-brand-border shadow-2xs flex flex-col">
            <h4 className="text-xs font-bold text-brand-textPrimary mb-2.5 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-500" /> Clinical Alerts & Allergies
            </h4>
            
            {!alerts || alerts.length === 0 ? (
                <div className="p-3 bg-emerald-50/50 border border-emerald-200/60 rounded-md flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold text-emerald-800">No Known Allergies (NKA)</span>
                </div>
            ) : (
                <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar">
                    {alerts.map((alert, idx) => (
                        <div 
                            key={idx} 
                            className={`p-2 rounded-md border flex flex-col ${getSeverityColor(alert.severity)}`}
                        >
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold">{alert.allergy_name}</span>
                                {alert.severity && (
                                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 bg-white/70 rounded border">
                                        {alert.severity}
                                    </span>
                                )}
                            </div>
                            {alert.reaction && (
                                <p className="text-[11px] mt-1 opacity-90">{alert.reaction}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const ConditionsWidget = ({ conditions }: { conditions: any[] }) => {
    return (
        <div className="bg-white p-3.5 rounded-lg border border-brand-border shadow-2xs flex flex-col">
            <h4 className="text-xs font-bold text-brand-textPrimary mb-2.5 flex items-center gap-1.5">
                <FileText size={14} className="text-brand-primary" /> Active Conditions & History
            </h4>
            
            {!conditions || conditions.length === 0 ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-500">
                    No prior chronic conditions on file
                </div>
            ) : (
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto custom-scrollbar">
                    {conditions.map((cond, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded-md border border-slate-200 text-xs">
                            <span className="font-semibold text-slate-800">{cond.condition_name}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                                {cond.status || 'ACTIVE'}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const TreatmentsWidget = ({ treatments }: { treatments: any[] }) => {
    return (
        <div className="bg-white p-3.5 rounded-lg border border-brand-border shadow-2xs flex flex-col">
            <h4 className="text-xs font-bold text-brand-textPrimary mb-2.5 flex items-center gap-1.5">
                <Pill size={14} className="text-brand-primary" /> Ongoing Treatments & Meds
            </h4>
            
            {!treatments || treatments.length === 0 ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-500">
                    No active ongoing treatments
                </div>
            ) : (
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto custom-scrollbar">
                    {treatments.map((t, idx) => (
                        <div key={idx} className="p-2 bg-slate-50 rounded-md border border-slate-200 text-xs">
                            <p className="font-semibold text-slate-800">{t.name || t.treatment_name}</p>
                            {t.dosage && <p className="text-[11px] text-slate-500 mt-0.5">{t.dosage}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const VitalsHistoryWidget = ({ vitals }: { vitals: any[] }) => {
    // Group vitals by formatted date and time
    const groupedVitals: Record<string, { dateObj: Date; dateStr: string; timeStr: string; values: Record<string, any> }> = {};
    
    (vitals || []).forEach(v => {
        const recordDate = v.created_at || v.createdAt || v.recorded_at || v.timestamp || v.date || new Date().toISOString();
        const dateObj = new Date(recordDate);
        const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const timeStr = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        const dateTimeKey = `${dateStr} ${timeStr}`;
        
        if (!groupedVitals[dateTimeKey]) {
            groupedVitals[dateTimeKey] = { dateObj, dateStr, timeStr, values: {} };
        }
        
        const typeLower = (v.vital_type || v.vital_name || v.type || '').toLowerCase();
        let colKey = typeLower;
        if (typeLower.includes('blood') || typeLower.includes('bp')) colKey = 'bp';
        else if (typeLower.includes('heart') || typeLower.includes('pulse') || typeLower.includes('hr')) colKey = 'hr';
        else if (typeLower.includes('temp')) colKey = 'temp';
        else if (typeLower.includes('weight') || typeLower.includes('wt')) colKey = 'weight';
        
        groupedVitals[dateTimeKey].values[colKey] = v;
    });

    const rows = Object.values(groupedVitals).sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

    return (
        <div id="vitals-history-table" className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col mt-4 mb-4">
            {/* Header */}
            <div className="p-3.5 flex justify-between items-center border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <Activity className="text-brand-primary" size={18} strokeWidth={2.5} />
                    <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">Vitals History Flowsheet</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">Comprehensive history of recorded vitals</p>
                    </div>
                </div>
            </div>

            {/* Spreadsheet Table */}
            <div className="overflow-x-auto p-3 pt-2">
                <table className="w-full text-center text-xs border-collapse border border-slate-300 min-w-[500px]">
                    <thead className="bg-[#e2eff9]">
                        <tr className="text-slate-700 text-[10px] uppercase font-bold tracking-wider">
                            <th className="p-2 border border-slate-300 w-28">DATE</th>
                            <th className="p-2 border border-slate-300 w-24">TIME</th>
                            <th className="p-2 border border-slate-300">BLOOD PRESSURE</th>
                            <th className="p-2 border border-slate-300">HEART RATE <span className="text-[9px] font-normal lowercase">(bpm)</span></th>
                            <th className="p-2 border border-slate-300">TEMPERATURE</th>
                            <th className="p-2 border border-slate-300">WEIGHT</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {rows.length > 0 ? (
                            rows.map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-2 border border-slate-300 font-medium text-slate-700 whitespace-nowrap text-xs">
                                        {row.dateStr}
                                    </td>
                                    <td className="p-2 border border-slate-300 font-medium text-slate-700 whitespace-nowrap text-xs">
                                        {row.timeStr}
                                    </td>
                                    <td className="p-2 border border-slate-300 text-slate-800 font-semibold text-xs">
                                        {row.values['bp'] ? (
                                            <span>{row.values['bp'].vital_value || row.values['bp'].value} <span className="text-[10px] text-slate-400 font-normal">{row.values['bp'].unit || 'mmHg'}</span></span>
                                        ) : '-'}
                                    </td>
                                    <td className="p-2 border border-slate-300 text-slate-800 font-semibold text-xs">
                                        {row.values['hr'] ? (
                                            <span>{row.values['hr'].vital_value || row.values['hr'].value} <span className="text-[10px] text-slate-400 font-normal">{row.values['hr'].unit || 'bpm'}</span></span>
                                        ) : '-'}
                                    </td>
                                    <td className="p-2 border border-slate-300 text-slate-800 font-semibold text-xs">
                                        {row.values['temp'] ? (
                                            <span>{row.values['temp'].vital_value || row.values['temp'].value} <span className="text-[10px] text-slate-400 font-normal">{row.values['temp'].unit || '°F'}</span></span>
                                        ) : '-'}
                                    </td>
                                    <td className="p-2 border border-slate-300 text-slate-800 font-semibold text-xs">
                                        {row.values['weight'] ? (
                                            <span>{row.values['weight'].vital_value || row.values['weight'].value} <span className="text-[10px] text-slate-400 font-normal">{row.values['weight'].unit || 'kg'}</span></span>
                                        ) : '-'}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="p-4 text-center text-slate-500 text-xs font-medium">
                                    No recorded vitals yet for this patient. Click "Record Vitals" to add entries.
                                </td>
                            </tr>
                        )}
                        
                        {/* Empty padding rows to make it look like a spreadsheet */}
                        {rows.length < 4 && Array.from({ length: 4 - (rows.length || 1) }).map((_, idx) => (
                            <tr key={`empty-${idx}`}>
                                <td className="p-2 border border-slate-300 h-8"></td>
                                <td className="p-2 border border-slate-300 h-8"></td>
                                <td className="p-2 border border-slate-300 h-8"></td>
                                <td className="p-2 border border-slate-300 h-8"></td>
                                <td className="p-2 border border-slate-300 h-8"></td>
                                <td className="p-2 border border-slate-300 h-8"></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

