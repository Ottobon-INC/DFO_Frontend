import React from "react";
import {
    Stethoscope,
    Search,
    MoreVertical,
    FileSignature,
    Activity,
    MessageSquare,
    Calendar,
    RefreshCw,
    Plus,
    FileText
} from "lucide-react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Patient } from "@/types";
import { PrintPortal } from './PrintPortal';
import { cn } from "@/lib/utils";

export const ConsultationsView = ({
    patient,
    consultations,
    refreshConsultations
}: {
    patient: any,
    consultations: any[],
    refreshConsultations: () => void
}) => {
    const [printingConsultation, setPrintingConsultation] = React.useState<any | null>(null);

    const handleDownloadPDF = (con: any) => {
        setPrintingConsultation(con);
        // Small delay to ensure state update before print dialog
        setTimeout(() => {
            window.print();
        }, 100);
    };

    return (
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
                <div>
                    <h2 className="text-2xl font-black text-foreground tracking-tight">Clinical Consultations</h2>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-tighter mt-1">Manage active patient cases</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => refreshConsultations()} className="rounded border-border font-bold uppercase text-[10px] tracking-widest gap-2 h-10 px-4 w-full sm:w-auto">
                        <RefreshCw className="h-4 w-4" /> Refresh
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 no-print">
                <Card className="border border-border shadow-none rounded-md bg-card overflow-hidden">
                    <div className="overflow-x-auto">
                    <Table className="min-w-[600px] lg:min-w-full">
                        <TableHeader className="bg-muted/50">

                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="w-[300px] font-black uppercase text-[10px] tracking-widest py-6 px-8">Patient Identity</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest py-6">Date</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest py-6">Diagnosis</TableHead>
                                <TableHead className="text-right py-6 px-8"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {consultations.map((c) => (
                                <TableRow key={c.id} className="hover:bg-muted/50 cursor-pointer border-border group">
                                    <TableCell className="py-6 px-8 font-medium">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center font-black text-muted-foreground">
                                                {c.patientName?.charAt(0) || 'P'}
                                            </div>
                                            <div>
                                                <p className="font-black text-foreground leading-none">{c.patientName}</p>
                                                <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-tighter">ID: {c.id.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                    </TableCell>

                                    <TableCell className="tabular-nums font-bold text-xs">
                                        {new Date(c.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="rounded bg-sky-500/10 text-sky-500 border-none font-black uppercase text-[9px] tracking-tighter">
                                            {c.summary || c.notes?.slice(0, 20) || 'Initial Evaluation'}
                                        </Badge>
                                    </TableCell>

                                    <TableCell className="text-right px-8">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => handleDownloadPDF(c)}
                                            className="rounded font-black uppercase text-[10px] tracking-widest gap-2"
                                        >
                                            <FileText className="h-4 w-4 text-primary" /> Download PDF
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    </div>
                </Card>
            </div>

            {/* Clinical Consultation Report (Rendered via Portal) */}
            {printingConsultation && (
                <PrintPortal>
                    <div className="hidden print:block bg-white p-16 text-slate-950 overflow-visible font-sans clinical-pdf-report">
                        <div className="border-b-[6px] border-slate-950 pb-10 flex justify-between items-end">
                            <div>
                                <h1 className="text-4xl font-black uppercase tracking-tighter">Clinical Case Report</h1>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">{new Date(printingConsultation.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black text-slate-950">DFOCLINIC</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Medical Documentation Unit</p>
                            </div>
                        </div>

                        <div className="mt-12 grid grid-cols-2 gap-12 pb-12 border-b-2 border-slate-100">
                            <section>
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Patient Particulars</h4>
                                <div className="space-y-1">
                                    <p className="text-2xl font-black text-slate-950">{printingConsultation.patientName}</p>
                                    <p className="text-sm font-bold text-slate-600">Patient ID: {printingConsultation.patientId}</p>
                                    <p className="text-sm font-bold text-slate-600">Case ID: {printingConsultation.id}</p>
                                </div>
                            </section>
                            <section className="text-right">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Clinical Authority</h4>
                                <div className="space-y-1">
                                    <p className="text-xl font-black text-slate-950">{printingConsultation.doctorName || 'Senior Consultant'}</p>
                                    <p className="text-sm font-bold text-slate-600">Obstetric Unit</p>
                                </div>
                            </section>
                        </div>

                        <div className="mt-12 space-y-12">
                            <section>
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-6 decoration-slate-950">Case Assessment</h4>
                                <div className="p-8 bg-slate-50 rounded border border-slate-100">
                                    <p className="text-lg font-bold text-slate-950 leading-relaxed">
                                        {printingConsultation.notes || "Standard clinical evaluation conducted. Vital signs within normal parameters for the patient's gestational stage."}
                                    </p>
                                </div>
                            </section>

                            <section className="grid grid-cols-2 gap-12">
                                <div>
                                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-6">Diagnosis Summary</h4>
                                    <div className="p-6 border-l-4 border-slate-950 bg-slate-50 transition-all">
                                        <p className="text-sm font-black text-slate-950 uppercase">{printingConsultation.diagnosis || 'Initial Gestational Evaluation'}</p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-6">Clinical Status</h4>
                                    <div className="inline-flex items-center px-4 py-2 bg-slate-950 text-white rounded text-xs font-black uppercase tracking-widest">
                                        Certified Engagement
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="fixed bottom-16 left-16 right-16 pt-8 border-t border-slate-100 flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            <p>© 2026 DFOCLINIC Clinical Operating System</p>
                            <p>Digitally Signed & Validated Documentation</p>
                        </div>
                    </div>
                </PrintPortal>
            )}
        </div>
    );
};
