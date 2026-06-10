import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Menu, X, LogOut, ChevronRight, LayoutDashboard } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';

export function Navbar({ onEnterDashboard }: { onEnterDashboard: () => void }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] transition-all duration-500",
        isScrolled
          ? "bg-card border-b border-border py-4"
          : "bg-transparent py-6 md:py-8"
      )}
    >

      <div className="container mx-auto px-4 md:px-8 lg:px-12">
        <div className="flex items-center justify-between">
          <div className="cursor-pointer" onClick={onEnterDashboard}>
            <Logo />
          </div>

          <nav className="hidden lg:flex items-center gap-10">
            {['About', 'Roles', 'Features'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors relative group"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <Button
                size="sm"
                onClick={onEnterDashboard}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-none px-6 py-5 rounded text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Launch Dashboard
              </Button>
            ) : (
              <>
                <button
                  onClick={onEnterDashboard}
                  className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign In
                </button>
                <Button
                  size="sm"
                  onClick={onEnterDashboard}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-none px-6 py-5 rounded text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Request Access
                </Button>
              </>
            )}
          </div>


          <button
            className="lg:hidden p-2 text-slate-900 bg-slate-50 rounded-lg border border-slate-100 shadow-sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-100 shadow-2xl p-6 md:p-8 rounded-b-xl"
          >
            <div className="flex flex-col gap-6">
              {['About', 'Roles', 'Features'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="flex items-center justify-between text-[12px] font-bold uppercase tracking-wider text-foreground p-4 bg-muted rounded border border-border active:bg-primary/10 active:border-primary/20 transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item}
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </a>
              ))}
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Button variant="outline" className="py-6 rounded text-xs font-bold shadow-none" onClick={() => { onEnterDashboard(); setIsMobileMenuOpen(false); }}>Sign In</Button>
                <Button className="py-6 rounded text-xs font-bold shadow-none bg-primary text-primary-foreground" onClick={() => { onEnterDashboard(); setIsMobileMenuOpen(false); }}>Register</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
