import React from 'react';
import { Calendar, Pill, Activity, User, FileText, CheckCircle2 } from 'lucide-react';
import { formatLocalDate, formatLocalTime } from '../../utils/dateFormatter';

interface TimelineItemProps {
    date: string;
    type: string;
    children: React.ReactNode;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({ date, type, children }) => {
    // Format date string beautifully using explicit timezone parser
    const formattedDate = formatLocalDate(date);
    const formattedTime = formatLocalTime(date);

    // Determine Icon and Color based on type
    let Icon = CheckCircle2;
    let bgColor = 'bg-brand-primary';
    let ringColor = 'ring-brand-primary/20';

    switch (type) {
        case 'appointment':
        case 'consultation':
            Icon = User;
            bgColor = 'bg-blue-500';
            ringColor = 'ring-blue-500/20';
            break;
        case 'prescription':
            Icon = Pill;
            bgColor = 'bg-emerald-500';
            ringColor = 'ring-emerald-500/20';
            break;
        case 'investigation':
            Icon = Activity;
            bgColor = 'bg-purple-500';
            ringColor = 'ring-purple-500/20';
            break;
    }

    return (
        <div className="relative z-10 flex gap-4 sm:gap-6 w-full animate-fade-in">
            {/* Left Date Column (Desktop) */}
            <div className="hidden sm:block w-24 text-right flex-shrink-0 pt-2">
                <p className="text-sm font-bold text-brand-textPrimary">{formattedDate}</p>
                <p className="text-xs text-brand-textSecondary">{formattedTime}</p>
            </div>

            {/* Center Node */}
            <div className="relative flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm ring-4 ${ringColor} ${bgColor} z-10 -ml-[19px] sm:ml-0 flex-shrink-0`}>
                    <Icon size={14} />
                </div>
            </div>

            {/* Right Content Column */}
            <div className="flex-1 pb-2">
                <div className="sm:hidden mb-2">
                    <span className="text-xs font-bold text-brand-textPrimary bg-brand-bg px-2 py-1 rounded-md border border-brand-border">
                        {formattedDate} {formattedTime}
                    </span>
                </div>
                <div className="w-full transition-transform hover:-translate-y-0.5 duration-200">
                    {children}
                </div>
            </div>
        </div>
    );
};
