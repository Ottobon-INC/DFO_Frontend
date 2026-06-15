import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { ChatPanel } from './ChatPanel';
import { ChatMessage } from './types';
import { api } from '../../services/api';

export const InternalAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isLocked, setIsLocked] = useState(false);

    const handleSendMessage = async (content: string) => {
        // Add User Message
        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        try {
            // API Call
            const response = await api.internalAssistant.chat({ message: content });

            // Add Assistant Message
            const botMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.reply,
                timestamp: Date.now(),
                options: response.options
            };
            setMessages(prev => [...prev, botMsg]);

            if (response.type === 'CONFIRMATION_REQUIRED') {
                setIsLocked(true);
            }
        } catch (error: any) {
            console.error('Chat error:', error);
            handleError(error);
        } finally {
            setIsTyping(false);
        }
    };

    const handleOptionClick = async (option: any) => {
        setIsLocked(false); // optimistic unlock or keep locked until response? 
        // "Chat locks during confirmation" -> implies until resolution.
        // But if I click cancel, I want to see the "Cancelled" message and then unlock.
        // UI Guideline: "Chat returns to normal state" on Success/Failure.
        // I will keep visual lock (via isTyping) but remove the "options" lock so input restores after this turn.

        setIsTyping(true);
        // Maybe add a user message representing the choice? 
        // "User selected: Confirm" - Not required but good UX.
        // Let's just proceed with the logical flow.

        try {
            let response;
            if (option.type === 'cancel') {
                response = await api.internalAssistant.chat({ cancelToken: option.token });
            } else {
                response = await api.internalAssistant.chat({ confirmationToken: option.token });
            }

            const botMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.reply,
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, botMsg]);

        } catch (error: any) {
            console.error('Option error:', error);
            handleError(error);
        } finally {
            setIsTyping(false);
            setIsLocked(false);
        }
    };

    const handleError = (error: any) => {
        let errorMessage = "Something went wrong. Please try again.";

        if (error.status === 401 || error.status === 403) {
            errorMessage = "You are not authorized to perform this request.";
        } else if (error.message) {
            errorMessage = error.message;
        }

        const errorMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: errorMessage,
            timestamp: Date.now(),
            isError: true
        };
        setMessages(prev => [...prev, errorMsg]);
    };

    return (
        <>
            {/* Floating Trigger Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-brand-primary text-brand-bg rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center z-[80] group"
                    aria-label="Open Internal Assistant"
                >
                    <MessageCircle size={28} className="group-hover:rotate-12 transition-transform" />
                    {/* Badge if needed later */}
                </button>
            )}

            {/* Chat Panel */}
            <ChatPanel
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                messages={messages}
                isTyping={isTyping}
                onSendMessage={handleSendMessage}
                onOptionClick={handleOptionClick}
                isLocked={isLocked}
            />
        </>
    );
};
