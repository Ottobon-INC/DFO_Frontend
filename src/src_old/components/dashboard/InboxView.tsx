import React, { useState } from 'react';
import {
    Inbox as InboxIcon,
    Search,
    Filter,
    MoreVertical,
    CheckCircle2,
    Clock,
    ShieldCheck,
    BotOff,
    Bot,
    Send,
    Plus,
    RefreshCw,
    MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Thread, Message } from '@/types';
import { cn } from '@/lib/utils';

export const InboxView = ({
    threads,
    messages,
    fetchMessages,
    sendMessage
}: {
    threads: Thread[],
    messages: Record<string, Message[]>,
    fetchMessages: (id: string) => void,
    sendMessage: (tid: string, sid: string, content: string) => void
}) => {
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'chat'>('list');

    const selectedThread = threads.find(t => t.id === selectedThreadId);

    const handleSend = () => {
        if (selectedThreadId && replyText.trim()) {
            sendMessage(selectedThreadId, 'doctor-1', replyText);
            setReplyText('');
        }
    };

    const currentMessages = selectedThreadId ? messages[selectedThreadId] || [] : [];

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background relative sticky top-0">

            {/* Sidebar: Message List */}
            <div className={cn(
                "w-full md:w-80 lg:w-96 border-r border-border bg-card flex flex-col transition-all duration-300",
                viewMode === 'chat' ? "hidden md:flex" : "flex"
            )}>

                <div className="p-6 border-b border-border">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-black text-foreground tracking-tight">Active Threads</h2>
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded border-border">

                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input placeholder="Filter conversations..." className="pl-9 h-10 rounded bg-muted border-none text-xs font-bold" />
                    </div>

                </div>
                <ScrollArea className="flex-1">
                    <div className="divide-y divide-border">

                        {threads.map((thread) => (
                            <div
                                key={thread.id}
                                onClick={() => { 
                                    setSelectedThreadId(thread.id); 
                                    fetchMessages(thread.id); 
                                    setViewMode('chat');
                                }}
                                className={cn(
                                    "p-5 cursor-pointer transition-all border-l-4",
                                    selectedThreadId === thread.id ? "bg-primary/10 border-primary" : "border-transparent hover:bg-muted"
                                )}

                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-foreground leading-tight">{thread.patientName}</h4>
                                    <span className="text-[10px] font-black text-muted-foreground tabular-nums">{thread.lastMessageTime}</span>
                                </div>

                                <p className="text-xs text-slate-500 line-clamp-1 font-medium mb-2">{thread.lastMessage}</p>
                                <div className="flex items-center gap-2">
                                    <Badge className={cn(
                                        "text-[8px] font-black uppercase tracking-widest px-2 py-0.5",
                                        thread.riskLevel === 'RED' ? "bg-red-50 text-red-600 border-red-100" :
                                            thread.riskLevel === 'YELLOW' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                "bg-emerald-50 text-emerald-600 border-emerald-100"
                                    )}>
                                        {thread.riskLevel} Case
                                    </Badge>
                                    {thread.isAiSuppressed && <Badge className="bg-slate-100 text-slate-600 border-none text-[8px] font-black uppercase px-2 tracking-widest">Human Care</Badge>}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Main: Chat Window */}
            <div className={cn(
                "flex-1 flex flex-col bg-background transition-all duration-300",
                viewMode === 'list' && !selectedThreadId ? "hidden md:flex" : 
                viewMode === 'list' ? "hidden md:flex" : "flex"
            )}>

                {selectedThread ? (
                    <>
                        <div className="h-16 md:h-20 px-4 md:px-8 border-b border-border flex items-center justify-between bg-card/80 backdrop-blur-md sticky top-0 z-10 gap-3">

                            <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="md:hidden shrink-0"
                                    onClick={() => setViewMode('list')}
                                >
                                    <Plus className="h-5 w-5 rotate-45" />
                                </Button>
                                <div className="h-8 w-8 md:h-10 md:w-10 rounded bg-primary flex items-center justify-center font-black text-primary-foreground shadow-none shrink-0">
                                    {selectedThread.patientName.charAt(0)}
                                </div>

                                <div className="overflow-hidden">
                                    <h3 className="font-black text-foreground text-sm md:text-base truncate">{selectedThread.patientName}</h3>
                                    <div className="flex items-center gap-2">

                                        <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                        <p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest truncate">Active Consultation</p>
                                    </div>

                                </div>
                            </div>
                            <div className="flex items-center gap-1 md:gap-2">
                                <Button variant="outline" size="sm" className="hidden sm:flex rounded font-black uppercase text-[10px] tracking-widest border-border text-primary hover:bg-primary/10 px-2 md:px-4">
                                    <CheckCircle2 className="h-3.5 w-3.5 md:mr-2" /> <span className="hidden lg:inline">Resolve Thread</span>
                                </Button>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10 rounded">
                                            <MoreVertical className="h-4 w-4 md:h-5 md:w-5 text-slate-400" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 rounded font-bold text-xs">
                                        <DropdownMenuLabel>Thread Controls</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="rounded md:hidden">Resolve Thread</DropdownMenuItem>
                                        <DropdownMenuItem className="rounded">Assign to Specialist</DropdownMenuItem>
                                        <DropdownMenuItem className="rounded">Escalate to Doctor</DropdownMenuItem>
                                        <DropdownMenuItem className="rounded text-red-600">Lock Conversation</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        <ScrollArea className="flex-1 p-4 md:p-8 bg-muted/20">

                            <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto">
                                <div className="flex justify-center mb-4 md:mb-8">
                                    <Badge variant="outline" className="bg-card backdrop-blur-sm px-3 md:px-4 py-1 rounded-full border-border text-[8px] md:text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                        <Clock className="h-3 w-3 mr-1 md:mr-2" /> Conversation started Oct 24, 2026
                                    </Badge>
                                </div>


                                {currentMessages.map((msg, i) => (
                                    <div key={msg.id} className={cn("flex flex-col", msg.senderType === 'USER' ? "items-start" : "items-end")}>
                                        <div className="flex items-center gap-2 mb-1 md:mb-2 px-1">
                                            {msg.senderType === 'AI' && <Badge className="bg-sky-100 text-sky-600 border-none text-[7px] md:text-[8px] font-black uppercase tracking-tighter">AI Assistant</Badge>}
                                            <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{msg.senderName}</span>
                                            <span className="text-[7px] md:text-[9px] font-black text-slate-300 tabular-nums">{msg.timestamp}</span>
                                        </div>
                                        <div className={cn(
                                            "max-w-[85%] md:max-w-[70%] p-3 md:p-4 rounded text-sm font-medium shadow-none ring-1 ring-border",
                                            msg.senderType === 'USER'
                                                ? "bg-card text-foreground rounded-tl-none tabular-nums"
                                                : "bg-primary text-primary-foreground rounded-tr-none"
                                        )}>

                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        <div className="p-4 md:p-6 bg-card border-t border-border">
                            <div className="max-w-4xl mx-auto flex items-center gap-2 md:gap-4 bg-muted p-1.5 md:p-2 rounded border border-border ring-2 md:ring-4 ring-muted/50">
                                <div className="hidden sm:flex items-center px-4 border-r border-border">
                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary rounded">

                                        <Plus className="h-5 w-5" />
                                    </Button>
                                </div>
                                <Input
                                    placeholder="Clinical response..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    className="border-none shadow-none focus-visible:ring-0 bg-transparent text-sm font-bold placeholder:text-muted-foreground/30 h-10 md:h-12"
                                />
                                <Button
                                    onClick={handleSend}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 w-10 md:h-12 md:w-12 rounded shrink-0 shadow-none transition-all active:scale-95"
                                >
                                    <Send className="h-4 w-4 md:h-5 md:w-5" />
                                </Button>
                            </div>

                            <div className="mt-3 md:mt-4 flex items-center justify-center gap-4 md:gap-8 overflow-x-auto whitespace-nowrap pb-1">
                                <button className="flex items-center gap-1 md:gap-2 text-[8px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors shrink-0"><ShieldCheck className="h-3 w-3" /> Secure</button>
                                <button className="flex items-center gap-1 md:gap-2 text-[8px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-red-500 transition-colors shrink-0"><BotOff className="h-3 w-3" /> Disable AI</button>
                                <button className="flex items-center gap-1 md:gap-2 text-[8px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors shrink-0"><MoreHorizontal className="h-3 w-3" /> Templates</button>
                            </div>

                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-muted/20">
                        <div className="h-24 w-24 rounded bg-card shadow-none flex items-center justify-center mb-6">
                            <InboxIcon className="h-10 w-10 text-muted-foreground/30" />
                        </div>
                        <h3 className="text-xl font-black text-foreground tracking-tight">Select a conversation</h3>
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2 max-w-xs">Pick a thread from the left to start clinical triage or patient support</p>
                    </div>
                )}

            </div>
        </div>
    );
};
