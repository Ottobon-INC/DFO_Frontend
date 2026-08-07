import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz";

interface DecryptionRevealProps {
    text: string;
    trigger?: boolean;
    duration?: number;
    className?: string;
    initialMask?: string;
}

export const DecryptionReveal: React.FC<DecryptionRevealProps> = ({
    text,
    trigger = true,
    duration = 1500,
    className = "",
    initialMask
}) => {
    const chars = text.split('');

    return (
        <span className={`inline-flex ${className}`}>
            {chars.map((char, i) => (
                <DecryptionChar
                    key={i}
                    targetChar={char}
                    index={i}
                    total={chars.length}
                    trigger={trigger}
                    duration={duration}
                    initialMask={initialMask}
                />
            ))}
        </span>
    );
};

const DecryptionChar = ({ targetChar, index, total, trigger, duration, initialMask }: any) => {
    const [char, setChar] = useState(initialMask || targetChar);
    const [isLocked, setIsLocked] = useState(!trigger);
    const [isGlowing, setIsGlowing] = useState(false);

    useEffect(() => {
        if (!trigger) {
            setChar(initialMask || targetChar);
            setIsLocked(true);
            setIsGlowing(false);
            return;
        }

        if (targetChar === ' ') {
            setChar(' ');
            setIsLocked(true);
            return;
        }

        setIsLocked(false);
        setIsGlowing(false);

        let interval: NodeJS.Timeout;
        let timeout: NodeJS.Timeout;
        let glowTimeout: NodeJS.Timeout;

        // Distribute the locking time left-to-right.
        // Add a slight base delay so even the first character scrambles for a moment.
        const lockTime = 100 + (duration / total) * index;

        interval = setInterval(() => {
            setChar(CHARS[Math.floor(Math.random() * CHARS.length)]);
        }, 40); // 40ms interval = 25fps character cycling

        timeout = setTimeout(() => {
            clearInterval(interval);
            setChar(targetChar);
            setIsLocked(true);

            setIsGlowing(true);
            glowTimeout = setTimeout(() => {
                setIsGlowing(false);
            }, 600); // Glow fade duration

        }, lockTime);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
            clearTimeout(glowTimeout);
        };
    }, [trigger, targetChar, index, total, duration, initialMask]);

    return (
        <span className="relative inline-block whitespace-pre">
            <motion.span
                animate={
                    trigger
                        ? isLocked
                            ? { filter: "blur(0px)", color: "#064e3b", opacity: 1, textShadow: "0px 0px 0px rgba(52,211,153,0)" } // mint-900
                            : { filter: "blur(1.5px)", color: "#10b981", opacity: 0.8, textShadow: "0px 0px 8px rgba(16,185,129,0.6)" } // mint-500 glowing
                        : { filter: "blur(0px)", color: "rgba(6, 78, 59, 0.4)", opacity: 1, textShadow: "0px 0px 0px rgba(0,0,0,0)" } // mint-900/40 for mask
                }
                transition={{ duration: isLocked ? 0.3 : 0.1 }}
                className="inline-block"
            >
                {char}
            </motion.span>

            <AnimatePresence>
                {isGlowing && (
                    <motion.span
                        initial={{ opacity: 0.8, filter: "blur(6px)", scale: 1.3 }}
                        animate={{ opacity: 0, filter: "blur(0px)", scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="absolute left-0 top-0 text-[#34d399] z-10 font-bold pointer-events-none"
                    >
                        {targetChar}
                    </motion.span>
                )}
            </AnimatePresence>
        </span>
    );
};
