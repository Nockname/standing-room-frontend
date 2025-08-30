import { Show } from '../types';
import { getShowDetails, getShowDiscountHistory, getShowSelloutTimes } from '../lib/supabase';
import ReviewPreview from './ReviewPreview';
import { formatDate } from '../lib/utils';
import { 
  ShowDiscountData, 
  SelloutScatterData,
  getPriceChartData,
  getDiscountChartData,
  getAvgDiscountChartData,
  getDiscountConsistencyChartData,
  getBestDaysChartData,
  getDiscountDistChartData,
  getSelloutStats,
  getChartOptions
} from '../lib/chartUtils';
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import StandardDropdown from './StandardDropdown';
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

const ShowDetail: React.FC<ShowDetailProps> = () => {
  const { showId } = useParams<{ showId: string }>();
  const navigate = useNavigate();
  
  const [show, setShow] = useState<Show | null>(null);
  const [discountHistory, setDiscountHistory] = useState<ShowDiscountData[]>([]);
  const [selloutTimes, setSelloutTimes] = useState<SelloutScatterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Duration state for each chart (default to 12 months = 52 weeks)
  const [priceDuration, setPriceDuration] = useState<string>('4');
  const [discountVolumeDuration, setDiscountVolumeDuration] = useState<string>('4');
  const [discountPercentDuration, setDiscountPercentDuration] = useState<string>('4');
  const [discountConsistencyDuration, setDiscountConsistencyDuration] = useState<string>('4');

  // Duration options for dropdowns
  const durationOptions = [
    { value: '4', label: 'Last 4 Weeks' },
    { value: '16', label: 'Last 16 Weeks' },
    // { value: '52', label: 'Last 52 Weeks' }
  ];

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

  // Track window width for responsive chart labels
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
            onClick={() => navigate('/tkts')}
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

  // Recent discounts table data (last 10 sorted by performance date)
  const recentDiscounts = [...discountHistory]
    .sort((a, b) => new Date(b.performance_date).getTime() - new Date(a.performance_date).getTime())
    .slice(0, 8);

  // Determine if we should show full week ranges based on screen width
  const showFullRange = windowWidth >= 768; // Show full range on md screens and larger
  
  // Create a key that changes when responsive breakpoint is crossed to force chart remount
  const chartKey = showFullRange ? 'wide' : 'narrow';

  // Get chart data from utility functions with duration parameters
  const priceChartData = getPriceChartData(discountHistory, parseInt(priceDuration), showFullRange);
  const discountChartData = getDiscountChartData(discountHistory, parseInt(discountVolumeDuration), showFullRange);
  const avgDiscountChartData = getAvgDiscountChartData(discountHistory, parseInt(discountPercentDuration), showFullRange);
  const discountConsistencyChartData = getDiscountConsistencyChartData(discountHistory, parseInt(discountConsistencyDuration), showFullRange);
  const bestDaysChartData = getBestDaysChartData(discountHistory);
  const discountDistChartData = getDiscountDistChartData(discountHistory);

  // Get sellout statistics
  const selloutStats = getSelloutStats(selloutTimes);

  // Get chart options
  const chartOptions = getChartOptions();


  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <button
          onClick={() => navigate('/tkts')}
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
                    Last seen: {formatDate(show.last_seen, 'long')}
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

        {/* Charts and Analytics Section */}
        {discountHistory.length > 0 && (
          <div className="space-y-12">
            {/* Long Term Trends */}
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-8">Long Term Trends</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Average Low and High Prices Timeline */}
                <div className="bg-white border border-neutral-200 rounded-xl p-8">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-2xl font-semibold text-neutral-900">
                      Price Trends
                    </h3>
                    <StandardDropdown
                      options={durationOptions}
                      value={priceDuration}
                      onChange={setPriceDuration}
                    />
                  </div>
                  <p className="text-neutral-600 text-sm mb-6">
                    Average high and low prices per week.
                  </p>
                  <div>
                    <Line 
                      key={`price-${chartKey}`}
                      data={priceChartData} 
                      options={{
                      ...chartOptions,
                      scales: {
                        ...chartOptions.scales,
                        x: {
                          ...chartOptions.scales.x,
                          stacked: false,
                        },
                        y: {
                          ...chartOptions.scales.y,
                          stacked: false,
                          ticks: {
                            ...chartOptions.scales.y.ticks,
                            callback: function(value: any) {
                              return '$' + value;
                            }
                          }
                        }
                      }
                    }} />
                  </div>
                </div>

                {/* Number of Discounts Timeline */}
                <div className="bg-white border border-neutral-200 rounded-xl p-8">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-2xl font-semibold text-neutral-900">
                      Discount Volume
                    </h3>
                    <StandardDropdown
                      options={durationOptions}
                      value={discountVolumeDuration}
                      onChange={setDiscountVolumeDuration}
                    />
                  </div>
                  <p className="text-neutral-600 text-sm mb-6">
                    Average number of discounts offered per week.
                  </p>
                  <div>
                    <Line key={`discount-${chartKey}`} data={discountChartData} options={chartOptions} />
                  </div>
                </div>

                {/* Average Discount Percentage Timeline */}
                <div className="bg-white border border-neutral-200 rounded-xl p-8">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-2xl font-semibold text-neutral-900">
                      Discount Percent
                    </h3>
                    <StandardDropdown
                      options={durationOptions}
                      value={discountPercentDuration}
                      onChange={setDiscountPercentDuration}
                    />
                  </div>
                  <p className="text-neutral-600 text-sm mb-6">
                    Average discount percentage per week.
                  </p>
                  <div>
                    <Line key={`avg-discount-${chartKey}`} data={avgDiscountChartData} options={chartOptions} />
                  </div>
                </div>

                {/* Discount Consistency Timeline */}
                <div className="bg-white border border-neutral-200 rounded-xl p-8">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-2xl font-semibold text-neutral-900">
                      Discount Inconsistency
                    </h3>
                    <StandardDropdown
                      options={durationOptions}
                      value={discountConsistencyDuration}
                      onChange={setDiscountConsistencyDuration}
                    />
                  </div>
                  <p className="text-neutral-600 text-sm mb-6">
                    Standard deviation of discount percentages per week.
                  </p>
                  <div>
                    <Line key={`consistency-${chartKey}`} data={discountConsistencyChartData} options={chartOptions} />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Discounts Table */}
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-8">Recent Discounts</h2>
              <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Performance Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Performance Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Discount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Price Range</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {recentDiscounts.map((discount, index) => (
                        <tr key={index} className="hover:bg-neutral-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                            <span className="hidden lg:inline">
                              {new Date(discount.performance_date).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                            <span className="lg:hidden">
                              {new Date(discount.performance_date).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                            </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                            <span className="hidden lg:inline">
                              {new Date(discount.performance_date).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC'})} {discount.is_matinee ? 'Matinee' : 'Evening'}
                            </span>
                            <span className="lg:hidden">
                              {new Date(discount.performance_date).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC'})} {discount.is_matinee ? 'Matinee' : 'Evening'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-semibold text-warning-600`}>
                              {discount.discount_percent}% off
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                            {discount.low_price && discount.high_price
                              ? `${discount.low_price} - ${discount.high_price}`
                              : discount.low_price
                              ? `${discount.low_price} - N/A`
                              : discount.high_price
                              ? `N/A - ${discount.high_price}`
                              : 'Unknown'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Discount Analysis */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-neutral-900 mb-8">Discount Analysis</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Best Days with Stacked Chart */}
                <div className="bg-white border border-neutral-200 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                    Best Days for Discounts
                  </h3>
                  <p className="text-neutral-600 text-sm mb-4">
                    The expected number of discounts, by the day of the week of the performance and performance type.
                  </p>
                    <div>
                    <Bar 
                      key={`best-days-${chartKey}`}
                      data={bestDaysChartData} 
                      options={{
                      ...chartOptions,
                      scales: {
                      ...chartOptions.scales,
                      y: {
                        ...chartOptions.scales.y,
                        max: 2
                      }
                      }
                    }} />
                    </div>
                </div>

                {/* Discount Distribution */}
                <div className="bg-white border border-neutral-200 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                    Discount Percentage Distribution
                  </h3>
                  <p className="text-neutral-600 text-sm mb-4">
                      The total number of TKTS offerings at each discount percentage.
                  </p>
                  <div>
                    <Bar key={`discount-dist-${chartKey}`} data={discountDistChartData} options={chartOptions} />
                  </div>
                </div>
              </div>
            </div>

            {/* Sellout Patterns Table */}
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-8">Sellout Patterns</h2>
              <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px]">
                    <thead className="bg-neutral-50 border-b border-neutral-200">
                      <tr>
                        <th className="px-4 sm:px-6 py-4 text-left text-sm font-semibold text-neutral-900">
                          Performance Type
                        </th>
                        <th className="px-4 sm:px-6 py-4 text-right text-sm font-semibold text-neutral-900">
                          Average Sellout Time
                        </th>
                        <th className="px-4 sm:px-6 py-4 text-right text-sm font-semibold text-neutral-900">
                          Earliest Sellout Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      <tr className="hover:bg-neutral-50">
                        <td className="px-4 sm:px-6 py-4 text-sm font-medium text-neutral-900">
                          Matinee
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-neutral-600 text-right">
                          {selloutStats.matinee.avgTime.toFixed(1)}h before
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-neutral-600 text-right">
                          {selloutStats.matinee.earliestTime.toFixed(1)}h before
                        </td>
                      </tr>
                      <tr className="hover:bg-neutral-50">
                        <td className="px-4 sm:px-6 py-4 text-sm font-medium text-neutral-900">
                          Evening
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-neutral-600 text-right">
                          {selloutStats.evening.avgTime.toFixed(1)}h before
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-neutral-600 text-right">
                          {selloutStats.evening.earliestTime.toFixed(1)}h before
                        </td>
                      </tr>
                      <tr className="hover:bg-neutral-50 bg-neutral-25">
                        <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-neutral-900">
                          Overall
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-neutral-900 text-right">
                          {selloutStats.overall.avgTime.toFixed(1)}h before
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-neutral-900 text-right">
                          {selloutStats.overall.earliestTime.toFixed(1)}h before
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Show additional info if no discount history */}
        {discountHistory.length === 0 && (
          <div className="text-center py-12 bg-white border border-neutral-200 rounded-xl">
            <div className="text-neutral-600 text-lg mb-2">
              No discount history available for this show
            </div>
            <div className="text-neutral-500">
              This show may not have appeared on TKTS recently, or data is still being collected.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShowDetail;
