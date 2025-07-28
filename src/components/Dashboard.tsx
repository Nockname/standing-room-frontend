import React, { useEffect, useState } from 'react';
import RecentTrends from './RecentTrends';
import BestDaysBarGraph from './BestDaysBarGraph';
import { fetchRecentDiscountTrends, getShowsWithRecentAppearances } from '../lib/supabase';
import { Show } from '../types';
import { Award } from 'lucide-react';
import { getPopularDays, calculateOverallStats } from '../lib/utils';

interface DashboardProps {
  shows: Show[];
}

interface WeeklyTrendData {
  week: string;
  totalDiscount: number;
  totalDiscounts?: number;
  totalShows?: number;
  averageLowPrice?: number;
  averageHighPrice?: number;
}

const Dashboard: React.FC<DashboardProps> = ({ shows }) => {
  const [trendData, setTrendData] = useState<WeeklyTrendData[]>([]);
  const [topShows, setTopShows] = useState<{
    broadway: any[];
    nonBroadway: any[];
  }>({ broadway: [], nonBroadway: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trendsData, topShowsData] = await Promise.all([
          fetchRecentDiscountTrends(),
          getShowsWithRecentAppearances(shows)
        ]);
        setTrendData(trendsData);
        setTopShows(topShowsData);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [shows]);

  const stats = calculateOverallStats(shows);
  const popularDays = getPopularDays(shows);

  return (
    <div className="mb-8 space-y-6">
      {/* Quick Insights */}
      <div
        className="bg-gradient-to-r from-warning-600 via-warning-500 to-warning-600 text-white rounded-xl p-6"
      >
        {/* <h2 className="text-2xl font-bold mb-4">TKTS Insights</h2> */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <div className="text-center">
        <div className="text-xl sm:text-2xl md:text-3xl font-bold">{stats.totalShows}</div>
        <div className="text-xs sm:text-sm opacity-90">Shows Tracked</div>
          </div>
          <div className="text-center">
        <div className="text-xl sm:text-2xl md:text-3xl font-bold">{stats.averageAvailability.toFixed(1)}%</div>
        <div className="text-xs sm:text-sm opacity-90">Average Availability</div>
          </div>
          <div className="text-center">
        <div className="text-xl sm:text-2xl md:text-3xl font-bold">
          {stats.averagePriceRange ? `$${stats.averagePriceRange[0]} - $${stats.averagePriceRange[1]}` : '—'}
        </div>
        <div className="text-xs sm:text-sm opacity-90">Average Price Range</div>
          </div>
        </div>
      </div>

      {/* Top Shows by Recent Appearances - Combined - Hidden on small screens */}
      <div className="hidden lg:block card relative">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-warning-500" />
          Top Shows by Number of TKTS Appearances Last Week
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Broadway Shows */}
          <div>
            <h4 className="text-md font-medium text-neutral-900 mb-3 text-center">Broadway</h4>
            <div className="space-y-2">
              {topShows.broadway.map((show, index) => (
                <div key={show.id} className="flex items-center justify-between py-2 border-b border-neutral-300 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-secondary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="min-h-[2.5rem] flex flex-col justify-center">
                      <div className="font-medium text-neutral-900">{show.title}</div>
                      <div className="text-xs text-neutral-600 h-4">
                        {show.theater || ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-secondary-600">
                      {Math.floor(show.recentActivityScore)}
                    </div>
                    <div className="text-xs text-neutral-700">Appearances</div>
                  </div>
                </div>
              ))}
              {topShows.broadway.length === 0 && (
                <div className="text-center text-neutral-700 py-4">Loading Broadway shows...</div>
              )}
            </div>
          </div>

          {/* Custom Divider */}
          <div className="hidden lg:block absolute left-1/2 top-16 bottom-6 w-px bg-neutral-300 transform -translate-x-1/2"></div>

          {/* Off-Broadway Shows */}
          <div className="pt-6 lg:pt-0 border-t lg:border-t-0 border-neutral-300">
            <h4 className="text-md font-medium text-neutral-900 mb-3 text-center">Off-Broadway</h4>
            <div className="space-y-2">
              {topShows.nonBroadway.map((show, index) => (
                <div key={show.id} className="flex items-center justify-between py-2 border-b border-neutral-300 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="min-h-[2.5rem] flex flex-col justify-center">
                      <div className="font-medium text-neutral-900">{show.title}</div>
                      <div className="text-xs text-neutral-600 h-4">
                        {show.theater || ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-primary-600">
                      {Math.floor(show.recentActivityScore)}
                    </div>
                    <div className="text-xs text-neutral-700">Appearances</div>
                  </div>
                </div>
              ))}
              {topShows.nonBroadway.length === 0 && (
                <div className="text-center text-neutral-700 py-4">Loading Off-Broadway shows...</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Best Days and Trends Side by Side - Hidden on small screens */}
      <div className="hidden lg:grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Days to Visit Bar Graph */}
        <BestDaysBarGraph data={popularDays} />
        
        {/* Recent Trends */}
        {loading ? (
          <div className="card text-center py-12 text-neutral-700">Loading long term trends...</div>
        ) : error ? (
          <div className="card text-center py-12 text-error-700">Error loading trends: {error}</div>
        ) : (
          <RecentTrends dailyDiscounts={trendData} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
