import React from 'react';
import { motion } from 'framer-motion';
import { LogIn, ArrowUpRight, Twitter, Linkedin, Youtube } from 'lucide-react';

interface FinalCTAProps {
    onLoginClick?: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onLoginClick }) => {
    return (
        <section className="bg-mint-50 pt-24 pb-12 flex flex-col items-center">

            {/* CTA Box */}
            <div className="container mx-auto px-6 max-w-7xl mb-32">
                <div className="relative rounded-[3rem] overflow-hidden py-32 px-8 flex flex-col items-center justify-center text-center">

                    {/* Background gradient & pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#00EFA5] via-[#2CE1BA] to-[#7BEECE] opacity-100 z-0"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] opacity-20 z-0 mix-blend-overlay"></div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="relative z-10"
                    >
                        <h2 className="text-4xl md:text-[56px] font-medium text-black mb-10 tracking-tight leading-tight w-full mx-auto drop-shadow-sm">
                            Crafted for Clinics and Hospitals.<br />Start using today.
                        </h2>

                        <button
                            onClick={onLoginClick}
                            className="group px-8 py-3.5 bg-mint-900 text-white rounded-full font-medium text-sm hover:bg-mint-700 transition-all flex items-center gap-2 mx-auto shadow-lg shadow-mint-900/20"
                        >
                            <LogIn size={16} className="text-mint-600/50" />
                            Login to Digital OP Desk
                        </button>
                    </motion.div>
                </div>
            </div>

            {/* Footer */}
            <div className="container mx-auto px-6 max-w-6xl w-full">
                <div className="flex justify-between md:justify-start md:gap-32 mb-24">

                    {/* Column 1 */}
                    <div className="flex flex-col gap-4">
                        <h4 className="text-[11px] font-bold text-mint-600/70 mb-2">Platform</h4>
                        <a href="#roles" className="text-[12px] font-bold text-mint-900 hover:text-mint-500 transition-colors">Role-Based Workspaces</a>
                        <a href="#modules" className="text-[12px] font-bold text-mint-900 hover:text-mint-500 transition-colors">Core Modules</a>
                        <a href="#platform" className="text-[12px] font-bold text-mint-900 hover:text-mint-500 transition-colors">OS Architecture</a>
                        <a href="#security" className="text-[12px] font-bold text-mint-900 hover:text-mint-500 transition-colors">Bank-Grade Security</a>
                    </div>

                    {/* Column 5 */}
                    <div className="flex flex-col gap-4">
                        <h4 className="text-[11px] font-bold text-mint-600/70 mb-2">Legal</h4>
                        <a href="#" className="text-[12px] font-bold text-mint-900 hover:text-mint-500 transition-colors">Terms of Service</a>
                        <a href="#" className="text-[12px] font-bold text-mint-900 hover:text-mint-500 transition-colors">Privacy Policy</a>
                        <a href="#" className="text-[12px] font-bold text-mint-900 hover:text-mint-500 transition-colors">HIPAA Compliance</a>
                    </div>

                </div>

                {/* Bottom Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-mint-100">
                    <p className="text-[11px] text-mint-600/70 font-bold mb-4 md:mb-0">
                        © 2026 Digital OP Desk Inc.
                    </p>
                    <div className="flex items-center gap-4 text-mint-600/70">
                        <a href="#" className="hover:text-mint-700 transition-colors"><Twitter size={14} /></a>
                        <a href="#" className="hover:text-mint-700 transition-colors"><Linkedin size={14} /></a>
                        <a href="#" className="hover:text-mint-700 transition-colors"><Youtube size={14} /></a>
                    </div>
                </div>
            </div>

        </section>
    );
};
