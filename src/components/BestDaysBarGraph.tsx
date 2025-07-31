import { useState, useEffect, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { ChevronDown } from 'lucide-react';
import { DayOfWeek } from '../types';
import { fetchBestDaysData } from '../lib/supabase';

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [bestDaysData, setBestDaysData] = useState<Array<{ day: string; averageNumberOfDiscounts: number }>>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get primary-500 color from CSS
  const getPrimaryColor = () => {
    if (typeof window !== 'undefined') {
      const tempEl = document.createElement('div');
      tempEl.className = 'bg-primary-500';
      document.body.appendChild(tempEl);
      const color = window.getComputedStyle(tempEl).backgroundColor;
      document.body.removeChild(tempEl);
      return color;
    }
    return 'rgb(152, 193, 217)'; // fallback to primary-500 RGB
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch data when filter changes
  useEffect(() => {
    const loadBestDaysData = async () => {
      setLoading(true);
      try {
        const data = await fetchBestDaysData(showTimeFilter);
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
        backgroundColor: getPrimaryColor(), // primary-500 color from Tailwind
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

  const selectedOption = showTimeOptions.find(option => option.value === showTimeFilter);

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-neutral-900">Best Days for TKTS</h3>
        
        {/* Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <span>{selectedOption?.label}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 z-10 bg-white border border-neutral-300 rounded-lg shadow-lg min-w-[140px]">
              {showTimeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setShowTimeFilter(option.value);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 first:rounded-t-lg last:rounded-b-lg ${
                    showTimeFilter === option.value ? 'bg-primary-50 text-primary-700' : 'text-neutral-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
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
