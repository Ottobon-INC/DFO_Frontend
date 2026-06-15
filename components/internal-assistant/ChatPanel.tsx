import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bot } from 'lucide-react';
import { MessageList } from './MessageList';
import { InputArea } from './InputArea';
import { ChatMessage } from './types';

interface ChatPanelProps {
    isOpen: boolean;
    onClose: () => void;
    messages: ChatMessage[];
    isTyping: boolean;
    onSendMessage: (message: string) => void;
    onOptionClick?: (option: any) => void;
    isLocked?: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
    isOpen,
    onClose,
    messages,
    isTyping,
    onSendMessage,
    onOptionClick,
    isLocked
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[90]"
                    />

                    {/* Slide-over Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-[400px] bg-brand-bg border-l border-brand-border shadow-2xl z-[100] flex flex-col max-w-[90vw]"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-brand-border bg-brand-surface flex justify-between items-center shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary border border-brand-primary/20">
                                    <Bot size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-brand-textPrimary">Internal Assistant</h3>
                                    <p className="text-xs text-brand-textSecondary font-medium">Clinic Operations Helper</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-brand-bg text-brand-textSecondary hover:text-brand-textPrimary transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <MessageList messages={messages} isTyping={isTyping} onOptionClick={onOptionClick} />

                        {/* Input */}
                        <InputArea onSendMessage={onSendMessage} isLoading={isTyping} isLocked={isLocked} />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
