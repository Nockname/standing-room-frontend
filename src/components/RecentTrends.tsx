import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler } from 'chart.js';
import { colors, hexToRgba } from '../lib/colors';

Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

interface WeeklyData {
  week: string;
  totalDiscount: number;
  totalDiscounts?: number;
  totalShows?: number;
  averageLowPrice?: number;
  averageHighPrice?: number;
}

interface RecentTrendsProps {
  dailyDiscounts: WeeklyData[];
}

type StatisticType = 'discount' | 'discounts' | 'shows' | 'lowPrice' | 'highPrice';

interface StatisticConfig {
  value: StatisticType;
  label: string;
  dataKey: keyof WeeklyData;
  chartLabel: string;
  yAxisLabel: string;
  color: string;
  backgroundColor: string;
}

const RecentTrends: React.FC<RecentTrendsProps> = ({ dailyDiscounts }) => {
  const [selectedStatistic, setSelectedStatistic] = useState<StatisticType>('discounts');

  const statisticConfigs: StatisticConfig[] = [
    {
      value: 'discounts',
      label: 'Number of Discounts',
      dataKey: 'totalDiscounts',
      chartLabel: 'Total Discounts (per week)',
      yAxisLabel: 'Number of Discounts',
      color: colors.primary[500],
      backgroundColor: hexToRgba(colors.primary[500], 0.1),
    },
    {
      value: 'discount',
      label: 'Cumulative Discount Percent',
      dataKey: 'totalDiscount',
      chartLabel: 'Cumulative Discount Percent (per week)',
      yAxisLabel: 'Cumulative Discount Percent',
      color: colors.primary[500],
      backgroundColor: hexToRgba(colors.primary[500], 0.1),
    },
    {
      value: 'shows',
      label: 'Shows on Offer',
      dataKey: 'totalShows',
      chartLabel: 'Unique Shows with Discounts (per week)',
      yAxisLabel: 'Number of Shows',
      color: colors.primary[500],
      backgroundColor: hexToRgba(colors.primary[500], 0.1),
    },
    {
      value: 'lowPrice',
      label: 'Average Low Price',
      dataKey: 'averageLowPrice',
      chartLabel: 'Average Low Price (per week)',
      yAxisLabel: 'Price ($)',
      color: colors.primary[500],
      backgroundColor: hexToRgba(colors.primary[500], 0.1),
    },
    {
      value: 'highPrice',
      label: 'Average High Price',
      dataKey: 'averageHighPrice',
      chartLabel: 'Average High Price (per week)',
      yAxisLabel: 'Price ($)',
      color: colors.primary[500],
      backgroundColor: hexToRgba(colors.primary[500], 0.1),
    },
  ];

  const currentConfig = statisticConfigs.find(config => config.value === selectedStatistic) || statisticConfigs[0];

  const data = {
    labels: dailyDiscounts.map(d => d.week),
    datasets: [
      {
        label: currentConfig.chartLabel,
        data: dailyDiscounts.map(d => d[currentConfig.dataKey] || 0),
        fill: true,
        backgroundColor: currentConfig.backgroundColor,
        borderColor: currentConfig.color,
        pointBackgroundColor: currentConfig.color,
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      x: { title: { display: true, text: 'Week' } },
      y: { title: { display: true, text: currentConfig.yAxisLabel }, beginAtZero: true },
    },
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-neutral-900">Long Term Trends</h3>
        <div className="relative">
          <select
            value={selectedStatistic}
            onChange={(e) => setSelectedStatistic(e.target.value as StatisticType)}
            className="appearance-none bg-white border border-neutral-500 rounded-md px-3 py-1 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {statisticConfigs.map(config => (
              <option key={config.value} value={config.value}>
                {config.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>
      </div>
      <Line data={data} options={options} height={160} />
    </div>
  );
};

export default RecentTrends;
