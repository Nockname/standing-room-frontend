import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { DayOfWeek } from '../types';
import { getBestDaysData } from '../lib/supabase';
import { primary } from '../lib/colors';
import StandardDropdown from './StandardDropdown';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface BestDaysBarGraphProps {}

type ShowTimeFilter = 'all' | 'matinee' | 'evening';

const dayOrder: DayOfWeek[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const showTimeOptions = [
  { value: 'all' as ShowTimeFilter, label: 'All Performances' },
  { value: 'matinee' as ShowTimeFilter, label: 'Matinee Performances' },
  { value: 'evening' as ShowTimeFilter, label: 'Evening Performances' },
];

const BestDaysBarGraph: React.FC<BestDaysBarGraphProps> = () => {
  const [showTimeFilter, setShowTimeFilter] = useState<ShowTimeFilter>('all');
  const [bestDaysData, setBestDaysData] = useState<Array<{ day: string; averageNumberOfDiscounts: number }>>([]);
  const [loading, setLoading] = useState(false);

  // Fetch data when filter changes
  useEffect(() => {
    const loadBestDaysData = async () => {
      setLoading(true);
      try {
        const data = await getBestDaysData(showTimeFilter);
        setBestDaysData(data);
      } catch (error) {
        console.error('Error loading best days data:', error);
        setBestDaysData([]);
      } finally {
        setLoading(false);
      }
    };

    loadBestDaysData();
  }, [showTimeFilter]);

  // Ensure days are in correct order
  const orderedData = dayOrder.map(day => 
    bestDaysData.find(d => d.day === day) || { day, averageNumberOfDiscounts: 0 }
  );

  const chartData = {
    labels: orderedData.map(d => d.day),
    datasets: [
      {
        label: 'Avg Discounts',
        data: orderedData.map(d => d.averageNumberOfDiscounts),
        backgroundColor: primary[500], // primary-500 color from centralized colors
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
      y: { title: { display: true, text: 'Average Number of Discounts' }, beginAtZero: true },
    },
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-neutral-900">Best Days for TKTS</h3>
        
        <StandardDropdown
          options={showTimeOptions}
          value={showTimeFilter}
          onChange={(value) => setShowTimeFilter(value as ShowTimeFilter)}
        />
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="text-neutral-600">Loading chart data...</div>
        </div>
      ) : (
        <Bar data={chartData} options={options} height={160} />
      )}
    </div>
  );
};

export default BestDaysBarGraph;
