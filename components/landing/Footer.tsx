import React from 'react';

export const Footer: React.FC = () => {
    return (
        <footer className="py-8 bg-brand-bg border-t border-brand-border text-center">
            <div className="container mx-auto px-6">
                <p className="text-brand-textSecondary text-sm font-medium">
                    JanmaSethu Clinical OS <span className="mx-2">|</span>
                    <a href="#" className="hover:text-brand-primary transition-colors">Privacy Policy</a> <span className="mx-2">|</span>
                    <a href="#" className="hover:text-brand-primary transition-colors">Terms of Use</a>
                </p>
            </div>
        </footer>
    );
};
