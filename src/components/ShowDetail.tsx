import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
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
import { fetchShowDetails, fetchShowDiscountHistory, fetchShowSelloutTimes } from '../lib/supabase';
import { formatCurrency, formatPercentage } from '../lib/utils';

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
  date: string;
  day_of_week: string;
  low_price: number;
  high_price: number;
  last_available_time?: string;
}

interface SelloutTimeData {
  hour: number;
  count: number;
}

const ShowDetail: React.FC<ShowDetailProps> = () => {
  const { showId } = useParams<{ showId: string }>();
  const navigate = useNavigate();
  
  const [show, setShow] = useState<Show | null>(null);
  const [discountHistory, setDiscountHistory] = useState<ShowDiscountData[]>([]);
  const [selloutTimes, setSelloutTimes] = useState<SelloutTimeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!showId) return;
    
    const loadShowData = async () => {
      try {
        setLoading(true);
        const [showData, historyData, selloutData] = await Promise.all([
          fetchShowDetails(parseInt(showId)),
          fetchShowDiscountHistory(parseInt(showId)),
          fetchShowSelloutTimes(parseInt(showId))
        ]);
        
        setShow(showData);
        setDiscountHistory(historyData);
        setSelloutTimes(selloutData);
      } catch (err: any) {
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
            <div className="h-8 bg-secondary-400 rounded w-1/4 mb-4"></div>
            <div className="h-12 bg-secondary-400 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-64 bg-secondary-400 rounded"></div>
              <div className="h-64 bg-secondary-400 rounded"></div>
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
            <div className="text-error-500 text-lg">
              {error || 'Show not found'}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
    const date = new Date(item.date);
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

  // Sellout time distribution (convert to hour ranges)
  const selloutDistribution = Array.from({ length: 24 }, (_, hour) => ({
    hour: `${hour}:00`,
    count: selloutTimes.filter(s => s.hour === hour).reduce((sum, s) => sum + s.count, 0)
  })).filter(h => h.count > 0);

  // Chart configurations
  const bestDaysChartData = {
    labels: dayAvailability.map(d => d.day.slice(0, 3)),
    datasets: [{
      label: 'Discount Appearances',
      data: dayAvailability.map(d => d.count),
      backgroundColor: 'rgba(20, 184, 166, 0.8)',
      borderColor: 'rgba(20, 184, 166, 1)',
      borderWidth: 1,
      borderRadius: 6,
    }]
  };

  const discountDistChartData = {
    labels: discountDistribution.map(d => d.label),
    datasets: [{
      data: discountDistribution.map(d => d.count),
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(20, 184, 166, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(239, 68, 68, 0.8)',
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
      backgroundColor: 'rgba(20, 184, 166, 0.1)',
      borderColor: 'rgba(20, 184, 166, 1)',
      pointBackgroundColor: 'rgba(20, 184, 166, 1)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      tension: 0.3,
      borderWidth: 2,
    }]
  };

  const selloutChartData = {
    labels: selloutDistribution.map(s => s.hour),
    datasets: [{
      label: 'Sellouts',
      data: selloutDistribution.map(s => s.count),
      backgroundColor: 'rgba(239, 68, 68, 0.8)',
      borderColor: 'rgba(239, 68, 68, 1)',
      borderWidth: 1,
      borderRadius: 6,
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: 'rgba(248, 250, 252, 1)',
        bodyColor: 'rgba(248, 250, 252, 1)',
        borderColor: 'rgba(20, 184, 166, 0.3)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: 'rgba(100, 116, 139, 1)' },
        grid: { color: 'rgba(226, 232, 240, 0.3)' }
      },
      y: {
        ticks: { color: 'rgba(100, 116, 139, 1)' },
        grid: { color: 'rgba(226, 232, 240, 0.5)' },
        beginAtZero: true
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: 'rgba(100, 116, 139, 1)' }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: 'rgba(248, 250, 252, 1)',
        bodyColor: 'rgba(248, 250, 252, 1)',
        borderColor: 'rgba(20, 184, 166, 0.3)',
        borderWidth: 1,
      },
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
        <div className="card mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-secondary-900 mb-2">{show.title}</h1>
              {show.theater && (
                <p className="text-lg text-secondary-600 mb-4">{show.theater}</p>
              )}
              <div className="flex flex-wrap gap-4">
                {show.category && (
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                    show.category === 'Broadway' 
                      ? 'bg-secondary-500 text-white' 
                      : 'bg-primary-500 text-white'
                  }`}>
                    {show.category}
                  </span>
                )}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-primary-400 to-primary-500 text-white rounded-lg p-6 min-w-[300px]">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-secondary-600">Total Appearances:</span>
                  <span className="font-semibold text-secondary-900">{discountHistory.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Avg Discount:</span>
                  <span className="font-semibold text-secondary-900">
                    {discountHistory.length > 0 
                      ? formatPercentage(discountHistory.reduce((sum, d) => sum + d.discount_percent, 0) / discountHistory.length)
                      : '—'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Typical Price Range:</span>
                  <span className="font-semibold text-secondary-900">
                    {show.average_price_range 
                      ? `${formatCurrency(show.average_price_range[0])} - ${formatCurrency(show.average_price_range[1])}`
                      : '—'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Best Days */}
          <div className="card">
            <h3 className="text-xl font-semibold text-secondary-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary-600" />
              Best Days for Discounts
            </h3>
            <Bar data={bestDaysChartData} options={chartOptions} height={200} />
          </div>

          {/* Discount Distribution */}
          <div className="card">
            <h3 className="text-xl font-semibold text-secondary-900 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary-600" />
              Discount Distribution
            </h3>
            <Doughnut data={discountDistChartData} options={doughnutOptions} height={200} />
          </div>

          {/* Long Term Trends */}
          <div className="card">
            <h3 className="text-xl font-semibold text-secondary-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary-600" />
              12-Week Discount Trends
            </h3>
            <Line data={trendsChartData} options={chartOptions} height={200} />
          </div>

          {/* Sellout Times */}
          {selloutDistribution.length > 0 && (
            <div className="card">
              <h3 className="text-xl font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary-600" />
                Evening Show Sellout Times
              </h3>
              <Bar data={selloutChartData} options={chartOptions} height={200} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShowDetail;
