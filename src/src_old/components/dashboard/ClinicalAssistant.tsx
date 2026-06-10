import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ClinicalAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'ai' | 'user', text: string}[]>([
    { role: 'ai', text: 'Clinical assistant active. How can I assist with triage protocols today?' }
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: input }]);
    setInput('');
    setTimeout(() => {
        setMessages(prev => [...prev, { role: 'ai', text: 'Processing request via protocol index...' }]);
    }, 500);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-none bg-primary text-primary-foreground flex items-center justify-center transition-all ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <Bot className="w-5 h-5" />
      </Button>

      {/* Chat Interface Container */}
      <div className={`fixed bottom-6 right-6 w-[340px] bg-card border border-border shadow-none flex flex-col rounded-md transition-all duration-300 origin-bottom-right z-50 ${isOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-95 opacity-0 pointer-events-none'}`}>
        
        {/* Header */}
        <div className="h-12 border-b border-border bg-muted/50 flex items-center justify-between px-3 shrink-0 rounded-t-md">
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center">
                    <Stethoscope className="w-3 h-3" />
                </div>
                <span className="font-bold text-xs uppercase tracking-wide text-foreground">Aura Assistant</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-6 w-6 rounded text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
            </Button>
        </div>

        {/* Message Feed */}
        <div ref={scrollRef} className="h-72 overflow-y-auto p-4 flex flex-col gap-4 text-sm bg-background">
            {messages.map((m, i) => (
                <div key={i} className={`flex flex-col max-w-[85%] ${m.role === 'user' ? 'self-end' : 'self-start'}`}>
                    <span className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${m.role === 'user' ? 'text-right text-muted-foreground' : 'text-primary'}`}>
                        {m.role === 'user' ? 'You' : 'System'}
                    </span>
                    <div className={`px-3 py-2 rounded text-xs leading-relaxed ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted border border-border text-foreground'}`}>
                        {m.text}
                    </div>
                </div>
            ))}
        </div>

        {/* Input Area */}
        <div className="p-2 border-t border-border bg-card shrink-0 flex items-center gap-2 rounded-b-md">
            <input 
                type="text"
                placeholder="Query patient MRN or triage..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 bg-background border border-border rounded px-2 h-8 text-xs text-foreground outline-none focus:border-primary placeholder:text-muted-foreground"
            />
            <Button onClick={handleSend} size="icon" className="h-8 w-8 rounded bg-primary text-primary-foreground shadow-none">
                <Send className="w-3.5 h-3.5" />
            </Button>
        </div>
      </div>
    </>
  );
}
