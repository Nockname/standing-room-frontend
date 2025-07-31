import { Show, DayOfWeek, ShowWithRecentActivity } from '../types';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const getAvailabilityColor = (percentage: number): {
  text: string;
  bg: string;
  border: string;
} => {
  if (percentage >= 80) {
    return {
      text: 'text-green-700',
      bg: 'bg-green-50',
      border: 'border-green-200',
    };
  }
  if (percentage >= 60) {
    return {
      text: 'text-yellow-700',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
    };
  }
  if (percentage >= 40) {
    return {
      text: 'text-orange-700',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
    };
  }
  return {
    text: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
  };
};

export const getDayAbbreviation = (day: DayOfWeek): string => {
  const abbreviations: Record<DayOfWeek, string> = {
    Monday: 'Mon',
    Tuesday: 'Tue',
    Wednesday: 'Wed',
    Thursday: 'Thu',
    Friday: 'Fri',
    Saturday: 'Sat',
    Sunday: 'Sun',
  };
  return abbreviations[day];
};

export const calculateOverallStats = (shows: Show[]) => {
  const totalShows = shows.length;
  if (totalShows === 0) {
    return {
      totalShows: 0,
      averageAvailability: 0,
      averagePriceRange: undefined,
      averageDiscount: 0,
      topShow: null,
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

  const topShow = shows.reduce((top, current) => 
    current.availability_frequency > top.availability_frequency ? current : top
  );

  return {
    totalShows,
    averageAvailability,
    averagePriceRange: (avgLow > 0 && avgHigh > 0) ? [Math.round(avgLow), Math.round(avgHigh)] as [number, number] : undefined,
    averageDiscount,
    topShow,
  };
};

export const predictDayAvailability = (show: Show, targetDay: DayOfWeek): number => {
  if (!show.days_available) {
    return show.availability_frequency * 100;
  }

  const dayData = show.days_available.find(d => d.day_of_week === targetDay);
  if (dayData) {
    return dayData.availability_percentage;
  }

  // If no specific day data, return overall frequency
  return show.availability_frequency * 100;
};

export const getPopularDays = (shows: Show[]): Array<{ day: DayOfWeek; averageAvailability: number }> => {
  const dayStats: Record<DayOfWeek, { total: number; count: number }> = {
    Monday: { total: 0, count: 0 },
    Tuesday: { total: 0, count: 0 },
    Wednesday: { total: 0, count: 0 },
    Thursday: { total: 0, count: 0 },
    Friday: { total: 0, count: 0 },
    Saturday: { total: 0, count: 0 },
    Sunday: { total: 0, count: 0 },
  };

  shows.forEach(show => {
    if (show.days_available) {
      // For each day of the week, increment count by 1
      Object.keys(dayStats).forEach(day => {
      dayStats[day as DayOfWeek].count += 1;
      // If the show has data for this day, add its availability
      const dayData = show.days_available!.find(d => d.day_of_week === day);
      if (dayData) {
        dayStats[day as DayOfWeek].total += dayData.availability_percentage;
      }
      });
      } else {
      // If no days_available, still increment count for all days
      Object.keys(dayStats).forEach(day => {
      dayStats[day as DayOfWeek].count += 1;
      });
    }
  });

  return Object.entries(dayStats)
    .map(([day, stats]) => ({
      day: day as DayOfWeek,
      averageAvailability: stats.count > 0 ? stats.total / stats.count : 0,
    }))
    .sort((a, b) => b.averageAvailability - a.averageAvailability);
};

// Get top shows by recent TKTS appearances
export const getTopShowsByRecentAppearances = (shows: Show[]): {
  broadway: ShowWithRecentActivity[];
  nonBroadway: ShowWithRecentActivity[];
} => {
  // Calculate a recent activity score for each show
  const showsWithScores = shows.map(show => {
    let recentActivityScore = 0;
    
    // Get the current date and one week ago
    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);
    
    // Since we don't have access to raw discount data with specific dates here,
    // we'll estimate recent activity based on the recency of last_seen
    // and overall activity patterns
    
    if (show.last_seen) {
      const lastSeenDate = new Date(show.last_seen);
      const daysSinceLastSeen = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // If the show was seen in the last week, estimate weekly appearances
      if (daysSinceLastSeen <= 7) {
        // Estimate appearances in the last week (max 7 days, one per day)
        // Based on availability frequency and how recently it was seen
        const estimatedWeeklyDays = Math.min(Math.ceil(show.availability_frequency * 7), 7);
        recentActivityScore = Math.max(estimatedWeeklyDays, 1);
        
        // Bonus for very recent appearances
        if (daysSinceLastSeen <= 1) {
          recentActivityScore += 2;
        } else if (daysSinceLastSeen <= 3) {
          recentActivityScore += 1;
        }
      } else {
        // Show not seen in last week, score of 0
        recentActivityScore = 0;
      }
    } else {
      // No last_seen data, assume minimal recent activity
      recentActivityScore = 0;
    }
    
    return {
      ...show,
      recentActivityScore
    };
  });
  
  // Separate by category and get top 5 of each
  const broadwayShows = showsWithScores
    .filter(show => show.category === 'Broadway')
    .sort((a, b) => b.recentActivityScore - a.recentActivityScore)
    .slice(0, 5);
    
  const nonBroadwayShows = showsWithScores
    .filter(show => show.category !== 'Broadway')
    .sort((a, b) => b.recentActivityScore - a.recentActivityScore)
    .slice(0, 5);
    
  return {
    broadway: broadwayShows,
    nonBroadway: nonBroadwayShows
  };
};

// Get popular days with show time filter support
export const getPopularDaysByShowTime = (
  shows: Show[], 
  showTimeFilter: 'all' | 'matinee' | 'evening' = 'all'
): Array<{ day: DayOfWeek; averageAvailability: number }> => {
  const dayStats: Record<DayOfWeek, { total: number; count: number }> = {
    Monday: { total: 0, count: 0 },
    Tuesday: { total: 0, count: 0 },
    Wednesday: { total: 0, count: 0 },
    Thursday: { total: 0, count: 0 },
    Friday: { total: 0, count: 0 },
    Saturday: { total: 0, count: 0 },
    Sunday: { total: 0, count: 0 },
  };

  shows.forEach(show => {
    if (show.days_available) {
      // For each day of the week, increment count by 1
      Object.keys(dayStats).forEach(day => {
        dayStats[day as DayOfWeek].count += 1;
        // If the show has data for this day, add its availability
        const dayData = show.days_available!.find(d => d.day_of_week === day);
        if (dayData) {
          // When filtering by show time, we need to adjust the availability
          // For now, we'll use the overall day availability since we don't have
          // show time-specific data in the day availability structure
          // This could be enhanced if we add show time data to the days_available structure
          let adjustedAvailability = dayData.availability_percentage;
          
          // Apply show time filter adjustment
          if (showTimeFilter === 'matinee' || showTimeFilter === 'evening') {
            // Estimate that matinee/evening shows represent roughly 50% of total availability
            // This is a simplification - ideally we'd have separate matinee/evening availability data
            adjustedAvailability = dayData.availability_percentage * 0.5;
          }
          
          dayStats[day as DayOfWeek].total += adjustedAvailability;
        }
      });
    } else {
      // If no days_available, still increment count for all days
      Object.keys(dayStats).forEach(day => {
        dayStats[day as DayOfWeek].count += 1;
      });
    }
  });

  return Object.entries(dayStats)
    .map(([day, stats]) => ({
      day: day as DayOfWeek,
      averageAvailability: stats.count > 0 ? stats.total / stats.count : 0,
    }))
    .sort((a, b) => b.averageAvailability - a.averageAvailability);
};
