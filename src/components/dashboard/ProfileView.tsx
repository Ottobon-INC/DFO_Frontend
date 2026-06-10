import React from 'react';
import { 
    Mail, 
    Building2,
    ShieldCheck,
    LogOut,
    User
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ProfileViewProps {
    profile: any;
    user: any;
    role: string;
    onSignOut: () => Promise<void>;
}

export const ProfileView = ({ profile, user, role, onSignOut }: ProfileViewProps) => {
    return (
        <div className="p-4 md:p-10 max-w-4xl mx-auto space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 uppercase font-sans tracking-tight">
            <div className="text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Clinical Identity</h2>
                <p className="text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-tighter mt-1">Verified clinician profile</p>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {/* Identity Card */}
                <Card className="border border-border bg-card overflow-hidden p-6 md:p-10 shadow-none rounded-md">
                    <div className="flex flex-col items-center text-center">
                        <div className="h-20 w-20 md:h-28 md:w-28 rounded-md bg-slate-900 shadow-none mb-4 md:mb-6 flex items-center justify-center overflow-hidden border border-muted">

                            {user?.user_metadata?.avatar_url ? (
                                <img src={user.user_metadata.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                                <span className="text-4xl font-black text-white italic">
                                    {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || '?'}
                                </span>
                            )}
                        </div>
                        <h3 className="text-xl md:text-2xl font-black text-foreground leading-none truncate w-full">
                            {profile?.full_name || user?.user_metadata?.full_name || 'Staff Member'}
                        </h3>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-3">

                            {role || 'Staff'}
                        </p>

                        
                        <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-border w-full space-y-3 md:space-y-4 text-left">
                            <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded bg-muted border border-border">
                                <div className="h-9 w-9 md:h-10 md:w-10 rounded bg-card border border-border flex items-center justify-center text-muted-foreground shrink-0">
                                    <Mail className="h-4 w-4 md:h-5 md:w-5" />

                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground tracking-tighter">Login Email</p>
                                    <p className="font-bold text-foreground text-xs md:text-sm truncate">{user?.email}</p>
                                </div>

                            </div>
                            <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded bg-muted border border-border">
                                <div className="h-9 w-9 md:h-10 md:w-10 rounded bg-card border border-border flex items-center justify-center text-muted-foreground shrink-0">
                                    <Building2 className="h-4 w-4 md:h-5 md:w-5" />

                                </div>
                                <div>
                                    <p className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground tracking-tighter">Assigned Node</p>
                                    <p className="font-bold text-foreground text-xs md:text-sm">MAIN CLINIC</p>
                                </div>

                            </div>
                        </div>
                    </div>
                </Card>

                {/* Account Actions */}
                <div className="space-y-4 md:space-y-6">
                    <Card className="border-none shadow-none rounded-md p-6 md:p-8 bg-slate-900 text-white flex flex-col justify-between h-full">
                        <div>
                            <div className="flex items-center gap-3 mb-4 md:mb-6">
                                <ShieldCheck className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                                <h4 className="text-[10px] md:text-sm font-black uppercase tracking-widest">Account Security</h4>
                            </div>
                            <p className="text-xs md:text-sm font-medium opacity-60 leading-relaxed uppercase">
                                Secured by Supabase Auth.
                                Session persistent.
                            </p>
                        </div>

                        <div className="mt-8 md:mt-10 space-y-2 md:space-y-3">
                            <Button className="w-full rounded h-12 md:h-14 font-black uppercase text-[10px] md:text-[11px] tracking-widest gap-2 bg-white text-slate-900 hover:bg-slate-100 shadow-none border-none">
                                <User className="h-4 w-4" /> Edit Profile
                            </Button>
                            <Button 
                                onClick={async () => {
                                    try {
                                        await onSignOut();
                                    } catch (err) {
                                        console.error("Sign out failed", err);
                                    }
                                }}
                                variant="outline" 
                                className="w-full rounded h-12 md:h-14 font-black uppercase text-[10px] md:text-[11px] tracking-widest gap-2 border-red-500/30 bg-transparent text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-none border"
                            >
                                <LogOut className="h-4 w-4" /> Sign Out
                            </Button>

                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
