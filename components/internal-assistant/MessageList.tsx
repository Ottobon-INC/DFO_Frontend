import React, { useEffect, useRef } from 'react';
import { ChatMessage } from './types';
import { Bot, User } from 'lucide-react';

interface MessageListProps {
    messages: ChatMessage[];
    isTyping: boolean;
    onOptionClick?: (option: any) => void;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isTyping, onOptionClick }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-brand-textSecondary opacity-70">
                    <div className="w-16 h-16 bg-brand-bg rounded-full flex items-center justify-center mb-4">
                        <Bot size={32} className="text-brand-primary" />
                    </div>
                    <p className="font-medium text-lg text-brand-textPrimary">Internal Assistant</p>
                    <p className="text-sm max-w-[200px]">Ask operational questions about clinics, leads, or appointments.</p>
                </div>
            )}

            {messages.map((msg) => (
                <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                    <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                        ${msg.role === 'user' ? 'bg-brand-primary text-brand-bg' : 'bg-brand-surface border border-brand-border text-brand-primary'}
                    `}>
                        {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>

                    <div className={`
                        max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words
                        ${msg.role === 'user'
                            ? 'bg-brand-primary text-brand-bg rounded-tr-sm'
                            : msg.isError
                                ? 'bg-red-50 text-red-600 border border-red-100 rounded-tl-sm'
                                : 'bg-brand-surface border border-brand-border text-brand-textPrimary rounded-tl-sm'}
                    `}>
                        {msg.content}
                    </div>
                </div>
            ))}
            {/* Render options for the last message if available */}
            {messages.length > 0 && messages[messages.length - 1].options && (
                <div className="flex flex-col space-y-2 ml-11 max-w-[80%]">
                    {messages[messages.length - 1].options?.map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => onOptionClick?.(option)}
                            className={`
                                w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors text-left
                                border shadow-sm
                                ${option.type === 'cancel'
                                    ? 'bg-white border-red-200 text-red-600 hover:bg-red-50'
                                    : 'bg-white border-brand-border text-brand-primary hover:bg-brand-surface hover:border-brand-primary'}
                            `}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}

            {isTyping && (
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-surface border border-brand-border text-brand-primary flex items-center justify-center flex-shrink-0">
                        <Bot size={16} />
                    </div>
                    <div className="bg-brand-surface border border-brand-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center space-x-1">
                        <div className="w-2 h-2 bg-brand-textSecondary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-brand-textSecondary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-brand-textSecondary/40 rounded-full animate-bounce"></div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
    );
};
