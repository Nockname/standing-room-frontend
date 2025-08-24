import { parseNYDate } from "./utils";

/**
 * Cache structure for storing show statistics
 */
interface Cache {
    data: any;
    timestamp: number;
}

/**
 * Check if cache is valid (local date and local cache date are an hour apart and on the same date)
 */
function isCacheValid(cache: Cache): boolean {
    const now = new Date(Date.now());
    const cacheDate = new Date(cache.timestamp);
    
    return now.getTime() - cacheDate.getTime() < 60 * 60 * 1000 && parseNYDate(now) == parseNYDate(cacheDate);
}

/**
 * Get cache key for localStorage
 */
export async function getCacheKey(name: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(name);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get cached data from localStorage
 */
export function getCachedData(cacheKey: string): any | null {
    try {
        const cached = localStorage.getItem(cacheKey);
        if (!cached) return null;

        const parsedCache: Cache = JSON.parse(cached);

        if (!isCacheValid(parsedCache)) {
            localStorage.removeItem(cacheKey);
            return null;
        }

        return parsedCache.data;
    } catch (error) {
        console.warn('Error reading cache from localStorage:', error);
        return null;
    }
}


/**
 * Store data in localStorage cache
 */
export function setCachedData(cacheKey: string, data: any): void {
    try {
        const cacheData: Cache = {
            data: data,
            timestamp: Date.now()
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
        console.warn('Error storing cache in localStorage:', error);
    }
}