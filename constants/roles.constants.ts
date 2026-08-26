import { UserRole } from '../types';

/**
 * Role Tier Mapping — Frontend Mirror of the Backend Hierarchy.
 *
 * This dictionary translates the frontend UserRole enum values into
 * mathematical tier numbers for fast, inheritance-based UI permission checks.
 *
 * Rule: A user with tier N automatically inherits all permissions of tiers > N.
 *   - Tier 1 (Doctor / Admin): God-mode. Can see and do everything.
 *   - Tier 2 (Nurse): Can see/edit nursing data + admin data.
 *   - Tier 3 (Front Desk / CRO): Can see everything, edit admin data only.
 *
 * To add a new role, add a new entry here with the appropriate tier number.
 */
export const RoleTierMap: Record<string, number> = {
    [UserRole.DOCTOR]: 1,
    [UserRole.ADMIN]: 1,
    [UserRole.NURSE]: 2,
    [UserRole.FRONT_DESK]: 3,
    [UserRole.CRO]: 3,
};

/** The default tier for any unrecognized role (most restrictive). */
export const DEFAULT_ROLE_TIER = 3;

/**
 * Resolves a UserRole enum value to its numerical tier.
 * Returns DEFAULT_ROLE_TIER if the role is not found in the map.
 */
export function getRoleTier(role: string | undefined | null): number {
    if (!role) return DEFAULT_ROLE_TIER;
    return RoleTierMap[role] ?? DEFAULT_ROLE_TIER;
}
