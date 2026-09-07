import { useMemo } from 'react';
import { getRoleTier } from '../constants/roles.constants';

/**
 * usePermissions Hook
 *
 * Translates the user's string role into easy-to-use boolean permission flags.
 *
 * Usage:
 *   const { canEditClinical, canEditNursing, canEditAdmin, userTier } = usePermissions(userRole);
 *
 *   if (canEditClinical) { // Only Doctors }
 *   if (canEditNursing) { // Doctors and Nurses }
 *   if (canEditAdmin) { // Everyone }
 */
export function usePermissions(userRole: string | undefined | null) {
    return useMemo(() => {
        const userTier = getRoleTier(userRole);

        return {
            /** The raw tier number (1 = Doctor, 2 = Nurse, 3 = Front Desk) */
            userTier,

            /** True if the user can edit Doctor-level data (prescriptions, diagnoses, clinical notes). Tier 1 only. */
            canEditClinical: userTier <= 1,

            /** True if the user can edit Nurse-level data (vitals, triage). Tier 1 and 2. */
            canEditNursing: userTier <= 2,

            /** True if the user can edit Admin-level data (appointments, patient info). Everyone. */
            canEditAdmin: userTier <= 3,

            /** True if the user can view all data. Currently everyone can view everything. */
            canViewAll: true,
        };
    }, [userRole]);
}
