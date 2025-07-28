import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { DayOfWeek } from '../types';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface BestDaysBarGraphProps {
  data: Array<{ day: DayOfWeek; averageAvailability: number }>;
}

const dayOrder: DayOfWeek[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const BestDaysBarGraph: React.FC<BestDaysBarGraphProps> = ({ data }) => {
  // Ensure days are in correct order
  const orderedData = dayOrder.map(day => data.find(d => d.day === day) || { day, averageAvailability: 0 });

  const chartData = {
    labels: orderedData.map(d => d.day),
    datasets: [
      {
        label: 'Availability %',
        data: orderedData.map(d => d.averageAvailability),
        backgroundColor: '#98c1d9', // primary color
        borderRadius: 6,
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
      x: { title: { display: false }, grid: { display: false } },
      y: { title: { display: true, text: 'Average Availability' }, beginAtZero: true, max: 100 },
    },
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Best Days for TKTS</h3>
      <Bar data={chartData} options={options} height={160} />
    </div>
  );
};

export default BestDaysBarGraph;
