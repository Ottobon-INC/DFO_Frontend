/**
 * Safely parses a UTC ISO timestamp and converts it into the user's localized date format.
 *
 * @param utcTimestamp - The ISO 8601 UTC timestamp string from the database.
 * @returns A formatted date string (e.g., "Jan 1, 2024"). Returns "Invalid Date" if parsing fails.
 */
export const formatLocalDate = (utcTimestamp: string | null | undefined): string => {
    if (!utcTimestamp) return 'Unknown Date';
    try {
        const date = new Date(utcTimestamp);
        // Ensure the date is valid
        if (isNaN(date.getTime())) return 'Invalid Date';
        
        return date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    } catch (e) {
        return 'Invalid Date';
    }
};

/**
 * Safely parses a UTC ISO timestamp and converts it into the user's localized time format.
 *
 * @param utcTimestamp - The ISO 8601 UTC timestamp string from the database.
 * @returns A formatted time string (e.g., "02:30 PM"). Returns "--:--" if parsing fails.
 */
export const formatLocalTime = (utcTimestamp: string | null | undefined): string => {
    if (!utcTimestamp) return '--:--';
    try {
        const date = new Date(utcTimestamp);
        if (isNaN(date.getTime())) return '--:--';
        
        return date.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch (e) {
        return '--:--';
    }
};
