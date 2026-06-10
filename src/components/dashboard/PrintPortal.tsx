import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * PrintPortal handles rendering technical clinical documents outside the main application hierarchy.
 * This is crucial for printing workflows where the main dashboard is hidden via CSS,
 * but the document remains visible as a direct child of the body.
 */
export const PrintPortal = ({ children }: { children: React.ReactNode }) => {
    const [container] = useState(() => {
        const div = document.createElement('div');
        div.className = 'print-portal-container';
        return div;
    });

    useEffect(() => {
        document.body.appendChild(container);
        return () => {
            if (document.body.contains(container)) {
                document.body.removeChild(container);
            }
        };
    }, [container]);

    return createPortal(children, container);
};
