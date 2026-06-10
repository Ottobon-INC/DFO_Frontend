import React, { useState } from 'react';
import { useClinicalData } from '@/hooks/useClinicalData';
import { Search, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Patient } from '@/types';

export function PatientsView() {
  const { patients, loading } = useClinicalData();
  const [filter, setFilter] = useState('');

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground animate-pulse">Loading patient registry...</div>;
  }

  const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()) || p.phone.includes(filter));

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="text-xl font-bold text-foreground tracking-tight">Patient Registry</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-8 text-xs font-semibold border-border shadow-none rounded-md">
            <Download className="w-3.5 h-3.5 mr-2" />
            Export CSV
          </Button>
          <Button className="h-8 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-none rounded-md">
            New Admission
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-md shrink-0 mb-4 p-3 flex items-center justify-between">
         <div className="flex items-center gap-3 w-full max-w-sm border border-border px-3 py-1.5 rounded bg-background">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input 
              type="text" 
              placeholder="Filter by name or MRN..." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-transparent border-none outline-none text-xs w-full text-foreground"
            />
         </div>
         <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <Filter className="w-4 h-4" />
         </Button>
      </div>

      <div className="flex-1 border border-border rounded-md bg-card overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead className="bg-muted shadow-[0_1px_0_var(--border)] sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-muted-foreground border-b border-border">MRN</th>
                <th className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-muted-foreground border-b border-border">Patient Name</th>
                <th className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-muted-foreground border-b border-border">Age/Gender</th>
                <th className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-muted-foreground border-b border-border">Contact</th>
                <th className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-muted-foreground border-b border-border">Status Flag</th>
                <th className="px-4 py-2 font-bold text-xs uppercase tracking-wider text-muted-foreground border-b border-border text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {filteredPatients.map(p => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-4 py-2 font-mono text-muted-foreground text-xs">{p.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-4 py-2 font-semibold text-foreground">{p.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{p.age || 'N/A'}</td>
                  <td className="px-4 py-2 flex items-center gap-2">
                    <span className="font-mono text-xs">{p.phone}</span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      p.riskLevel === 'RED' ? 'bg-red-50 text-red-600 border border-red-200' :
                      p.riskLevel === 'YELLOW' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                      'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${p.riskLevel === 'RED' ? 'bg-red-600' : p.riskLevel === 'YELLOW' ? 'bg-amber-600' : 'bg-emerald-600'}`} />
                      {p.riskLevel}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Button variant="ghost" className="h-7 px-3 text-xs font-semibold tracking-wide border border-transparent group-hover:border-border group-hover:bg-background">
                      View Chart
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredPatients.length === 0 && (
                 <tr>
                   <td colSpan={6} className="px-4 py-12 text-center text-sm font-medium text-muted-foreground">
                     No records found matching criteria.
                   </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-border bg-muted/20 text-xs text-muted-foreground flex items-center justify-between">
          <span>Showing {filteredPatients.length} records</span>
          <div className="flex gap-1">
             <Button variant="outline" size="sm" className="h-7 text-[10px] rounded" disabled>Prev</Button>
             <Button variant="outline" size="sm" className="h-7 text-[10px] rounded" disabled>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
