import React from 'react';
import { getRoleTier } from '../../constants/roles.constants';

interface RequireTierProps {
    /** The minimum tier required to see the children. 1 = Doctor only, 2 = Doctor+Nurse, 3 = Everyone. */
    minTier: number;
    /** The user's current role string (e.g., 'Doctor', 'Nurse', 'Front Desk'). */
    userRole: string | undefined | null;
    /** The content to render if the user meets the tier requirement. */
    children: React.ReactNode;
    /** Optional fallback content to render if the user does NOT meet the tier requirement. Defaults to nothing. */
    fallback?: React.ReactNode;
}

/**
 * RequireTier Component
 *
 * A declarative wrapper that shows or hides UI elements based on the user's role tier.
 *
 * Usage:
 *   <RequireTier minTier={1} userRole={userRole}>
 *     <Button>Write Prescription</Button>
 *   </RequireTier>
 *
 *   <RequireTier minTier={2} userRole={userRole} fallback={<p>View Only</p>}>
 *     <Button>Edit Vitals</Button>
 *   </RequireTier>
 */
export const RequireTier: React.FC<RequireTierProps> = ({ minTier, userRole, children, fallback = null }) => {
    const userTier = getRoleTier(userRole);

    if (userTier <= minTier) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};
