import { createClient } from '@supabase/supabase-js';
import { Show } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://exgwstrejyolhvwtzijh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4Z3dzdHJlanlvbGh2d3R6aWpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyOTgwMjgsImV4cCI6MjA2ODg3NDAyOH0.w0-FOpxjJnTLYxyS5frE9olOh9LnJVJ1k_zYeYE7bwE';
const discountDatabase = import.meta.env.VITE_DISCOUNT_DATABASE || 'TKTS Discounts';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Calculate date string for 4 months ago
const today = new Date();
const fourMonthsAgo = new Date(today);
fourMonthsAgo.setMonth(today.getMonth() - 4);
const fourMonthsAgoStr = fourMonthsAgo.toISOString().split('T')[0];

const endDate = new Date(today);
endDate.setDate(today.getDate() + 1); // Add 1 day buffer

const endDateStr = endDate.toISOString().split('T')[0];


const firstLogDate = parseLocalDate('2025-07-23');
// For fake data, use the full 4-month period; for real data, use the later of firstLogDate or fourMonthsAgo
const beginDate = discountDatabase === 'TKTS Discounts Fake' ? fourMonthsAgo : (firstLogDate < fourMonthsAgo ? fourMonthsAgo : firstLogDate);

// Calculate total days in the last 4 months
const totalDaysInPeriod = Math.ceil((today.getTime() - beginDate.getTime()) / (1000 * 60 * 60 * 24));


/**
 * Parses a date string in 'YYYY-MM-DD' format as a local Date object.
 * @param dateStr The date string to parse.
 * @returns Date object in local time, or undefined if invalid.
 */
export function parseLocalDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return new Date(NaN);
    return new Date(year, month - 1, day);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function fetchShows(showTimeFilter: 'all' | 'matinee' | 'evening' = 'all') {
  try {
    // First, get all shows
    const { data: showsData, error: showsError } = await supabase
      .from('Show Information')
      .select('*, theater');
    
    if (showsError) {
      console.error('❌ Error fetching shows:', showsError);
      console.error('📋 Shows error details:', {
        message: showsError.message,
        details: showsError.details,
        hint: showsError.hint,
        code: showsError.code
      });
      throw showsError;
    }


    // Then get all discount data with pagination to ensure we get everything
    
    let allDiscountsData: any[] = [];
    const pageSize = 1000;
    let currentPage = 0;
    let hasMoreData = true;

    // get all data from the past 4 months
    while (hasMoreData) {
      let query = supabase
        .from(discountDatabase)
        .select('*')
        .gte('performance_date', fourMonthsAgoStr)
        .order('id', { ascending: true })
        .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);

      // Only apply show time filter if not 'all'
      if (showTimeFilter !== 'all') {
        query = query.eq('is_matinee', showTimeFilter === 'matinee');
      }

      const { data: pageData, error: discountsError } = await query;

      if (discountsError) {
      console.error('❌ Error fetching discounts page:', currentPage, discountsError);
      console.error('💰 Discounts error details:', {
        message: discountsError.message,
        details: discountsError.details,
        hint: discountsError.hint,
        code: discountsError.code
      });
      throw discountsError;
      }

      if (pageData && pageData.length > 0) {
        allDiscountsData = allDiscountsData.concat(pageData);
        
        // Check if we got a full page, if not we're done
        hasMoreData = pageData.length === pageSize;
        currentPage++;
      } else {
        hasMoreData = false;
      }
    }

    // All filtering is now done in the query, so we can use the data directly
    const discountsData = allDiscountsData;

    // If we have no data, return empty array but log it
    if (!showsData || showsData.length === 0) {
      console.warn('⚠️ No shows found in database');
      return [];
    }

    if (!discountsData || discountsData.length === 0) {
      console.warn('⚠️ No discounts found in database');
      return [];
    }

    // Calculate days per day-of-week in the last 4 months
    const daysPerWeek: { [key: string]: number } = {
      Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0
    };
    
    for (let d = new Date(beginDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = dayNames[d.getDay()];
      daysPerWeek[dayName]++;
    }

    // Transform the data to match our expected format
    const transformedShows = showsData?.map(show => {
      // Find all discounts for this show
      const showDiscounts = discountsData?.filter(discount => discount.show_id === show.show_id) || [];      
      // Calculate statistics from discount data
      let avgDiscount = 0;
      let availabilityFrequency = 0;
      let lastSeen = null;
      let avgLowPrice: number | undefined = undefined;
      let avgHighPrice: number | undefined = undefined;

      if (showDiscounts.length > 0) {
        // Calculate average low and high prices
        const lowPrices = showDiscounts.map(d => d.low_price);
        const highPrices = showDiscounts.map(d => d.high_price);
        avgLowPrice = lowPrices.reduce((sum, price) => sum + price, 0) / lowPrices.length;
        avgHighPrice = highPrices.reduce((sum, price) => sum + price, 0) / highPrices.length;
        // Calculate average discount
        const discounts = showDiscounts.map(d => d.discount_percent);
        avgDiscount = discounts.reduce((sum, discount) => sum + discount, 0) / discounts.length;

        // Filter discounts to last 4 months for availability calculation
        const recentDiscounts = showDiscounts.filter(discount => {
          if (!discount.performance_date) return false;
          const performanceDate = discount.performance_date;
          const isInRange = performanceDate >= fourMonthsAgoStr && performanceDate <= endDateStr;
          return isInRange;
        });

        // Calculate overall availability: unique performance dates in last 4 months / total days in period
        // Use Set to get unique dates only, avoiding double-counting multiple discounts on same day
        const uniquePerformanceDates = new Set(
          recentDiscounts
            .map(d => d.performance_date)
            .filter(date => date) // Remove null/undefined dates
        );
        const uniqueDaysWithDiscounts = uniquePerformanceDates.size;
        
        const rawAvailability = uniqueDaysWithDiscounts / totalDaysInPeriod;
        availabilityFrequency = Math.min(rawAvailability, 1.0);

        // Get most recent availability
        const sortedDiscounts = showDiscounts.sort((a, b) => 
          new Date(b.last_available_time || b.created_at).getTime() - 
          new Date(a.last_available_time || a.created_at).getTime()
        );
        lastSeen = sortedDiscounts[0]?.last_available_time || sortedDiscounts[0]?.created_at;
      }

      // Group discounts by day of week for days_available
      const dayGroups: { [key: string]: any[] } = {};
      showDiscounts.forEach(discount => {
        if (discount.performance_date) {
          // Parse performance_date as local date (not UTC)
          const date = parseLocalDate(discount.performance_date);
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const dayName = dayNames[date.getDay()];
          
          if (!dayGroups[dayName]) {
            dayGroups[dayName] = [];
          }
          dayGroups[dayName].push(discount);
        }
      });

      // Calculate day-specific statistics
      const daysAvailable = Object.entries(dayGroups).map(([dayName, dayDiscounts]) => {
        const dayLowPrices = dayDiscounts.map(d => d.low_price);
        const dayHighPrices = dayDiscounts.map(d => d.high_price);
        const dayDiscountPercents = dayDiscounts.map(d => d.discount_percent);

        let availabilityPercentage = 0;
        
        // Filter day discounts to last 4 months
        const recentDayDiscounts = dayDiscounts.filter(discount => {
          if (!discount.performance_date) return false;
          const performanceDate = discount.performance_date;
          return performanceDate >= fourMonthsAgoStr && performanceDate <= endDateStr;
        });

        // Calculate availability for this day of week using unique dates only
        // Get unique performance dates for this day of week to avoid double-counting
        const uniqueDayDates = new Set(
          recentDayDiscounts
            .map(d => d.performance_date)
            .filter(date => date) // Remove null/undefined dates
        );
        const uniqueDaysOfThisTypeWithDiscounts = uniqueDayDates.size;
        
        const daysOfThisTypeInPeriod = daysPerWeek[dayName] || 1; // avoid division by zero
        const rawDayAvailability = uniqueDaysOfThisTypeWithDiscounts / daysOfThisTypeInPeriod;
        availabilityPercentage = Math.min(rawDayAvailability * 100, 100); // Cap at 100%
                
        return {
          day_of_week: dayName,
          availability_percentage: availabilityPercentage, // Normalize
          average_price_range: (dayLowPrices.length && dayHighPrices.length && !isNaN(dayLowPrices.reduce((sum, price) => sum + price, 0) / dayLowPrices.length) && !isNaN(dayHighPrices.reduce((sum, price) => sum + price, 0) / dayHighPrices.length))
            ? [
                Math.round(dayLowPrices.reduce((sum, price) => sum + price, 0) / dayLowPrices.length),
                Math.round(dayHighPrices.reduce((sum, price) => sum + price, 0) / dayHighPrices.length)
              ] as [number, number]
            : undefined,
          average_discount: dayDiscountPercents.reduce((sum, disc) => sum + disc, 0) / dayDiscountPercents.length,
          frequency_count: dayDiscounts.length
        };
      });

      // Check if show is available today
      const todayStr = today.toISOString().split('T')[0];
      const availableToday = showDiscounts.some(discount => {
        if (!discount.last_available_time || !discount.performance_date) return false;
        
        // Extract date from last_available_time (format: "2025-07-31T16:25:53+00:00")
        // or use performance_date as fallback
        let lastAvailableDate;
        if (discount.last_available_time.includes('T')) {
          lastAvailableDate = discount.last_available_time.split('T')[0];
        } else {
          lastAvailableDate = discount.performance_date;
        }
        
        return lastAvailableDate === todayStr;
      });

      // Get NYT review URL from show information (not discount data)
      const reviewUrl = show.nyt_review ? show.nyt_review.replace(/\$0$/, '') : undefined;

      const transformed = {
        id: show.show_id.toString(),
        title: show.show_name,
        theater: show.theater || undefined,
        category: show.is_broadway ? 'Broadway' : 'Off-Broadway',
        availability_frequency: availabilityFrequency,
        average_price_range: (avgLowPrice !== undefined && avgHighPrice !== undefined && !isNaN(avgLowPrice) && !isNaN(avgHighPrice))
          ? [Math.round(avgLowPrice), Math.round(avgHighPrice)] as [number, number]
          : undefined,
        average_discount: avgDiscount > 0 ? Math.round(avgDiscount) : undefined,
        last_seen: lastSeen ? new Date(lastSeen).toLocaleDateString('en-US') : undefined,
        days_available: daysAvailable.length > 0 ? daysAvailable : undefined,
        availableToday: availableToday,
        reviews: reviewUrl
      };

      return transformed;
    }) || [];

    return transformedShows;
    
  } catch (error) {
    console.error('💥 Fatal error loading shows from Supabase:', error);
    console.error('📋 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    // Return empty array instead of mock data so we can see if there are real database issues
    return [];
  }
}

// Get weekly cumulative discount trends from the Weekly Statistics table
export async function fetchRecentDiscountTrends() {
  try {
    
    // Get today and 1 year ago for filtering
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0];


    // Fetch weekly statistics from the last year, ordered by week
    const { data: weeklyStats, error } = await supabase
      .from('Weekly Statistics')
      .select('week_start, week_end, cumulative_discount_percent, total_discounts, total_shows, average_low_price, average_high_price')
      .gte('week_start', oneYearAgoStr)
      .order('week_start', { ascending: true });

    if (error) {
      console.error('❌ Error fetching weekly statistics:', error);
      throw error;
    }

    if (!weeklyStats || weeklyStats.length === 0) {
      console.warn('⚠️ No weekly statistics found in database for the last year');
      return [];
    }

    // Transform the data to match the expected format for the chart
    // Convert week_start to a readable week label and use cumulative_discount_percent
    const transformedData = weeklyStats.map(stat => {
      const weekStart = new Date(stat.week_start);
      
      // Format week label as "MMM DD" (e.g., "Jul 22")
      const weekLabel = weekStart.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      return {
        week: weekLabel,
        totalDiscount: stat.cumulative_discount_percent || 0,
        // Additional data for potential future use
        weekStart: stat.week_start,
        weekEnd: stat.week_end,
        totalDiscounts: stat.total_discounts,
        totalShows: stat.total_shows,
        averageLowPrice: stat.average_low_price,
        averageHighPrice: stat.average_high_price
      };
    });

    return transformedData;
    
  } catch (error) {
    console.error('💥 Error fetching weekly discount trends:', error);
    console.error('📋 Error details:', error instanceof Error ? error.stack : 'No stack trace');
    // Return empty array on error so the chart can handle gracefully
    return [];
  }
}

// Get shows with actual TKTS appearances in the last week
export async function getShowsWithRecentAppearances(shows: Show[]) {
  try {
    // Get today and 1 week ago
    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);
    const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    // Fetch all discounts from the last week
    const { data: recentDiscounts, error } = await supabase
      .from(discountDatabase)
      .select('show_id, performance_date')
      .gte('performance_date', oneWeekAgoStr)
      .lte('performance_date', todayStr);

    if (error) {
      console.error('❌ Error fetching recent discounts:', error);
      throw error;
    }

    // Count all individual appearances (including multiple per day)
    const showAppearanceCounts: { [showId: string]: number } = {};
    
    if (recentDiscounts) {
      recentDiscounts.forEach(discount => {
        const showId = discount.show_id.toString();
        
        if (!showAppearanceCounts[showId]) {
          showAppearanceCounts[showId] = 0;
        }
        
        // Count each discount record as one appearance
        showAppearanceCounts[showId]++;
      });
    }

    // Map shows to include their recent appearance count
    const showsWithRecentActivity = shows.map(show => ({
      ...show,
      recentActivityScore: showAppearanceCounts[show.id] || 0
    }));

    // Separate by category and get top 3 of each
    const broadwayShows = showsWithRecentActivity
      .filter(show => show.category === 'Broadway')
      .sort((a, b) => b.recentActivityScore - a.recentActivityScore)
      .slice(0, 3);
      
    const nonBroadwayShows = showsWithRecentActivity
      .filter(show => show.category !== 'Broadway')
      .sort((a, b) => b.recentActivityScore - a.recentActivityScore)
      .slice(0, 3);

    return {
      broadway: broadwayShows,
      nonBroadway: nonBroadwayShows
    };

  } catch (error) {
    console.error('💥 Error getting shows with recent appearances:', error);
    // Fallback to empty result
    return {
      broadway: [],
      nonBroadway: []
    };
  }
}

// Fetch detailed information for a specific show
// This function is used on a show's specific web page
export async function fetchShowDetails(showId: number): Promise<Show> {
  try {
    const { data: showData, error: showError } = await supabase
      .from('Show Information')
      .select('*')
      .eq('id', showId)
      .single();
    
    if (showError) {
      console.error('❌ Error fetching show details:', showError);
      throw showError;
    }

    if (!showData) {
      throw new Error('Show not found');
    }

    // Get aggregated discount data for this show
    const { data: discountsData, error: discountsError } = await supabase
      .from(discountDatabase)
      .select('*')
      .eq('show_id', showId);
    
    if (discountsError) {
      console.error('❌ Error fetching show discounts:', discountsError);
    }

    const discounts = discountsData || [];
    
    // Calculate aggregated stats
    const avgDiscount = discounts.length > 0 
      ? discounts.reduce((sum, d) => sum + (d.discount_percent || 0), 0) / discounts.length 
      : 0;

    const avgLowPrice = discounts.length > 0 
      ? discounts.reduce((sum, d) => sum + (d.low_price || 0), 0) / discounts.length 
      : 0;

    const avgHighPrice = discounts.length > 0 
      ? discounts.reduce((sum, d) => sum + (d.high_price || 0), 0) / discounts.length 
      : 0;

    const lastSeen = discounts.length > 0 
      ? discounts.sort((a, b) => new Date(b.performance_date).getTime() - new Date(a.performance_date).getTime())[0]?.performance_date
      : undefined;

    // Get day-of-week statistics
    const dayStats: Record<string, { count: number; total: number }> = {};
    discounts.forEach(discount => {
      const day = new Date(discount.performance_date).toLocaleDateString('en-US', { weekday: 'long' });
      if (!dayStats[day]) {
        dayStats[day] = { count: 0, total: 0 };
      }
      dayStats[day].count++;
      dayStats[day].total += discount.discount_percent || 0;
    });

    const daysAvailable = Object.entries(dayStats).map(([day, stats]) => ({
      day_of_week: day,
      availability_percentage: stats.count > 0 ? (stats.total / stats.count) : 0,
      frequency_count: stats.count
    }));

    // Get NYT review URL from show data
    const reviewUrl = showData.nyt_review ? showData.nyt_review.replace(/\$0$/, '') : undefined;

    const show: Show = {
      id: showData.id.toString(),
      title: showData.show_name,
      theater: showData.theater,
      category: showData.is_broadway ? 'Broadway' : 'Off-Broadway',
      availability_frequency: discounts.length / 100, // Normalize to 0-1
      average_discount: avgDiscount,
      average_price_range: avgLowPrice > 0 && avgHighPrice > 0 ? [Math.round(avgLowPrice), Math.round(avgHighPrice)] : undefined,
      last_seen: lastSeen,
      days_available: daysAvailable,
      reviews: reviewUrl
    };

    return show;

  } catch (error) {
    console.error('💥 Error fetching show details:', error);
    throw error;
  }
}

// Fetch discount history for a specific show
export async function fetchShowDiscountHistory(showId: number): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from(discountDatabase)
      .select('*')
      .eq('show_id', showId)
      .order('performance_date', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching discount history:', error);
      throw error;
    }

    const history = (data || []).map(discount => ({
      discount_percent: discount.discount_percent || 0,
      count: 1,
      date: discount.performance_date,
      day_of_week: new Date(discount.performance_date).toLocaleDateString('en-US', { weekday: 'long' }),
      low_price: discount.low_price || 0,
      high_price: discount.high_price || 0,
      last_available_time: discount.last_available_time
    }));

    return history;

  } catch (error) {
    console.error('💥 Error fetching discount history:', error);
    throw error;
  }
}

// Fetch sellout times data for scatterplot showing time difference between last discount and performance
export async function fetchShowSelloutTimes(showId: number): Promise<any[]> {
  try {
    // Get shows that sold out (have last_available_time) with their performance times
    const { data, error } = await supabase
      .from(discountDatabase)
      .select('last_available_time, performance_time, performance_date, is_matinee, discount_percent, low_price, high_price')
      .eq('show_id', showId)
      .not('last_available_time', 'is', null)
      .not('performance_time', 'is', null);
    
    if (error) {
      console.error('❌ Error fetching sellout times:', error);
      throw error;
    }

    const scatterData: any[] = [];
    
    (data || []).forEach(item => {
      if (item.last_available_time && item.performance_time) {
        try {
          // Parse last available time (format: "HH:MM:SS" or "H:MM AM/PM")
          let lastAvailableHour = 0;
          const timeStr = item.last_available_time;
          
          if (timeStr.includes('PM') || timeStr.includes('AM')) {
            // 12-hour format
            const [timePart, period] = timeStr.split(' ');
            const [hourStr, minuteStr] = timePart.split(':');
            lastAvailableHour = parseInt(hourStr) + (parseInt(minuteStr) || 0) / 60;
            if (period === 'PM' && lastAvailableHour !== 12) lastAvailableHour += 12;
            if (period === 'AM' && lastAvailableHour === 12) lastAvailableHour = 0;
          } else {
            // 24-hour format (HH:MM:SS or HH:MM)
            const [hourStr, minuteStr] = timeStr.split(':');
            lastAvailableHour = parseInt(hourStr) + (parseInt(minuteStr) || 0) / 60;
          }
          
          // Parse performance time (format: "HH:MM:SS")
          const [perfHourStr, perfMinuteStr] = item.performance_time.split(':');
          const performanceHour = parseInt(perfHourStr) + (parseInt(perfMinuteStr) || 0) / 60;
          
          // Calculate time difference in hours (performance - last available)
          let timeDifference = performanceHour - lastAvailableHour;
          
          // Handle day boundary crossing (e.g., 11 PM last available, 2 PM next day performance)
          if (timeDifference < 0) {
            timeDifference += 24;
          }
          
          // Only include reasonable time differences (0-24 hours)
          if (timeDifference >= 0 && timeDifference <= 24) {
            scatterData.push({
              timeDifference: timeDifference,
              performanceTime: performanceHour,
              lastAvailableTime: lastAvailableHour,
              isMatinee: item.is_matinee,
              date: item.performance_date,
              discountPercent: item.discount_percent,
              lowPrice: item.low_price,
              highPrice: item.high_price,
              // Convert times to Eastern timezone display format
              lastAvailableDisplay: formatTimeToEastern(item.last_available_time),
              performanceTimeDisplay: formatTimeToEastern(item.performance_time)
            });
          }
        } catch (e) {
          console.warn('⚠️ Could not parse sellout time data:', item);
        }
      }
    });

    return scatterData;

  } catch (error) {
    console.error('💥 Error fetching sellout times:', error);
    return []; // Return empty array on error
  }
}

// Helper function to format time for Eastern timezone display
function formatTimeToEastern(timeStr: string): string {
  try {
    if (timeStr.includes('PM') || timeStr.includes('AM')) {
      return timeStr; // Already in 12-hour format
    } else {
      // Convert 24-hour to 12-hour format
      const [hourStr, minuteStr] = timeStr.split(':');
      const hour = parseInt(hourStr);
      const minute = parseInt(minuteStr) || 0;
      
      if (hour === 0) {
        return `12:${minute.toString().padStart(2, '0')} AM`;
      } else if (hour < 12) {
        return `${hour}:${minute.toString().padStart(2, '0')} AM`;
      } else if (hour === 12) {
        return `12:${minute.toString().padStart(2, '0')} PM`;
      } else {
        return `${hour - 12}:${minute.toString().padStart(2, '0')} PM`;
      }
    }
  } catch (e) {
    return timeStr;
  }
}

// Fetch best days data for different show time filters
export async function fetchBestDaysData(showTimeFilter: 'all' | 'matinee' | 'evening' = 'all') {
  try {
    // Get discount data with show time filter
    let discountsQuery = supabase
      .from(discountDatabase)
      .select('show_id, performance_date, is_matinee, created_at');
    
    discountsQuery = discountsQuery.eq('is_matinee', showTimeFilter === 'matinee');
    
    const { data: discountsData, error } = await discountsQuery;
    
    if (error) {
      console.error('❌ Error fetching discounts for best days:', error);
      throw error;
    }

    if (!discountsData || discountsData.length === 0) {
      console.warn('⚠️ No discounts found for best days calculation');
      return [];
    }

    // Filter to recent discounts
    const recentDiscounts = discountsData.filter(discount => {
      if (!discount.performance_date) return false;
      const performanceDate = discount.performance_date;
      return performanceDate >= fourMonthsAgoStr && performanceDate <= endDateStr;
    });

    // Calculate days per day-of-week in the last 4 months
    const daysPerWeek: { [key: string]: number } = {
      Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0
    };
    
    for (
      let d = new Date(beginDate.getTime());
      d <= today;
      d.setDate(d.getDate() + 1)
    ) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = dayNames[d.getDay()];
      daysPerWeek[dayName]++;
    }

    console.log('Days per week:', daysPerWeek);

    // Group discounts by day of week
    const dayGroups: { [key: string]: any[] } = {
      Sunday: [], Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: []
    };
    
    recentDiscounts.forEach(discount => {
      if (discount.performance_date) {
        const date = parseLocalDate(discount.performance_date);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[date.getDay()];
        // If created_at exists and its date is different from performance_date, add it as a separate entry
        // if (discount.created_at) {
        //     const createdTime = new Date(discount.created_at);
        //   if (createdTime.getDay() !== parseLocalDate(discount.performance_date).getDay()) {
        //       console.log('Created time:', createdTime, 'Performance date:', discount.performance_date);

        //     const createdDayName = dayNames[createdTime.getDay()];
        //     dayGroups[createdDayName].push([discount, 'created_at']);
        //   }
        // }
        dayGroups[dayName].push(discount);
      }
    });

    // Calculate availability percentage for each day
    const bestDaysData = Object.entries(dayGroups).map(([dayName, dayDiscounts]) => {
      console.log(dayDiscounts);
      
      const daysOfThisTypeInPeriod = daysPerWeek[dayName] || 1;
      const averageNumberOfDiscounts = dayDiscounts.length / daysOfThisTypeInPeriod;
      
      return {
        day: dayName,
        averageNumberOfDiscounts: averageNumberOfDiscounts
      };
    });

    return bestDaysData;
    
  } catch (error) {
    console.error('💥 Error fetching best days data:', error);
    return [];
  }
}
