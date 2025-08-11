import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, ChevronDown } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Show } from '../types';
import { getShowDetails, getShowDiscountHistory, getShowSelloutTimes } from '../lib/supabase';
import { chartColors, colors, hexToRgba } from '../lib/colors';
import ReviewPreview from './ReviewPreview';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

interface ShowDetailProps {}

interface ShowDiscountData {
  discount_percent: number;
  count: number;
  performance_date: string;
  day_of_week: string;
  low_price: number;
  high_price: number;
  last_available_time?: string;
}

interface SelloutScatterData {
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

const ShowDetailNew: React.FC<ShowDetailProps> = () => {
  const { showId } = useParams<{ showId: string }>();
  const navigate = useNavigate();
  
  const [show, setShow] = useState<Show | null>(null);
  const [discountHistory, setDiscountHistory] = useState<ShowDiscountData[]>([]);
  const [selloutTimes, setSelloutTimes] = useState<SelloutScatterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selloutChartFilter, setSelloutChartFilter] = useState<'all' | 'matinee' | 'evening'>('all');

  useEffect(() => {
    if (!showId) return;
    
    const loadShowData = async () => {
      try {
        setLoading(true);
        
        const [showData, historyData, selloutData] = await Promise.all([
          getShowDetails(parseInt(showId)),
          getShowDiscountHistory(parseInt(showId)),
          getShowSelloutTimes(parseInt(showId))
        ]);
        
        setShow(showData);
        setDiscountHistory(historyData);
        setSelloutTimes(selloutData);
      } catch (err: any) {
        console.error('Error loading show data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadShowData();
  }, [showId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-1/4 mb-4"></div>
            <div className="h-12 bg-neutral-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-64 bg-neutral-200 rounded"></div>
              <div className="h-64 bg-neutral-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !show) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate('/')}
            className="btn-secondary mb-6 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Shows
          </button>
          <div className="card text-center py-12">
            <div className="text-error-600 text-lg">
              {'Error 404: Show Not Found'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Helper function to format date safely
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Calculate day-of-week availability for this show
  const dayAvailability = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    .map(day => {
      const dayData = discountHistory.filter(d => d.day_of_week === day);
      return {
        day,
        count: dayData.length,
        avgDiscount: dayData.length > 0 ? dayData.reduce((sum, d) => sum + d.discount_percent, 0) / dayData.length : 0
      };
    })
    .sort((a, b) => b.count - a.count);

  // Calculate discount distribution
  const discountRanges = [
    { label: '10-19%', min: 10, max: 19 },
    { label: '20-29%', min: 20, max: 29 },
    { label: '30-39%', min: 30, max: 39 },
    { label: '40-49%', min: 40, max: 49 },
    { label: '50%+', min: 50, max: 100 }
  ];

  const discountDistribution = discountRanges.map(range => ({
    label: range.label,
    count: discountHistory.filter(d => 
      d.discount_percent >= range.min && d.discount_percent <= range.max
    ).length
  }));

  // Calculate long-term trends (weekly aggregation)
  const weeklyTrends = discountHistory.reduce((acc, item) => {
    const date = new Date(item.performance_date);
    const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!acc[weekKey]) {
      acc[weekKey] = {
        week: weekKey,
        totalDiscount: 0,
        count: 0,
        avgLowPrice: 0,
        avgHighPrice: 0
      };
    }
    
    acc[weekKey].totalDiscount += item.discount_percent;
    acc[weekKey].count += 1;
    acc[weekKey].avgLowPrice += item.low_price;
    acc[weekKey].avgHighPrice += item.high_price;
    
    return acc;
  }, {} as Record<string, any>);

  const trendData = Object.values(weeklyTrends)
    .map((week: any) => ({
      ...week,
      avgDiscount: week.totalDiscount / week.count,
      avgLowPrice: week.avgLowPrice / week.count,
      avgHighPrice: week.avgHighPrice / week.count
    }))
    .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime())
    .slice(-12); // Last 12 weeks

  // Day of week analysis for dual-axis bar chart
  const dayOfWeekAnalysis = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    .map(day => {
      const dayShows = selloutTimes.filter(s => {
        const showDate = new Date(s.date);
        return showDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }) === day;
      });
      
      const matineeShows = dayShows.filter(s => s.isMatinee);
      const eveningShows = dayShows.filter(s => !s.isMatinee);
      
      return {
        day: day.slice(0, 3),
        matineeAvg: matineeShows.length > 0 
          ? matineeShows.reduce((sum, s) => sum + s.timeDifference, 0) / matineeShows.length 
          : 0,
        eveningAvg: eveningShows.length > 0 
          ? eveningShows.reduce((sum, s) => sum + s.timeDifference, 0) / eveningShows.length 
          : 0,
        matineeCount: matineeShows.length,
        eveningCount: eveningShows.length
      };
    });

  // Chart configurations
  const bestDaysChartData = {
    labels: dayAvailability.map(d => d.day.slice(0, 3)),
    datasets: [{
      label: 'Discount Appearances',
      data: dayAvailability.map(d => d.count),
      backgroundColor: hexToRgba(colors.warning[500]),
      borderColor: hexToRgba(colors.warning[600]),
      borderWidth: 1,
      borderRadius: 6,
    }]
  };

  const discountDistChartData = {
    labels: discountDistribution.map(d => d.label),
    datasets: [{
      data: discountDistribution.map(d => d.count),
      backgroundColor: [
        hexToRgba(colors.warning[500]),   // Beautiful orange
        chartColors.primary[600],         // Powder blue
        chartColors.accent[600],          // Light cyan
        chartColors.secondary[600],       // Yinmn blue
        chartColors.success[500],         // Green
      ],
      borderWidth: 0,
    }]
  };

  const trendsChartData = {
    labels: trendData.map(d => new Date(d.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [{
      label: 'Average Discount %',
      data: trendData.map(d => d.avgDiscount),
      fill: true,
      backgroundColor: hexToRgba(colors.warning[400], 0.1), // Orange with very low opacity
      borderColor: hexToRgba(colors.warning[500]),
      pointBackgroundColor: hexToRgba(colors.warning[600]),
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      tension: 0.3,
      borderWidth: 3,
    }]
  };

  // Single-axis bar chart data for day of week analysis
  const getFilteredDayOfWeekData = () => {
    if (selloutChartFilter === 'matinee') {
      return {
        labels: dayOfWeekAnalysis.map(d => d.day),
        datasets: [
          {
            label: 'Matinee Shows (Avg Hours Before)',
            data: dayOfWeekAnalysis.map(d => d.matineeAvg),
            backgroundColor: chartColors.primary[600],
            borderWidth: 1,
            borderRadius: 6,
            yAxisID: 'y',
          }
        ]
      };
    } else if (selloutChartFilter === 'evening') {
      return {
        labels: dayOfWeekAnalysis.map(d => d.day),
        datasets: [
          {
            label: 'Evening Shows (Avg Hours Before)',
            data: dayOfWeekAnalysis.map(d => d.eveningAvg),
            backgroundColor: chartColors.primary[500],
            borderWidth: 1,
            borderRadius: 6,
            yAxisID: 'y',
          }
        ]
      };
    } else {
      return {
        labels: dayOfWeekAnalysis.map(d => d.day),
        datasets: [
          {
            label: 'Matinee Shows (Avg Hours Before)',
            data: dayOfWeekAnalysis.map(d => d.matineeAvg),
            backgroundColor: chartColors.primary[600],
            borderWidth: 1,
            borderRadius: 6,
            yAxisID: 'y',
          },
          {
            label: 'Evening Shows (Avg Hours Before)',
            data: dayOfWeekAnalysis.map(d => d.eveningAvg),
            backgroundColor: chartColors.primary[500],
            borderWidth: 1,
            borderRadius: 6,
            yAxisID: 'y',
          }
        ]
      };
    }
  };

  const dayOfWeekChartData = getFilteredDayOfWeekData();

  const dayOfWeekChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: chartColors.neutral[500] }
      },
      tooltip: {
        backgroundColor: chartColors.tooltipBg,
        titleColor: chartColors.tooltipText,
        bodyColor: chartColors.tooltipText,
        borderColor: chartColors.accent[600],
        borderWidth: 1,
        callbacks: {
          afterLabel: (context: any) => {
            const dayData = dayOfWeekAnalysis[context.dataIndex];
            const isMatinee = context.dataset.label.includes('Matinee');
            const count = isMatinee ? dayData.matineeCount : dayData.eveningCount;
            return `(${count} shows)`;
          }
        }
      },
    },
    scales: {
      x: {
        ticks: { color: chartColors.neutral[500] },
        grid: { color: chartColors.grid }
      },
      y: {
        type: 'linear' as const,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Hours Before Performance',
          color: chartColors.neutral[900]
        },
        ticks: { 
          color: chartColors.neutral[900],
          callback: (value: any) => `${value}h`
        },
        grid: { color: chartColors.grid },
        beginAtZero: true
      }
    },
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <button
          onClick={() => navigate('/')}
          className="btn-secondary mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Shows
        </button>

        {/* Show Info */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1 flex flex-col lg:flex-row lg:items-start gap-6">
              <div className="lg:flex-1 lg:min-w-0">
                <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                  {show.title || 'Show Title'}
                </h1>
                {show.theater && (
                  <p className="text-lg text-neutral-400 mb-4">{show.theater}</p>
                )}
                <div className="flex flex-wrap gap-3 mb-4">
                  {show.category && (
                    <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                    show.category === 'Broadway' 
                      ? 'bg-secondary-500 text-white' 
                      : 'bg-primary-500 text-white'
                  }`}>
                    {show.category}
                  </span>
                  )}
                  {show.last_seen && (
                    <span className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-neutral-100 text-neutral-700">
                    Last seen: {formatDate(show.last_seen)}
                  </span>
                  )}
                  {show.availableToday && (
                    <span className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-accent-700 text-white">
                        Available Today
                    </span>
                  )}
                </div>
              </div>
              
              {/* Review Preview - positioned to the right and takes most space */}
              {show.reviews && (
                <div className="flex-1 lg:flex-[2]">
                  <ReviewPreview reviewUrl={show.reviews} showTitle={show.title || 'This Show'} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* When Do TKTS Discounts Sell Out Section */}
        {selloutTimes.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-neutral-900 mb-8">
              When Do TKTS Discounts Sell Out for {show.title}?
            </h2>
            
            {/* Main Layout: Bar Chart Left, Statistics Right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Day of Week Sellout Analysis - Bar Chart (Left, takes 2 columns) */}
              <div className="lg:col-span-2 bg-white rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-warning-500" />
                    Sellout Patterns by Day of Week
                  </h4>
                  
                  {/* Filter Dropdown */}
                  <div className="relative">
                    <select
                      value={selloutChartFilter}
                      onChange={(e) => setSelloutChartFilter(e.target.value as 'evening' | 'matinee' | 'all')}
                      className="appearance-none bg-white border border-neutral-200 rounded-lg px-3 py-2 pr-8 text-sm font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="all">All Performances</option>
                      <option value="evening">Evening Performances</option>
                      <option value="matinee">Matinee Performances</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
                  </div>
                </div>
                <div className="text-sm text-neutral-600 mb-4">
                  Average hours before performance when discounts sell out, by day and show type
                </div>
                <div className="h-80">
                  <Bar data={dayOfWeekChartData} options={dayOfWeekChartOptions} />
                </div>
              </div>

              {/* Statistics and Takeaways (Right, takes 1 column) */}
              <div className="space-y-6">
                {/* Matinee Statistics */}
                <div className="bg-white border border-neutral-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-primary-800 mb-3">Matinee Shows</h4>
                  <div className="space-y-2">
                    {(() => {
                      const matineeShows = selloutTimes.filter(s => s.isMatinee);
                      const avgHours = matineeShows.length > 0 
                        ? matineeShows.reduce((sum, s) => sum + s.timeDifference, 0) / matineeShows.length 
                        : 0;
                      const longestBeforeSellout = matineeShows.length > 0 
                        ? Math.max(...matineeShows.map(s => s.timeDifference))
                        : 0;
                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="text-primary-700">Average sellout time:</span>
                            <span className="font-semibold text-primary-800">{avgHours.toFixed(1)}h before</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-primary-700">Earliest sellout:</span>
                            <span className="font-semibold text-primary-800">{longestBeforeSellout.toFixed(1)}h before</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Evening Statistics */}
                <div className="bg-white border border-neutral-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-warning-800 mb-3">Evening Shows</h4>
                  <div className="space-y-2">
                    {(() => {
                      const eveningShows = selloutTimes.filter(s => !s.isMatinee);
                      const avgHours = eveningShows.length > 0 
                        ? eveningShows.reduce((sum, s) => sum + s.timeDifference, 0) / eveningShows.length 
                        : 0;
                      const longestBeforeSellout = eveningShows.length > 0 
                        ? Math.max(...eveningShows.map(s => s.timeDifference))
                        : 0;
                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="text-warning-700">Average sellout time:</span>
                            <span className="font-semibold text-warning-800">{avgHours.toFixed(1)}h before</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-warning-700">Earliest sellout:</span>
                            <span className="font-semibold text-warning-800">{longestBeforeSellout.toFixed(1)}h before</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Key Insights */}
                <div className="bg-white border border-neutral-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-accent-800 mb-3">Key Insights</h4>
                  <div className="space-y-3 text-sm">
                    {(() => {
                      const matineeShows = selloutTimes.filter(s => s.isMatinee);
                      const eveningShows = selloutTimes.filter(s => !s.isMatinee);
                      const matineeAvg = matineeShows.length > 0 
                        ? matineeShows.reduce((sum, s) => sum + s.timeDifference, 0) / matineeShows.length 
                        : 0;
                      const eveningAvg = eveningShows.length > 0 
                        ? eveningShows.reduce((sum, s) => sum + s.timeDifference, 0) / eveningShows.length 
                        : 0;
                      
                      const insights = [];
                      
                      if (matineeShows.length > 0 && eveningShows.length > 0) {
                        if (matineeAvg > eveningAvg + 2) {
                          insights.push("Matinee shows typically sell out earlier");
                        } else if (eveningAvg > matineeAvg + 2) {
                          insights.push("Evening shows typically sell out earlier");
                        } else {
                          insights.push("Matinee and evening shows sell out at similar times");
                        }
                      }
                      
                      const allShows = selloutTimes;
                      const avgOverall = allShows.reduce((sum, s) => sum + s.timeDifference, 0) / allShows.length;
                      
                      if (avgOverall < 12) {
                        insights.push("Discounts typically remain available close to showtime");
                      } else if (avgOverall > 24) {
                        insights.push("This show often sells out early - check TKTS in the morning");
                      } else {
                        insights.push("Moderate sellout timing - check TKTS in the afternoon");
                      }
                      
                      const longestBeforeOverall = Math.max(...allShows.map(s => s.timeDifference));
                      if (longestBeforeOverall > 30) {
                        insights.push("Some performances sell out very early (30+ hours before)");
                      }
                      
                      return insights.map((insight, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-warning-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-accent-700">{insight}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Best Days */}
          {/* <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-primary-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary-600" />
              Best Days for Discounts
            </h3>
            <div className="h-64">
              <Bar data={bestDaysChartData} options={chartOptions} />
            </div>
          </div> */}

          {/* Discount Distribution */}
          {/* <div className="bg-gradient-to-br from-warning-50 to-warning-100 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-warning-900 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-warning-600" />
              Discount Distribution
            </h3>
            <div className="h-64">
              <Doughnut data={discountDistChartData} options={doughnutOptions} />
            </div>
          </div> */}

          {/* Long Term Trends */}
          {/* <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-xl p-6 lg:col-span-2">
            <h3 className="text-xl font-semibold text-accent-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent-600" />
              12-Week Discount Trends
            </h3>
            <div className="h-64">
              <Line data={trendsChartData} options={chartOptions} />
            </div>
          </div> */}

          {/* Show additional info if no discount history */}
          {discountHistory.length === 0 && (
            <div className="col-span-full">
              <div className="text-center py-12 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-xl">
                <div className="text-neutral-600 text-lg mb-2">
                  No discount history available for this show
                </div>
                <div className="text-neutral-500">
                  This show may not have appeared on TKTS recently, or data is still being collected.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShowDetailNew;
