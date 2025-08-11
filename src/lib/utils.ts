/* ------------- DATE UTILS ------------- */

const firstLogDateStr = '2025-07-23';

/**
 * Dictionary mapping each day of the week to the number of times that day occurs in the getTotalDateRange
 * Note: This is calculated once at module load using the initial getTotalDateRange.
 * If the date range changes dynamically, this will not update automatically.
 */
export const dayOfWeekCounts: Record<string, number> = {
    Sunday: 0,
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0
};

(() => {
    const { startDate, endDate } = getTotalDateRange();
    const start = parseLocalDate(startDate);
    const end = parseLocalDate(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dayName = d.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/New_York' });
        dayOfWeekCounts[dayName]++;
    }
})();

/**
 * Parses a date string in 'YYYY-MM-DD' format as a local Date object.
 * @param dateStr The date string to parse.
 * @returns Date object in local time, or undefined if invalid.
 */
function parseLocalDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return new Date(NaN);
    return new Date(year, month - 1, day);
}


/**
 * Converts a date (e.g. '2025-07-29 15:23:27.136077+00')
 * to a date string in New York time (e.g. '2025-7-29').
 * @param utcDate The UTC date.
 * @returns Date string in 'YYYY-M-D' format in New York time.
 */
function parseNYDate(utcDate: Date): string {
    // Convert to NY time
    const nyDate = new Date(
        utcDate.toLocaleString('en-US', { timeZone: 'America/New_York' })
    );

    // Format as 'YYYY-M-D'
    return `${nyDate.getFullYear()}-${nyDate.getMonth() + 1}-${nyDate.getDate()}`;
}

/**
 * Converts a UTC timestamp string (e.g. '2025-07-29 15:23:27.136077+00')
 * to a date string in New York time (e.g. '2025-7-29').
 * @param utcTimestamp The UTC timestamp string.
 * @returns Date string in 'YYYY-M-D' format in New York time.
 */
export function parseNYString(utcTimestamp: string): string {
    return parseNYDate(new Date(utcTimestamp));
}



/**
 * Get date range of data from (at most) four months ago to tomorrow for filtering based on environment and configuration
 */
export function getTotalDateRange(): { startDate: string; endDate: string; totalDays: number } {
    const today = new Date();
    const fourMonthsAgo = new Date(today);
    fourMonthsAgo.setMonth(today.getMonth() - 4);
    
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 1); // Add 1 day buffer
    
    const firstLogDate = parseLocalDate(firstLogDateStr);

    // set beginDate as the later of firstLogDate or fourMonthsAgo
    const beginDate = firstLogDate.getTime() < fourMonthsAgo.getTime() ? fourMonthsAgo : firstLogDate;
    
    const totalDays = Math.ceil((today.getTime() - beginDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
        startDate: parseNYDate(beginDate),
        endDate: parseNYDate(endDate),
        totalDays
    };
}

/**
 * Get date range of data from one week ago to today for filtering based on environment and configuration
 */
export function getLastWeekDateRange(): { startDate: string; endDate: string } {
    const today = new Date();
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 6);

    return {
        startDate: parseNYDate(oneWeekAgo),
        endDate: parseNYDate(today)
    };
}

/* ------------- GENERIC UTILS ------------- */


/**
 * Formats a numeric amount as a US Dollar currency string with no decimal places.
 *
 * @param amount - The numeric value to format as currency.
 * @returns The formatted currency string in USD (e.g., "$1,234").
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Formats a number as a percentage string with a specified number of decimal places.
 *
 * @param value - The numeric value to format as a percentage.
 * @param decimals - The number of decimal places to include (default is 1).
 * @returns The formatted percentage string (e.g., "12.3%").
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Shortens a full weekday name to its standard 3-letter abbreviation. Return empty string if undefined.
 *
 * @param dayName - The full name of the weekday (e.g., "Monday").
 * @returns The abbreviated weekday name (e.g., "Mon"). If input is not a valid weekday, returns the original string.
 */
export function shortenDayName(dayName?: string): string {
    const abbreviations: Record<string, string> = {
        Sunday: 'Sun.',
        Monday: 'Mon.',
        Tuesday: 'Tue.',
        Wednesday: 'Wed.',
        Thursday: 'Thu.',
        Friday: 'Fri.',
        Saturday: 'Sat.',
    };
    return dayName ? abbreviations[dayName] ?? dayName : '';
}


/**
 * Returns a short label for a show time.
 *
 * @param showTime - The show time string ('matinee' or 'evening').
 * @returns The abbreviated label ('Mat.' or 'Eve.'). Returns empty string for other values.
 */
export function shortenShowTimeLabel(showTime?: string): string {
    return showTime === 'matinee' ? 'Matinee' : showTime === 'evening' ? 'Evening' : '';
}


/**
 * Formats a date string into a human-readable format (e.g., "Jan 1, 2024").
 *
 * @param dateString - The date string to format.
 * @returns The formatted date string in "MMM D, YYYY" format.
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};