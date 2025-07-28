import { createClient } from '@supabase/supabase-js';
import { Show } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

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
    console.log('🔄 Loading TKTS shows from Supabase...');
    console.log('📊 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('🔑 API Key length:', import.meta.env.VITE_SUPABASE_ANON_KEY?.length);
    
    // Test basic connection first
    console.log('🧪 Testing Supabase connection...');
    
    // First, get all shows
    console.log('📋 Fetching Show Information...');
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

    console.log('✅ Shows data fetched successfully:', showsData?.length || 0, 'shows');
    console.log('📋 Sample show data:', showsData?.[0]);

    // Then get all discount data with pagination to ensure we get everything
    console.log('💰 Fetching TKTS Discounts Fake (with pagination)...');
    
    let allDiscountsData: any[] = [];
    const pageSize = 1000;
    let currentPage = 0;
    let hasMoreData = true;
    
    while (hasMoreData) {
      const { data: pageData, error: discountsError } = await supabase
        .from('TKTS Discounts Fake')
        .select('*')
        .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1)
        .order('id', { ascending: true }); // Ensure consistent ordering
      
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
        console.log(`✅ Fetched page ${currentPage + 1}: ${pageData.length} discounts (total: ${allDiscountsData.length})`);
        
        // Check if we got a full page, if not we're done
        hasMoreData = pageData.length === pageSize;
        currentPage++;
      } else {
        hasMoreData = false;
      }
    }

    console.log('✅ All discounts data fetched successfully:', allDiscountsData.length, 'total discounts');
    console.log('💰 Sample discount data:', allDiscountsData?.[0]);

    // Apply show time filter if specified
    let discountsData = allDiscountsData;
    if (showTimeFilter !== 'all') {
      const isMatineeFilter = showTimeFilter === 'matinee';
      discountsData = allDiscountsData.filter(discount => discount.is_matinee === isMatineeFilter);
      console.log(`🎭 Filtered to ${showTimeFilter} shows: ${discountsData.length} discounts (from ${allDiscountsData.length} total)`);
    }

    // If we have no data, return empty array but log it
    if (!showsData || showsData.length === 0) {
      console.warn('⚠️ No shows found in database');
      return [];
    }

    if (!discountsData || discountsData.length === 0) {
      console.warn('⚠️ No discounts found in database');
      return [];
    }

    // Calculate date range for last 4 months (extending to capture fake data)
    const today = new Date();
    const fourMonthsAgo = new Date(today);
    fourMonthsAgo.setMonth(today.getMonth() - 4);
    
    // Extend the end date by a few days to ensure we capture all fake data
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 1); // Add 1 day buffer
    
    const fourMonthsAgoStr = fourMonthsAgo.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    console.log(`📅 Calculating availability for last 4 months: ${fourMonthsAgoStr} to ${endDateStr}`);
    console.log(`📅 Today's actual date: ${new Date().toLocaleDateString()} (${today.toISOString().split('T')[0]})`);
    console.log(`📅 Four months ago: ${fourMonthsAgo.toLocaleDateString()} (${fourMonthsAgoStr})`);
    
    // Calculate total days in the last 4 months
    const totalDaysInPeriod = Math.ceil((today.getTime() - fourMonthsAgo.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate days per day-of-week in the last 3 months
    const daysPerWeek: { [key: string]: number } = {
      Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0
    };
    
    for (let d = new Date(fourMonthsAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = dayNames[d.getDay()];
      daysPerWeek[dayName]++;
    }
    
    console.log('� Days per week in last 3 months:', daysPerWeek);
    console.log('📊 Total days in period:', totalDaysInPeriod);

    // Transform the data to match our expected format
    console.log('🔄 Transforming data...');
    const transformedShows = showsData?.map(show => {
      // Find all discounts for this show
      const showDiscounts = discountsData?.filter(discount => discount.show_id === show.show_id) || [];
      console.log(`📊 Show "${show.show_name}" has ${showDiscounts.length} discount entries`);
      
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
          if (!isInRange && showDiscounts.indexOf(discount) === 0) {
            // Debug log for the first discount that's filtered out
            console.log(`🔍 Date filter debug for "${show.show_name}":`, {
              performanceDate,
              fourMonthsAgoStr,
              endDateStr,
              isInRange,
              comparison: `${performanceDate} >= ${fourMonthsAgoStr} && ${performanceDate} <= ${endDateStr}`
            });
          }
          return isInRange;
        });

        console.log(`🔍 Show "${show.show_name}": ${showDiscounts.length} total discounts, ${recentDiscounts.length} in date range`);

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

        console.log(`📊 Show "${show.show_name}" availability: ${uniqueDaysWithDiscounts} unique days with discounts / ${totalDaysInPeriod} total days = ${(availabilityFrequency * 100).toFixed(1)}%`);

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
        
        console.log(`📊 Day ${dayName}: ${uniqueDaysOfThisTypeWithDiscounts} unique days with discounts / ${daysOfThisTypeInPeriod} total ${dayName}s = ${availabilityPercentage.toFixed(1)}%`);
        
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
        days_available: daysAvailable.length > 0 ? daysAvailable : undefined
      };

      console.log(`✅ Transformed show:`, transformed);
      return transformed;
    }) || [];

    console.log('🎉 Successfully transformed', transformedShows.length, 'shows');
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
    console.log('📈 Fetching weekly discount trends from Weekly Statistics table...');
    
    // Get today and 1 year ago for filtering
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0];
    
    console.log(`📅 Fetching weekly trends from ${oneYearAgoStr} to today`);

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

    console.log('✅ Weekly statistics fetched successfully:', weeklyStats?.length || 0, 'weeks');
    console.log('📊 Sample weekly stat:', weeklyStats?.[0]);

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

    console.log('📈 Transformed weekly trends:', transformedData.length, 'weeks');
    console.log('📊 Sample transformed data:', transformedData[0]);
    console.log('📊 Date range:', transformedData[0]?.weekStart, 'to', transformedData[transformedData.length - 1]?.weekStart);

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
    console.log('📊 Fetching recent TKTS appearances for shows...');
    
    // Get today and 1 week ago
    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);
    const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    // Fetch all discounts from the last week
    const { data: recentDiscounts, error } = await supabase
      .from('TKTS Discounts Fake')
      .select('show_id, performance_date')
      .gte('performance_date', oneWeekAgoStr)
      .lte('performance_date', todayStr);

    if (error) {
      console.error('❌ Error fetching recent discounts:', error);
      throw error;
    }

    console.log('✅ Recent discounts fetched:', recentDiscounts?.length || 0);

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

    console.log('📊 Top Broadway shows by recent appearances:', broadwayShows.map(s => `${s.title}: ${s.recentActivityScore}`));
    console.log('📊 Top Off-Broadway shows by recent appearances:', nonBroadwayShows.map(s => `${s.title}: ${s.recentActivityScore}`));

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
export async function fetchShowDetails(showId: number): Promise<Show> {
  try {
    console.log('🔍 Fetching details for show ID:', showId);
    
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
      .from('TKTS Discounts Fake')
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

    const show: Show = {
      id: showData.id.toString(),
      title: showData.title,
      theater: showData.theater,
      category: showData.category,
      availability_frequency: discounts.length / 100, // Normalize to 0-1
      average_discount: avgDiscount,
      average_price_range: avgLowPrice > 0 && avgHighPrice > 0 ? [Math.round(avgLowPrice), Math.round(avgHighPrice)] : undefined,
      last_seen: lastSeen,
      days_available: daysAvailable
    };

    console.log('✅ Show details fetched successfully:', show.title);
    return show;

  } catch (error) {
    console.error('💥 Error fetching show details:', error);
    throw error;
  }
}

// Fetch discount history for a specific show
export async function fetchShowDiscountHistory(showId: number): Promise<any[]> {
  try {
    console.log('📈 Fetching discount history for show ID:', showId);
    
    const { data, error } = await supabase
      .from('TKTS Discounts Fake')
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

    console.log('✅ Discount history fetched:', history.length, 'records');
    return history;

  } catch (error) {
    console.error('💥 Error fetching discount history:', error);
    throw error;
  }
}

// Fetch sellout times for evening shows for a specific show
export async function fetchShowSelloutTimes(showId: number): Promise<any[]> {
  try {
    console.log('⏰ Fetching sellout times for show ID:', showId);
    
    // Get evening shows that sold out (have last_available_time)
    const { data, error } = await supabase
      .from('TKTS Discounts Fake')
      .select('last_available_time, show_time')
      .eq('show_id', showId)
      .eq('show_time', 'Evening')
      .not('last_available_time', 'is', null);
    
    if (error) {
      console.error('❌ Error fetching sellout times:', error);
      throw error;
    }

    // Parse sellout times and group by hour
    const hourCounts: Record<number, number> = {};
    
    (data || []).forEach(item => {
      if (item.last_available_time) {
        try {
          // Parse time string (assuming format like "14:30" or "2:30 PM")
          const timeStr = item.last_available_time;
          let hour: number;
          
          if (timeStr.includes('PM') || timeStr.includes('AM')) {
            // 12-hour format
            const [timePart, period] = timeStr.split(' ');
            const [hourStr] = timePart.split(':');
            hour = parseInt(hourStr);
            if (period === 'PM' && hour !== 12) hour += 12;
            if (period === 'AM' && hour === 12) hour = 0;
          } else {
            // 24-hour format
            const [hourStr] = timeStr.split(':');
            hour = parseInt(hourStr);
          }
          
          if (!isNaN(hour) && hour >= 0 && hour < 24) {
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
          }
        } catch (e) {
          console.warn('⚠️ Could not parse time:', item.last_available_time);
        }
      }
    });

    const selloutTimes = Object.entries(hourCounts).map(([hour, count]) => ({
      hour: parseInt(hour),
      count
    }));

    console.log('✅ Sellout times fetched:', selloutTimes.length, 'time slots');
    return selloutTimes;

  } catch (error) {
    console.error('💥 Error fetching sellout times:', error);
    return []; // Return empty array on error
  }
}
