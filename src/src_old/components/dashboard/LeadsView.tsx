import React, { useState } from 'react';
import {
    UserPlus,
    Search,
    MoreVertical,
    Phone,
    Mail,
    Globe,
    Calendar,
    ArrowRight,
    Filter,
    CheckCircle2,
    Clock,
    ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Lead } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { triggerCall, triggerWhatsApp, triggerSmartCall } from '@/lib/communication';
import { MessageSquare } from 'lucide-react';



interface LeadsViewProps {
    leads: Lead[];
    onConvert: (lead: Lead) => Promise<{ success: boolean; error?: string }>;
}

export const LeadsView = ({ leads, onConvert }: LeadsViewProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [isConverting, setIsConverting] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

    const filteredLeads = leads.filter(l => {
        const nameMatch = l.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const phoneMatch = l.phone?.includes(searchTerm);
        return nameMatch || phoneMatch;
    });



    const handleConvert = async (lead: Lead) => {
        setIsConverting(true);
        const result = await onConvert(lead);
        setIsConverting(false);
        if (result.success) {
            setSelectedLead(null);
        } else {
            alert("Conversion failed: " + result.error);
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            <div className={cn(
                "flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                selectedLead && viewMode === 'detail' ? "hidden sm:flex" : "flex"
            )}>
                <div>
                    <h2 className="text-2xl font-black text-foreground tracking-tight">Leads & CRM</h2>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-tighter mt-1">Manage potential patients</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search leads..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 rounded border-border bg-card h-10"
                        />
                    </div>
                    <Button variant="outline" size="icon" className="rounded border-border shrink-0">
                        <Filter className="h-4 w-4" />
                    </Button>

                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={cn(
                    "lg:col-span-2 space-y-4",
                    selectedLead && viewMode === 'detail' ? "hidden lg:block" : "block"
                )}>
                    {filteredLeads.map(lead => (
                        <Card
                            key={lead.id}
                            className={cn(
                                "border-none shadow-sm hover:shadow-md transition-all cursor-pointer rounded-md group",
                                selectedLead?.id === lead.id ? "ring-2 ring-primary" : ""
                            )}
                            onClick={() => {
                                setSelectedLead(lead);
                                setViewMode('detail');
                            }}
                        >
                            <CardContent className="p-5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded bg-muted flex items-center justify-center border border-border group-hover:bg-primary/5 transition-colors">
                                        <UserPlus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-foreground">{lead.name || 'Untitled Lead'}</h4>

                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-tighter">
                                                {lead.source || 'Direct'}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground font-medium">Added {lead.createdAt ? format(new Date(lead.createdAt), 'MMM d, p') : 'Recent'}</span>
                                        </div>

                                    </div>

                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right hidden sm:block">
                                        <div className="flex items-center gap-1 justify-end">
                                            <Badge variant="outline" className={cn(
                                                "text-[9px] font-black uppercase",
                                                lead.status === 'NEW' ? "text-blue-500 border-blue-100 bg-blue-50" :
                                                    lead.status === 'CONTACTED' ? "text-amber-500 border-amber-100 bg-amber-50" :
                                                        "text-emerald-500 border-emerald-100 bg-emerald-50"
                                            )}>
                                                {lead.status}
                                            </Badge>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="rounded">
                                        <MoreVertical className="h-4 w-4 text-slate-400" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className={cn(
                    "lg:block",
                    selectedLead && viewMode === 'detail' ? "block" : "hidden lg:block"
                )}>
                    {selectedLead ? (
                        <Card className="border border-border shadow-none rounded-md sticky top-6 bg-card overflow-hidden">
                            <div className="h-20 md:h-24 bg-slate-900 relative">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="lg:hidden absolute top-4 left-4 text-white hover:bg-white/10"
                                    onClick={() => setViewMode('list')}
                                >
                                    <ArrowRight className="h-5 w-5 rotate-180" />
                                </Button>
                                <div className="absolute -bottom-10 left-8">
                                    <div className="h-16 w-16 md:h-20 md:w-20 rounded bg-card p-1 shadow-none">
                                        <div className="h-full w-full rounded bg-muted flex items-center justify-center border border-border">
                                            <UserPlus className="h-6 w-6 md:h-10 md:w-10 text-muted-foreground" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <CardContent className="pt-12 md:pt-14 pb-6 md:pb-8 px-5 md:px-8">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                                    <div>
                                        <h3 className="text-xl md:text-2xl font-black text-foreground">{selectedLead.name || 'Anonymous'}</h3>
                                        <p className="text-[10px] md:text-xs font-bold text-primary uppercase tracking-widest mt-1">Potential Patient</p>
                                    </div>
                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-3 py-1 font-black uppercase text-[9px] md:text-[10px] w-fit">
                                        {selectedLead.status || 'NEW'}
                                    </Badge>
                                </div>



                                <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                                    <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded bg-muted border border-border group hover:border-primary/20 transition-all">
                                        <div className="h-9 w-9 md:h-10 md:w-10 rounded bg-card border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary">
                                            <Phone className="h-4 w-4 md:h-5 md:w-5" />
                                        </div>
                                        <div>
                                            <p className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-tighter">Phone Number</p>
                                            <p className="font-bold text-foreground text-sm md:text-base">{selectedLead.phone || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded bg-muted border border-border">
                                        <div className="h-9 w-9 md:h-10 md:w-10 rounded bg-card border border-border flex items-center justify-center text-muted-foreground">
                                            <Clock className="h-4 w-4 md:h-5 md:w-5" />
                                        </div>
                                        <div>
                                            <p className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-tighter">Created Date</p>
                                            <p className="font-bold text-foreground text-sm md:text-base">{selectedLead.createdAt ? format(new Date(selectedLead.createdAt), 'MMM d, yyyy') : 'Recently'}</p>
                                        </div>
                                    </div>

                                </div>

                                <div className="grid grid-cols-3 gap-2 md:gap-3 mb-6 md:mb-8">
                                    <Button 
                                        variant="outline" 
                                        className="flex-col h-16 md:h-20 rounded gap-1 md:gap-2 border-border hover:bg-muted group text-foreground"
                                    >

                                        <div className="p-1.5 md:p-2 rounded bg-sky-50 text-sky-600 mt-1">
                                            <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                        </div>
                                        <span className="text-[8px] md:text-[9px] font-black uppercase">Verify</span>
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="flex-col h-16 md:h-20 rounded gap-1 md:gap-2 border-slate-100 hover:bg-muted"
                                        onClick={() => selectedLead.phone && triggerSmartCall(selectedLead.phone)}
                                    >
                                        <div className="p-1.5 md:p-2 rounded bg-emerald-50 text-emerald-600 mt-1">
                                            <Phone className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                        </div>
                                        <span className="text-[8px] md:text-[9px] font-black uppercase text-center">Call</span>
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="flex-col h-16 md:h-20 rounded gap-1 md:gap-2 border-slate-100 hover:bg-muted"
                                        onClick={() => selectedLead.phone && triggerWhatsApp(selectedLead.phone)}
                                    >
                                        <div className="p-1.5 md:p-2 rounded bg-green-50 text-green-600 mt-1">
                                            <MessageSquare className="h-4 w-4" />
                                        </div>
                                        <span className="text-[8px] md:text-[9px] font-black uppercase text-center">Message</span>
                                    </Button>


                                </div>

                                <Button 
                                    className="w-full h-14 rounded bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-none"
                                    onClick={() => handleConvert(selectedLead)}
                                    disabled={isConverting}
                                >
                                    {isConverting ? (
                                        <div className="w-5 h-5 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-5 w-5" />
                                            Convert to Patient
                                        </>
                                    )}
                                </Button>
                                <p className="text-center text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-4">This will create a new patient registry entry</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center rounded-md border-2 border-dashed border-border/50">
                            <div className="h-20 w-20 rounded bg-muted flex items-center justify-center mb-6">
                                <UserPlus className="h-10 w-10 text-muted-foreground/30" />
                            </div>
                            <h3 className="text-lg font-black text-muted-foreground">Select a lead</h3>
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-tighter mt-1">to view details and convert</p>
                        </div>

                    )}
                </div>
            </div>
        </div>
    );
};
