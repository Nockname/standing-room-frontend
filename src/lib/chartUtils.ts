import { primary, secondary, accent } from './colors';
import { dayOfWeekCounts, getWeekKeyOfDate, getWeekKeyOfString, shortenDayName, parseLocalDate } from './utils';

// Helper function to format week range labels
const formatWeekRange = (weekStartDateStr: string, showFullRange: boolean = true): string => {
    const startDate = new Date(parseLocalDate(weekStartDateStr));
    const startFormatted = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    if (!showFullRange) {
        return startFormatted;
    }
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6); // Add 6 days to get Saturday
    const endFormatted = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    return `${startFormatted} - ${endFormatted}`;
};

// Convert hex colors to rgba
export const hexToRgba = (hex: string, alpha: number = 1): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export interface ShowDiscountData {
    discount_percent: number;
    count: number;
    performance_date: string;
    day_of_week: string;
    low_price: number;
    high_price: number;
    is_matinee: boolean;
    last_available_time?: string;
}

export interface SelloutScatterData {
    timeDifference: number;
    performanceTime: number;
    lastAvailableTime: number;
    isMatinee: boolean;
    date: string;
    discountPercent: number;
    lowPrice: number;
    highPrice: number;
    lastAvailableDisplay: string;
    performanceTimeDisplay: string;
}

// Calculate discount distribution
const getDiscountDistribution = (discountHistory: ShowDiscountData[]) => {
    return [20, 30, 40, 50].map(percent => ({
        label: `${percent}%`,
        count: discountHistory.filter(d => d.discount_percent === percent).length
    }));
};

// Calculate long-term trends (weekly aggregation)
export const getWeeklyTrends = (discountHistory: ShowDiscountData[], durationInWeeks: number = 12) => {
    // First, aggregate the existing discount data by week
    const weeklyTrends = discountHistory.reduce((acc, item) => {

        const weekKey = getWeekKeyOfString(item.performance_date);

        if (!acc[weekKey]) {
            acc[weekKey] = {
                week: weekKey,
                totalDiscount: 0,
                count: 0,
                totalLowPrice: 0,
                totalHighPrice: 0
            };
        }
        
        acc[weekKey].totalDiscount += item.discount_percent;
        acc[weekKey].count += 1;
        acc[weekKey].totalLowPrice += item.low_price;
        acc[weekKey].totalHighPrice += item.high_price;
        
        return acc;
    }, {} as Record<string, any>);

    // Generate a complete range of weeks for the last X weeks
    const weeksArray = [];
    const today = new Date();
    
    for (let i = durationInWeeks; i >= 1; i--) {
        const weekDate = new Date(today);
        weekDate.setDate(weekDate.getDate() - (i * 7));
        
        // Get the start of the week (Sunday)
        const weekKey = getWeekKeyOfDate(weekDate);

        // Use existing data if available, otherwise create empty week
        const weekData = weeklyTrends[weekKey] || {
            week: weekKey,
            totalDiscount: 0,
            count: 0,
            totalLowPrice: 0,
            totalHighPrice: 0
        };
        
        weeksArray.push({
            ...weekData,
            avgDiscount: weekData.count > 0 ? weekData.totalDiscount / weekData.count : 0,
            avgLowPrice: weekData.count > 0 ? weekData.totalLowPrice / weekData.count : 0,
            avgHighPrice: weekData.count > 0 ? weekData.totalHighPrice / weekData.count : 0
        });
    }
    
    return weeksArray;
};

// Day of week analysis for dual-axis bar chart
export const getStackedDayAvailability = (discountHistory: ShowDiscountData[]) => {
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        .map(day => {
            const dayData = discountHistory.filter(d => {
                const performanceDate = new Date(d.performance_date);
                return performanceDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }) === day;
            });
            
            const matineeAverage = dayData.filter(d => d.is_matinee).length / dayOfWeekCounts[day];
            const eveningAverage = dayData.filter(d => !d.is_matinee).length / dayOfWeekCounts[day];
            
            return {
                day: shortenDayName(day),
                matineeAverage,
                eveningAverage
            };
        });
};

// Calculate sellout statistics
export const getSelloutStats = (selloutTimes: SelloutScatterData[]) => {
    const stats = {
        matinee: {
            shows: selloutTimes.filter(s => s.isMatinee),
            avgTime: 0,
            earliestTime: 0
        },
        evening: {
            shows: selloutTimes.filter(s => !s.isMatinee),
            avgTime: 0,
            earliestTime: 0
        },
        overall: {
            shows: selloutTimes,
            avgTime: 0,
            earliestTime: 0
        }
    };

    // Calculate stats
    stats.matinee.avgTime = stats.matinee.shows.length > 0 
        ? stats.matinee.shows.reduce((sum, s) => sum + s.timeDifference, 0) / stats.matinee.shows.length 
        : 0;
    stats.matinee.earliestTime = stats.matinee.shows.length > 0 
        ? Math.max(...stats.matinee.shows.map(s => s.timeDifference))
        : 0;

    stats.evening.avgTime = stats.evening.shows.length > 0 
        ? stats.evening.shows.reduce((sum, s) => sum + s.timeDifference, 0) / stats.evening.shows.length 
        : 0;
    stats.evening.earliestTime = stats.evening.shows.length > 0 
        ? Math.max(...stats.evening.shows.map(s => s.timeDifference))
        : 0;

    stats.overall.avgTime = stats.overall.shows.length > 0 
        ? stats.overall.shows.reduce((sum, s) => sum + s.timeDifference, 0) / stats.overall.shows.length 
        : 0;
    stats.overall.earliestTime = stats.overall.shows.length > 0 
        ? Math.max(...stats.overall.shows.map(s => s.timeDifference))
        : 0;

    return stats;
};

// Best days chart data
export const getBestDaysChartData = (discountHistory: ShowDiscountData[]) => {
    const stackedDayData = getStackedDayAvailability(discountHistory);
    
    return {
        labels: stackedDayData.map(d => d.day),
        datasets: [
            {
                label: 'Evening Performances',
                data: stackedDayData.map(d => d.eveningAverage),
                backgroundColor: hexToRgba(primary[600]), // Darker color for evening (bottom)
                borderColor: hexToRgba(primary[700]),
                borderWidth: 1,
                borderRadius: stackedDayData.map(d => ({
                    bottomLeft: 6,
                    bottomRight: 6,
                    topLeft: d.matineeAverage === 0 ? 6 : 0, // Round top if no matinee
                    topRight: d.matineeAverage === 0 ? 6 : 0    // Round top if no matinee
                })),
            },
            {
                label: 'Matinee Performances',
                data: stackedDayData.map(d => d.matineeAverage),
                backgroundColor: hexToRgba(primary[400]), // Lighter color for matinee (top)
                borderColor: hexToRgba(primary[500]),
                borderWidth: 1,
                borderRadius: {
                    topLeft: 6,
                    topRight: 6,
                    bottomLeft: 0,
                    bottomRight: 0
                },
            }
        ]
    };
};

// Discount distribution chart data
export const getDiscountDistChartData = (discountHistory: ShowDiscountData[]) => {
    const discountDistribution = getDiscountDistribution(discountHistory);
    
    return {
        labels: discountDistribution.map(d => d.label),
        datasets: [{
            label: 'Number of Discounts',
            data: discountDistribution.map(d => d.count),
            backgroundColor: hexToRgba(primary[500]),
            borderColor: hexToRgba(primary[600]),
            borderWidth: 1,
            borderRadius: 6,
        }]
    };
};

// Price trends chart data
export const getPriceChartData = (discountHistory: ShowDiscountData[], durationInWeeks: number = 12, showFullRange: boolean = true) => {
    const trendData = getWeeklyTrends(discountHistory, durationInWeeks);
    
    return {
        labels: trendData.map(d => formatWeekRange(d.week, showFullRange)),
        datasets: [
            {
                label: 'Average Low Price',
                data: trendData.map(d => d.avgLowPrice),
                borderColor: hexToRgba(primary[400]),
                backgroundColor: hexToRgba(primary[400], 1),
                fill: false,
                tension: 0.3,
                yAxisID: 'y',
            },
            {
                label: 'Average High Price', 
                data: trendData.map(d => d.avgHighPrice),
                borderColor: hexToRgba(primary[600]),
                backgroundColor: hexToRgba(primary[600], 1),
                fill: false,
                tension: 0.3,
                yAxisID: 'y',
            }
        ]
    };
};

// Discount volume chart data
export const getDiscountChartData = (discountHistory: ShowDiscountData[], durationInWeeks: number = 12, showFullRange: boolean = true) => {
    const trendData = getWeeklyTrends(discountHistory, durationInWeeks);
    
    return {
        labels: trendData.map(d => formatWeekRange(d.week, showFullRange)),
        datasets: [{
            label: 'Number of Discounts',
            data: trendData.map(d => d.count),
            borderColor: hexToRgba(primary[500]),
            backgroundColor: hexToRgba(primary[500], 0.1),
            fill: true,
            tension: 0.3,
            yAxisID: 'y',
        }]
    };
};

// Average discount percentage chart data
export const getAvgDiscountChartData = (discountHistory: ShowDiscountData[], durationInWeeks: number = 12, showFullRange: boolean = true) => {
    const trendData = getWeeklyTrends(discountHistory, durationInWeeks);
    
    return {
        labels: trendData.map(d => formatWeekRange(d.week, showFullRange)),
        datasets: [{
            label: 'Average Discount Percent',
            data: trendData.map(d => d.avgDiscount),
            borderColor: primary[500],
            backgroundColor: hexToRgba(primary[500], 0.1),
            fill: true,
            tension: 0.3,
            yAxisID: 'y',
        }]
    };
};

// Discount consistency chart data (standard deviation)
export const getDiscountConsistencyChartData = (discountHistory: ShowDiscountData[], durationInWeeks: number = 12, showFullRange: boolean = true) => {
    const trendData = getWeeklyTrends(discountHistory, durationInWeeks);
    
    return {
        labels: trendData.map(d => formatWeekRange(d.week, showFullRange)),
        datasets: [{
            label: 'Standard Deviations in Discount Percent',
            data: trendData.map(d => {
                // Calculate standard deviation of discount percentages for this week
                const weekData = discountHistory.filter(discount => {
                    const weekKey = getWeekKeyOfString(discount.performance_date);
                    return weekKey === d.week;
                });
                
                if (weekData.length <= 1) return 0;
                
                const discounts = weekData.map(item => item.discount_percent);
                const mean = discounts.reduce((sum, val) => sum + val, 0) / discounts.length;
                const variance = discounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / discounts.length;
                return Math.sqrt(variance);
            }),
            borderColor: hexToRgba(primary[300]),
            backgroundColor: hexToRgba(primary[300], 0.1),
            fill: true,
            tension: 0.3,
            yAxisID: 'y',
        }]
    };
};

// Common chart options
export const getChartOptions = () => {
    return {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: { color: primary[700] }
            },
            tooltip: {
                backgroundColor: 'rgba(8, 10, 13, 0.9)',
                titleColor: '#d4ddea',
                bodyColor: '#d4ddea',
                borderColor: accent[600],
                borderWidth: 1,
            },
        },
        scales: {
            x: {
                stacked: true,
                ticks: { color: secondary[500] },
                grid: { color: 'rgba(156, 169, 193, 0.3)' }
            },
            y: {
                stacked: true,
                type: 'linear' as const,
                position: 'left' as const,
                ticks: { 
                    color: secondary[500],
                },
                grid: { color: 'rgba(156, 169, 193, 0.3)' },
                beginAtZero: true
            }
        },
    };
};
