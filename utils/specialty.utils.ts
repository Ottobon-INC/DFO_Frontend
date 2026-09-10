/**
 * Utility functions for specialty string normalization and checks.
 */

/**
 * Checks whether a clinic specialty string corresponds to Gynecology.
 * Normalizes variants such as 'GYNEC', 'Gynecology', 'gynec', 'Gynecology OPD'.
 */
export function isGynecSpecialty(specialty?: string | null): boolean {
    if (!specialty) return false;
    const s = specialty.toUpperCase().trim();
    return s.includes('GYNEC') || s.includes('GYNECOLOGY');
}

/**
 * Returns canonical specialty string for display and backend matching.
 */
export function getCanonicalSpecialty(specialty?: string | null): string {
    if (!specialty) return 'General';
    if (isGynecSpecialty(specialty)) return 'Gynecology';
    if (specialty.toUpperCase().includes('IVF')) return 'IVF';
    return specialty;
}
