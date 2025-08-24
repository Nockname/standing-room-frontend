import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler } from 'chart.js';
import { primary } from '../lib/colors';
import StandardDropdown from './StandardDropdown';

Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

// Helper function to convert hex colors to rgba
const hexToRgba = (hex: string, alpha: number = 1): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

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
      color: primary[500],
      backgroundColor: hexToRgba(primary[500], 0.1),
    },
    {
      value: 'discount',
      label: 'Cumulative Discount Percent',
      dataKey: 'totalDiscount',
      chartLabel: 'Cumulative Discount Percent (per week)',
      yAxisLabel: 'Cumulative Discount Percent',
      color: primary[500],
      backgroundColor: hexToRgba(primary[500], 0.1),
    },
    {
      value: 'shows',
      label: 'Shows on Offer',
      dataKey: 'totalShows',
      chartLabel: 'Unique Shows with Discounts (per week)',
      yAxisLabel: 'Number of Shows',
      color: primary[500],
      backgroundColor: hexToRgba(primary[500], 0.1),
    },
    {
      value: 'lowPrice',
      label: 'Average Low Price',
      dataKey: 'averageLowPrice',
      chartLabel: 'Average Low Price (per week)',
      yAxisLabel: 'Price ($)',
      color: primary[500],
      backgroundColor: hexToRgba(primary[500], 0.1),
    },
    {
      value: 'highPrice',
      label: 'Average High Price',
      dataKey: 'averageHighPrice',
      chartLabel: 'Average High Price (per week)',
      yAxisLabel: 'Price ($)',
      color: primary[500],
      backgroundColor: hexToRgba(primary[500], 0.1),
    },
  ];

  // Convert configs to dropdown options
  const dropdownOptions = statisticConfigs.map(config => ({
    value: config.value,
    label: config.label
  }));

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
        <StandardDropdown
          options={dropdownOptions}
          value={selectedStatistic}
          onChange={(value) => setSelectedStatistic(value as StatisticType)}
        />
      </div>
      <Line data={data} options={options} height={160} />
    </div>
  );
};

export default RecentTrends;
