import React from 'react';

export function AppointmentsView() {
  return (
    <div className="flex flex-col flex-1">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground tracking-tight">Appointments</h2>
      </div>
      <div className="flex-1 bg-card border border-border rounded-md flex items-center justify-center">
        <p className="text-sm font-medium text-muted-foreground">Scheduling module offline for maintenance.</p>
      </div>
    </div>
  );
}
