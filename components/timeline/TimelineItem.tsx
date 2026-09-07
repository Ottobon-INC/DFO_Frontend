import React from 'react';
import { Calendar, Pill, Activity, User, FileText, CheckCircle2, Stethoscope, FileSpreadsheet } from 'lucide-react';
import { formatLocalDate, formatLocalTime } from '../../utils/dateFormatter';

interface TimelineItemProps {
    date: string | null | undefined;
    type: string;
    children: React.ReactNode;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({ date, type, children }) => {
    // Format date string
    const formattedDate = formatLocalDate(date);
    const formattedTime = formatLocalTime(date);

    const normalizedType = String(type || '').toLowerCase();

    // Determine Icon and Color based on normalized type
    let Icon = CheckCircle2;
    let iconBg = 'bg-sky-50 text-sky-700 border-sky-200';

    if (normalizedType.includes('appointment')) {
        Icon = Calendar;
        iconBg = 'bg-sky-50 text-sky-700 border-sky-300';
    } else if (normalizedType.includes('consultation')) {
        Icon = Stethoscope;
        iconBg = 'bg-blue-50 text-blue-700 border-blue-300';
    } else if (normalizedType.includes('prescription')) {
        Icon = Pill;
        iconBg = 'bg-emerald-50 text-emerald-700 border-emerald-300';
    } else if (normalizedType.includes('investigation') || normalizedType.includes('lab') || normalizedType.includes('document')) {
        Icon = FileText;
        iconBg = 'bg-violet-50 text-violet-700 border-violet-300';
    }

    return (
        <div className="relative z-10 flex gap-3 sm:gap-4 w-full animate-fade-in items-start">
            {/* Left Date Column (Desktop) */}
            <div className="hidden sm:block w-24 text-right flex-shrink-0 pt-1 -ml-28 pr-3">
                <p className="text-xs font-bold text-slate-800 tracking-tight leading-tight">{formattedDate}</p>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{formattedTime}</p>
            </div>

            {/* Center Node on the vertical timeline border */}
            <div className="absolute left-[-25px] sm:left-[-33px] flex items-center justify-center top-1">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center border shadow-2xs ${iconBg} z-10 flex-shrink-0 bg-white`}>
                    <Icon size={12} />
                </div>
            </div>

            {/* Right Event Card */}
            <div className="flex-1 min-w-0">
                <div className="sm:hidden mb-1 flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                    <span className="font-bold text-slate-800">{formattedDate}</span>
                    <span>•</span>
                    <span>{formattedTime}</span>
                </div>
                <div className="w-full">
                    {children}
                </div>
            </div>
        </div>
    );
};
