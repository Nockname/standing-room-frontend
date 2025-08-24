import { createClient } from '@supabase/supabase-js';
import { Show, ShowWithRecentActivity, DayOfWeek } from '../types/index.js';
import { dayOfWeekCounts, parseNYString, getTotalDateRange, getLastWeekDateRange } from './utils.ts';
import { setCachedData, getCachedData, getCacheKey } from './cache.ts';
import { useEffect } from 'react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://exgwstrejyolhvwtzijh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4Z3dzdHJlanlvbGh2d3R6aWpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyOTgwMjgsImV4cCI6MjA2ODg3NDAyOH0.w0-FOpxjJnTLYxyS5frE9olOh9LnJVJ1k_zYeYE7bwE';
const discountDatabase = import.meta.env.VITE_DISCOUNT_DATABASE || 'TKTS Discounts';

const duplicateShowIds: Record<number, number[]> = {
    109: [109, 104, 103, 83] // The Office
};

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/* ------------- TDF EMAIL SUBSCRIPTIONS ------------- */

/**
 * Subscribe to notifications using passwordless magic link
 */
export async function subscribeToNotifications(email: string, preferences = { broadway: true, offBroadway: false, offOffBroadway: false, frequency: 'immediate' }) {
    try {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                data: {
                    subscription_preferences: preferences,
                    subscribed_at: new Date().toISOString(),
                },
                emailRedirectTo: `${window.location.origin}/tdf/preferences?verified=true`
            }
        });

        if (error) throw error;

        return {
            success: true,
            message: 'Please check your email for a magic link to confirm your subscription.',
            needsVerification: true
        };

    } catch (error: any) {
        console.error('Subscription error:', error);
        return {
            success: false,
            message: error.message || 'Failed to subscribe. Please try again.',
            needsVerification: false
        };
    }
}

/**
 * Update user subscription preferences
 */
export async function updateSubscriptionPreferences(preferences: { 
    broadway?: boolean; 
    offBroadway?: boolean; 
    offOffBroadway?: boolean;
    frequency?: 'immediate' | 'daily' | 'weekly';
}) {
    try {
        const { data, error } = await supabase.auth.updateUser({
            data: {
                subscription_preferences: preferences,
                updated_at: new Date().toISOString(),
            }
        });

        if (error) throw error;

        return {
            success: true,
            message: 'Preferences updated successfully!',
            user: data.user
        };

    } catch (error: any) {
        console.error('Update preferences error:', error);
        return {
            success: false,
            message: error.message || 'Failed to update preferences. Please try again.'
        };
    }
}

/**
 * Get user's current subscription preferences
 */
export async function getUserPreferences() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return {
                success: false,
                preferences: null,
                message: 'User not authenticated'
            };
        }

        const preferences = user.user_metadata?.subscription_preferences || { 
            broadway: true, 
            offBroadway: false, 
            offOffBroadway: false,
            frequency: 'immediate' 
        };

        return {
            success: true,
            preferences,
            user,
            email: user.email
        };

    } catch (error: any) {
        return {
            success: false,
            preferences: null,
            message: error.message || 'Failed to get preferences'
        };
    }
}

/**
 * Check if user is currently authenticated and verified
 */
export async function checkAuthStatus() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return {
            isAuthenticated: !!user,
            isVerified: !!user?.email_confirmed_at,
            user
        };
    } catch (error) {
        return {
            isAuthenticated: false,
            isVerified: false,
            user: null
        };
    }
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

/**
 * Sign out the current user
 */
export async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
            return {
                success: false,
                message: error.message
            };
        }
        return {
            success: true,
            message: 'Successfully signed out'
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Unknown error occurred'
        };
    }
}

/* ------------- GENERAL FETCHING METHODS ------------- */

/**
 * Get all show IDs from the database, with daily caching
 */
async function getAllShowIds(): Promise<number[]> {

    // Check if we have valid cached data
    const cached = getCachedData(await getCacheKey(`getAllShowIds`));
    if (cached) {
        return cached;
    }

    const { data, error } = await supabase
        .from('Show Information')
        .select('show_id')
        .eq('is_open', true);

    if (error) {
        throw new Error(`Error fetching show ids: ${error.message}`);
    }

    const result = data ? data.map((show: { show_id: number }) => show.show_id) : []

    setCachedData(await getCacheKey(`getAllShowIds`), result);
    return result;
}

/**
 * Get basic show information by ID, with daily caching
 */
async function getShowInfo(showId: number) {
    
    // Check if we have valid cached data
    const cached = getCachedData(await getCacheKey(`getShowInfo-${showId}`));
    if (cached) {
        return cached;
    }

    const { data, error } = await supabase
        .from('Show Information')
        .select('show_id, show_name, is_broadway, theater, nyt_review')
        .eq('show_id', showId)
        .single();

    if (error) {
        throw new Error(`Error fetching show info for ID ${showId}: ${error.message}`);
    }

    setCachedData(await getCacheKey(`getShowInfo-${showId}`), data);

    return data;
}

/**
 * Get discounts for a specific show where performance date is within the date range, with daily caching for None date-range
 */
async function getShowDiscounts(showId: number, dateRangeName: 'all_time' | 'last_week', showTimeFilter: 'all' | 'matinee' | 'evening' = 'all') {

    // Check if we have valid cached data
    const cached = getCachedData(await getCacheKey(`getShowDiscounts-${showId}-${dateRangeName}-${showTimeFilter}`));
    if (cached) {
        return cached;
    }

    if (showTimeFilter != 'all') {
        const allDiscounts = await getShowDiscounts(showId, dateRangeName, 'all');
        const result: any[] = allDiscounts.filter((discount: any) => 
            showTimeFilter === 'matinee' ? discount.is_matinee : !discount.is_matinee
        );
        setCachedData(await getCacheKey(`getShowDiscounts-${showId}-${dateRangeName}-${showTimeFilter}`), result);
        return result;
    }
    
    const dateRange = dateRangeName === 'last_week' ? getLastWeekDateRange() : getTotalDateRange();

    let showIds = [showId];
    if (showId in duplicateShowIds) {
        showIds = duplicateShowIds[showId];
    }
    
    let query = supabase
        .from(discountDatabase)
        .select('*')
        .in('show_id', showIds)
        .gte('performance_date', dateRange.startDate)
        .lte('performance_date', dateRange.endDate);


    const { data, error } = await query.order('performance_date', { ascending: true });

    if (error) {
        throw new Error(`Error fetching discounts for show ${showId}: ${error.message}`);
    }

    const result = data || [];
    
    setCachedData(await getCacheKey(`getShowDiscounts-${showId}-${dateRangeName}-${showTimeFilter}`), result);
    return result;
}


/* ------------- CALCULATE HOME PAGE STATISTICS ------------- */


/**
 * Calculate statistics for a specific show
 * Helper function for getShowWithStatistics
 */
function calculateShowStatistics(discounts: any[]) {
    if (discounts.length === 0) {
        return {
            averageDiscount: 0,
            averageLowPrice: 0,
            averageHighPrice: 0,
            totalDiscounts: 0,
            lastSeen: undefined,
            dayStats: {},
            availabilityFrequency: 0
        };
    }

    const averageDiscount = discounts.reduce((sum, d) => sum + (d.discount_percent || 0), 0) / discounts.length;
    const averageLowPrice = discounts.reduce((sum, d) => sum + (d.low_price || 0), 0) / discounts.length;
    const averageHighPrice = discounts.reduce((sum, d) => sum + (d.high_price || 0), 0) / discounts.length;


    // Calculate availability frequency, also known as overall availability
    const { totalDays } = getTotalDateRange();
    const createdAtDays = new Set(discounts.map(d => parseNYString(d.created_at)).filter(Boolean));
    const lastAvailableDays = new Set(
        discounts
            .filter(d => d.last_available_time != null)
            .map(d => parseNYString(d.last_available_time))
            .filter(Boolean)
    );
    const uniqueDays = new Set([...createdAtDays, ...lastAvailableDays]);
    const availabilityFrequency = Math.min(uniqueDays.size / totalDays, 1);

    const lastSeen = discounts.length > 0
        ? discounts
            .filter(d => d.last_available_time)
            .sort((a, b) => new Date(b.last_available_time).getTime() - new Date(a.last_available_time).getTime())[0].last_available_time
        : undefined;

    // Calculate day-of-week statistics
    const dayStats: Record<string, any> = {};
    discounts.forEach(discount => {
        if (!discount.performance_date) return;

        const dayName = new Date(discount.performance_date).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
        if (!dayStats[dayName]) {
            dayStats[dayName] = {
                discounts: [],
                totalDiscount: 0,
                totalLowPrice: 0,
                totalHighPrice: 0,
                matineeCount: 0,
                eveningCount: 0
            };
        }
        
        dayStats[dayName].discounts.push(discount);
        dayStats[dayName].totalDiscount += discount.discount_percent || 0;
        dayStats[dayName].totalLowPrice += discount.low_price || 0;
        dayStats[dayName].totalHighPrice += discount.high_price || 0;
        
        if (discount.is_matinee) {
            dayStats[dayName].matineeCount++;
        } else {
            dayStats[dayName].eveningCount++;
        }
    });

    return {
        averageDiscount,
        averageLowPrice,
        averageHighPrice,
        totalDiscounts: discounts.length,
        lastSeen,
        dayStats,
        availabilityFrequency
    };
}


/**
 * Check if a show is available today. Specifically, check if the local date is the same a show's last available date.
 * Helper function for getShowWithStatistics
 */
function isShowAvailableToday(discounts: any[]): boolean {
    const today = new Date();
    const localToday = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    return discounts.some(d => parseNYString(d.last_available_time) === localToday);
}

/**
 * Get comprehensive show data with calculated statistics
 */
async function getShowWithStatistics(showId: number, showTimeFilter: 'all' | 'matinee' | 'evening' = 'all'): Promise<Show> {

    // Check if we have valid cached data
    let cached = getCachedData(await getCacheKey(`getShowWithStatistics-${showId}-${showTimeFilter}`));
    if (cached) {
        if (cached.availableToday) {
            return cached;
        }

        // Recalculate availableToday for cached data and set cache if now is True
        const discounts = await getShowDiscounts(showId, 'all_time', showTimeFilter);
        cached.availableToday = isShowAvailableToday(discounts);
        if (cached.availableToday) {
            setCachedData(await getCacheKey(`getShowWithStatistics-${showId}-${showTimeFilter}`), cached);
        }
    
        return cached;
    }

    const [showInfo, discounts] = await Promise.all([
        getShowInfo(showId),
        getShowDiscounts(showId, 'all_time', showTimeFilter)
    ]);

    const stats = calculateShowStatistics(discounts);

    // Calculate day availability breakdown
    const daysAvailable = Object.entries(stats.dayStats).map(([dayName, dayData]: [string, any]) => {
        const count = dayData.discounts.length;
        const avgDiscount = count > 0 ? dayData.totalDiscount / count : 0;
        const avgLowPrice = count > 0 ? dayData.totalLowPrice / count : 0;
        const avgHighPrice = count > 0 ? dayData.totalHighPrice / count : 0;
        
        // Estimate availability percentage based on frequency
        const uniqueDaysForThisDayOfWeek = new Set(
            dayData.discounts.map((d: any) => d.performance_date)
        ).size;
        const availabilityPercentage = Math.min((uniqueDaysForThisDayOfWeek / dayOfWeekCounts[dayName]) * 100, 100);

        return {
            day_of_week: dayName,
            availability_percentage: availabilityPercentage,
            average_price_range: [Math.round(avgLowPrice), Math.round(avgHighPrice)] as [number, number],
            average_discount: Math.round(avgDiscount),
            frequency_count: count
        };
    });

    const result = {
        id: showInfo.show_id.toString(),
        title: showInfo.show_name.trim(),
        theater: showInfo.theater ? showInfo.theater.trim() : undefined,
        category: showInfo.is_broadway ? 'Broadway' : 'Off-Broadway',
        availability_frequency: stats.availabilityFrequency,
        average_price_range: stats.totalDiscounts > 0 ? [Math.round(stats.averageLowPrice), Math.round(stats.averageHighPrice)] as [number, number] : undefined,
        average_discount: Math.round(stats.averageDiscount),
        last_seen: stats.lastSeen,
        days_available: daysAvailable,
        availableToday: isShowAvailableToday(discounts),
        reviews: showInfo.nyt_review
    };

    setCachedData(await getCacheKey(`getShowWithStatistics-${showId}-${showTimeFilter}`), result);
    return result;
}




/**
 * Get all shows with their statistics (with localStorage caching)
 */
export async function getAllShowsWithStatistics(showTimeFilter: 'all' | 'matinee' | 'evening' = 'all'): Promise<Show[]> {
    
    const showIds = await getAllShowIds();
    
    // Process shows in parallel with some concurrency control
    const batchSize = 5;
    const results: Show[] = [];
    
    for (let i = 0; i < showIds.length; i += batchSize) {
        const batch = showIds.slice(i, i + batchSize);
        const batchResults = await Promise.all(
            batch.map(id => getShowWithStatistics(id, showTimeFilter).catch(error => {
                console.warn(`Failed to fetch show ${id}:`, error.message);
                return null;
            }))
        );
        
        results.push(...batchResults.filter(show => show !== null) as Show[]);
    }

    return results;
}



/* ------------- CALCULATE DASHBOARD STATISTICS ------------- */

/**
 * Get overall statistics: number of shows tracked, average overall availability, and average price ranges
 */
export const getOverallStats = (shows: Show[]) => {
  const totalShows = shows.length;
  if (totalShows === 0) {
    return {
      totalShows: 0,
      averageAvailability: 0,
      averagePriceRange: undefined,
      averageDiscount: 0
    };
  }

  // Only consider shows with a valid price range
  const showsWithPriceRange = shows.filter(show => show.average_price_range && show.average_price_range.length === 2);
  let avgLow = 0, avgHigh = 0;
  if (showsWithPriceRange.length > 0) {
    avgLow = showsWithPriceRange.reduce((sum, show) => sum + (show.average_price_range![0] || 0), 0) / showsWithPriceRange.length;
    avgHigh = showsWithPriceRange.reduce((sum, show) => sum + (show.average_price_range![1] || 0), 0) / showsWithPriceRange.length;
  }

  const showsWithDiscounts = shows.filter(show => show.average_discount);
  const averageAvailability = shows.reduce((sum, show) => sum + show.availability_frequency, 0) / totalShows * 100;
  const averageDiscount = showsWithDiscounts.length > 0
    ? showsWithDiscounts.reduce((sum, show) => sum + (show.average_discount || 0), 0) / showsWithDiscounts.length
    : 0;

  return {
    totalShows,
    averageAvailability,
    averagePriceRange: (avgLow > 0 && avgHigh > 0) ? [Math.round(avgLow), Math.round(avgHigh)] as [number, number] : undefined,
    averageDiscount
  };
};


/**
 * Get weekly discount trends (also known as long term trends) from aggregated data
 */
export async function getWeeklyDiscountTrends() {

    const cached = getCachedData(await getCacheKey(`getWeeklyDiscountTrends`));

    // Check if we have valid cached data
    if (cached) {
        return cached;
    }

    try {
        const { data: weeklyStats, error } = await supabase
            .from('Weekly Statistics')
            .select('week_start, week_end, cumulative_discount_percent, total_discounts, total_shows, average_low_price, average_high_price')
            .gte('week_start', getTotalDateRange().startDate)
            .order('week_start', { ascending: true });

        if (error) {
            throw new Error(`Error fetching weekly statistics: ${error.message}`);
        }

        const discountTrends = weeklyStats.map(stat => ({
            week: new Date(stat.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            totalDiscount: stat.cumulative_discount_percent || 0,
            weekStart: stat.week_start,
            weekEnd: stat.week_end,
            totalDiscounts: stat.total_discounts,
            totalShows: stat.total_shows,
            averageLowPrice: stat.average_low_price,
            averageHighPrice: stat.average_high_price
        }));

        if (!weeklyStats || weeklyStats.length === 0) {
            // Fallback: generate weekly trends from discount data
            console.warn('No weekly statistics found.');
            setCachedData(await getCacheKey(`getWeeklyDiscountTrends`), []);
            return [];
        }

        setCachedData(await getCacheKey(`getWeeklyDiscountTrends`), discountTrends);

        return discountTrends;
    } catch (error) {
        console.error('Error fetching weekly discount trends:', error);
        return [];
    }
}

/**
 * Get best days data with show time filtering
 */
export async function getBestDaysData(showTimeFilter: 'all' | 'matinee' | 'evening' = 'all') {
    const { startDate, endDate } = getTotalDateRange();
    
    let query = supabase
        .from(discountDatabase)
        .select('performance_date, is_matinee, show_id')
        .gte('performance_date', startDate)
        .lte('performance_date', endDate);

    // Apply show time filter
    if (showTimeFilter === 'matinee') {
        query = query.eq('is_matinee', true);
    } else if (showTimeFilter === 'evening') {
        query = query.eq('is_matinee', false);
    }

    const { data: discounts, error } = await query;

    if (error || !discounts) {
        return [];
    }

    // Group by day of week
    const dayGroups: Record<string, any[]> = {};
    
    discounts.forEach(discount => {
        if (!discount.performance_date) return;
        
        const dayName = new Date(discount.performance_date).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
        if (!dayGroups[dayName]) {
            dayGroups[dayName] = [];
        }
        dayGroups[dayName].push(discount);
    });

    return Object.entries(dayGroups).map(([day, dayDiscounts]) => ({
        day: day as DayOfWeek,
        averageNumberOfDiscounts: dayDiscounts.length / dayOfWeekCounts[day],
        uniqueShows: new Set(dayDiscounts.map(d => d.show_id)).size
    }));
}


/**
 * Get top shows by number of TKTS appearances with performance dates in the last week.
 * This does not include shows with performance date tomorrow towards that tally.
 */
export const getTopShowsByRecentAppearances = async (
  shows: Show[],
  showTimeFilter: 'all' | 'matinee' | 'evening' = 'all',
  numberToReturn: number = 3
): Promise<{
  broadway: ShowWithRecentActivity[];
  nonBroadway: ShowWithRecentActivity[];
}> => {

  // Calculate a recent activity score for each show
  // Fetch discounts for all shows in parallel and calculate recentActivityScore
  const scores = await Promise.all(
    shows.map(async show => {
      const discounts = await getShowDiscounts(Number(show.id), 'last_week', showTimeFilter);
      return {
        ...show,
        recentActivityScore: discounts.length
      };
    })
  );

  // Separate by category and get top 3 of each
  const broadwayShows = scores
    .filter(show => show.category === 'Broadway')
    .sort((a, b) => b.recentActivityScore - a.recentActivityScore)
    .slice(0, numberToReturn);

  const nonBroadwayShows = scores
    .filter(show => show.category !== 'Broadway')
    .sort((a, b) => b.recentActivityScore - a.recentActivityScore)
    .slice(0, numberToReturn);

  return {
    broadway: broadwayShows,
    nonBroadway: nonBroadwayShows
  };
};

/* ------------- CALCULATE SHOW-SPECIFIC PAGE STATISTICS ------------- */


/**
 * Get show details for the detail page
 */
export async function getShowDetails(showId: number): Promise<Show> {
    return getShowWithStatistics(showId);
}

/**
 * Get show discount history for charts
 */
export async function getShowDiscountHistory(showId: number): Promise<any[]> {
    const { startDate, endDate } = getTotalDateRange();
    
    const { data, error } = await supabase
        .from(discountDatabase)
        .select('performance_date, discount_percent, low_price, high_price, is_matinee')
        .eq('show_id', showId)
        .gte('performance_date', startDate)
        .lte('performance_date', endDate)
        .order('performance_date', { ascending: true });

    if (error) {
        throw new Error(`Error fetching discount history for show ${showId}: ${error.message}`);
    }

    return data || [];
}

/**
 * Get show sellout times data
 */
export async function getShowSelloutTimes(showId: number): Promise<any[]> {
    const { startDate, endDate } = getTotalDateRange();
    
    const { data, error } = await supabase
        .from(discountDatabase)
        .select('performance_date, performance_time, is_matinee, last_available_time')
        .eq('show_id', showId)
        .gte('performance_date', startDate)
        .lte('performance_date', endDate)
        .not('last_available_time', 'is', null)
        .order('performance_date', { ascending: true });

    if (error) {
        throw new Error(`Error fetching sellout times for show ${showId}: ${error.message}`);
    }

    return (data || []).map(item => {
        const performanceDateTime = new Date(`${item.performance_date}T${item.performance_time}`);
        const lastAvailableTime = new Date(item.last_available_time);
        const timeDifference = (performanceDateTime.getTime() - lastAvailableTime.getTime()) / (1000 * 60 * 60); // Hours

        return {
            date: item.performance_date,
            performanceTime: performanceDateTime.getHours() + performanceDateTime.getMinutes() / 60,
            lastAvailableTime: lastAvailableTime.getHours() + lastAvailableTime.getMinutes() / 60,
            timeDifference: Math.max(timeDifference, 0),
            isMatinee: item.is_matinee,
            lastAvailableDisplay: lastAvailableTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
            performanceTimeDisplay: performanceDateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        };
    });
}

/* ------------- BACKGROUND CACHE ------------- */

// Pre-load TKTS data in the background when landing page loads
export async function preload() {
    useEffect(() => {
    const preloadCache = async () => {
      try {
        // Run all data fetches in parallel
        await Promise.all([
          getAllShowsWithStatistics('all'),
          getWeeklyDiscountTrends()
        ]);
      } catch (error) {
        console.warn('Background cache pre-loading failed:', error);

      }
    };

    // Delay the cache loading slightly to avoid blocking the initial page render
    const timeoutId = setTimeout(preloadCache, 1000);
    
    return () => clearTimeout(timeoutId);
  }, []);
}
