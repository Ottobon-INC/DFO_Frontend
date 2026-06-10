import React, { useState } from 'react';
import { 
    Moon, 
    Sun, 
    Monitor, 
    Layers, 
    Maximize2, 
    Minimize2, 
    Palette,
    Eye,
    Layout
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const SettingsView = () => {
    const [theme, setTheme] = useState('light');
    const [density, setDensity] = useState('compact');
    const [sidebarType, setSidebarType] = useState('full');
    const [accentColor, setAccentColor] = useState('blue');

    return (
        <div className="p-4 md:p-10 max-w-5xl mx-auto space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-foreground tracking-tight italic">OS Settings</h2>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-tighter mt-1">Configure your Clinical OS visual environment</p>
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {/* Theme Selection */}
                <Card className="border border-border bg-card p-6 md:p-10 shadow-none rounded-md">

                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-10 w-10 rounded bg-primary/10 text-primary flex items-center justify-center">
                            <Monitor className="h-5 w-5" />
                        </div>
                        <h3 className="text-xl font-black text-foreground tracking-tight">Display & Theme</h3>

                    </div>

                    <div className="space-y-8">
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Appearance</p>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { id: 'light', label: 'Light', icon: Sun },
                                    { id: 'dark', label: 'Dark', icon: Moon },
                                ].map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => {
                                            setTheme(t.id);
                                            localStorage.setItem('dfo-theme', t.id);
                                            if (t.id === 'dark') document.documentElement.classList.add('dark');
                                            else document.documentElement.classList.remove('dark');
                                        }}
                                        className={cn(
                                            "flex flex-col items-center gap-3 p-4 rounded border transition-all duration-300 flex-1",
                                            theme === t.id 
                                                ? "bg-primary text-primary-foreground border-primary shadow-none" 
                                                : "bg-muted border-border text-muted-foreground hover:border-primary/20"
                                        )}

                                    >
                                        <t.icon className="h-6 w-6" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                                    </button>
                                ))}
                            </div>

                        </div>

                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4">Interface Density</p>
                            <div className="flex gap-4 p-2 bg-muted rounded border border-border">

                                <button
                                    onClick={() => {
                                        setDensity('compact');
                                        localStorage.setItem('dfo-density', 'compact');
                                        document.documentElement.setAttribute('data-density', 'compact');
                                    }}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-3 rounded font-black uppercase text-[10px] tracking-widest transition-all",
                                        density === 'compact' ? "bg-card text-foreground shadow-none" : "text-muted-foreground"
                                    )}

                                >
                                    <Minimize2 className="h-4 w-4" /> Clinical Compact
                                </button>
                                <button
                                    onClick={() => {
                                        setDensity('cozy');
                                        localStorage.setItem('dfo-density', 'cozy');
                                        document.documentElement.setAttribute('data-density', 'cozy');
                                    }}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-3 rounded font-black uppercase text-[10px] tracking-widest transition-all",
                                        density === 'cozy' ? "bg-card text-foreground shadow-none" : "text-muted-foreground"
                                    )}

                                >
                                    <Maximize2 className="h-4 w-4" /> Modern Cozy
                                </button>

                            </div>
                        </div>
                    </div>
                </Card>

                {/* Accent & Navigation */}
                <div className="space-y-6 md:space-y-8">
                    <Card className="border border-border bg-card p-6 md:p-10 shadow-none rounded-md">

                        <div className="flex items-center gap-3 mb-8">
                            <div className="h-10 w-10 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <Palette className="h-5 w-5" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Personalization</h3>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Core Accent Color</p>
                                <div className="flex gap-4">
                                    {[
                                        { id: 'blue', color: 'bg-primary', value: '#3b82f6' },
                                        { id: 'green', color: 'bg-emerald-500', value: '#10b981' },
                                        { id: 'red', color: 'bg-rose-500', value: '#f43f5e' },
                                        { id: 'indigo', color: 'bg-indigo-600', value: '#4f46e5' },
                                    ].map((c) => (
                                        <button
                                            key={c.id}
                                            onClick={() => {
                                                setAccentColor(c.id);
                                                localStorage.setItem('dfo-accent', c.id);
                                                document.documentElement.style.setProperty('--primary', c.value);
                                            }}
                                            className={cn(
                                                "h-10 w-10 rounded transition-all duration-300 ring-offset-4",
                                                c.color,
                                                accentColor === c.id ? "ring-2 ring-foreground shadow-none" : "scale-100"
                                            )}
                                        />
                                    ))}
                                </div>


                            </div>

                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Sidebar Layout</p>
                                <div className="space-y-4">
                                    {[
                                        { id: 'full', label: 'Full Navigation', desc: 'Detailed icons + text labels for maximum clarity', icon: Layout },
                                        { id: 'slim', label: 'Slim Mode', desc: 'Minimized sidebar to maximize data workspace', icon: Minimize2 },
                                    ].map((s) => (
                                        <div 
                                            key={s.id}
                                            onClick={() => {
                                                setSidebarType(s.id);
                                                localStorage.setItem('dfo-sidebar', s.id);
                                                document.documentElement.setAttribute('data-sidebar', s.id);
                                            }}
                                            className={cn(
                                                "p-4 rounded border cursor-pointer transition-all flex items-center gap-4",
                                                sidebarType === s.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted hover:border-primary/20"
                                            )}

                                        >

                                            <div className={cn("h-10 w-10 rounded flex items-center justify-center shrink-0", sidebarType === s.id ? "bg-white/10" : "bg-card shadow-none border border-border")}>
                                                <s.icon className={cn("h-5 w-5", sidebarType === s.id ? "text-primary-foreground" : "text-muted-foreground")} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black uppercase tracking-tight">{s.label}</p>
                                                <p className={cn("text-[10px] font-bold mt-1", sidebarType === s.id ? "text-white/60" : "text-slate-400")}>{s.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                </div>
            </div>
        </div>
    );
};
