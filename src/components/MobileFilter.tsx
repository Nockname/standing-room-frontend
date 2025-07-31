import { X } from 'lucide-react';
import { FilterOptions, DayOfWeek } from '../types';

interface MobileFilterProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  isOpen: boolean;
  onClose: () => void;
}

const MobileFilter: React.FC<MobileFilterProps> = ({ 
  filters, 
  onFiltersChange, 
  isOpen, 
  onClose 
}) => {
  const daysOfWeek: Array<{ value: DayOfWeek | 'all'; label: string }> = [
    { value: 'all', label: 'All Days' },
    { value: 'Monday', label: 'Monday' },
    { value: 'Tuesday', label: 'Tuesday' },
    { value: 'Wednesday', label: 'Wednesday' },
    { value: 'Thursday', label: 'Thursday' },
    { value: 'Friday', label: 'Friday' },
    { value: 'Saturday', label: 'Saturday' },
    { value: 'Sunday', label: 'Sunday' },
  ];

  // Generate dynamic sort option labels based on current filters
  const getSortOptions = () => {
    const showTimeLabel = filters.showTime === 'matinee' ? 'Matinee' : filters.showTime === 'evening' ? 'Evening' : '';
    const dayLabel = filters.dayOfWeek !== 'all' ? filters.dayOfWeek : '';
    
    const getContextLabel = (baseLabel: string) => {
      if (dayLabel && showTimeLabel) {
        return `${dayLabel} ${showTimeLabel} ${baseLabel}`;
      } else if (dayLabel) {
        return `${dayLabel} ${baseLabel}`;
      } else if (showTimeLabel) {
        return `${showTimeLabel} ${baseLabel}`;
      } else {
        return baseLabel;
      }
    };

    return [
      { value: 'frequency', label: getContextLabel('Availability') },
      { value: 'price', label: getContextLabel('Price') },
      { value: 'discount', label: getContextLabel('Discount') },
      { value: 'title', label: 'Show Name' },
    ];
  };

  const sortOptions = getSortOptions();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">          <h3 className="text-lg font-semibold text-neutral-900">Filter Shows</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-300 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Day of Week - Mobile optimized as chips */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              Day of Week
            </label>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map(day => (
                <button
                  key={day.value}
                  onClick={() => onFiltersChange({ ...filters, dayOfWeek: day.value })}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                    filters.dayOfWeek === day.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-300 text-neutral-800 hover:bg-neutral-400'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => onFiltersChange({ ...filters, sortBy: e.target.value as FilterOptions['sortBy'] })}
              className="w-full border border-neutral-500 rounded-lg px-3 py-3 text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent font-display"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Order
            </label>
            <select
              value={filters.sortOrder}
              onChange={(e) => onFiltersChange({ ...filters, sortOrder: e.target.value as 'asc' | 'desc' })}
              className="w-full border border-neutral-500 rounded-lg px-3 py-3 text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent font-display"
            >
              <option value="desc">High to Low</option>
              <option value="asc">Low to High</option>
            </select>
          </div>

          {/* Frequency Filter and Show Type Filters */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Show Time
              </label>
              <select
                value={filters.showTime}
                onChange={(e) => onFiltersChange({ 
                  ...filters, 
                  showTime: e.target.value as 'all' | 'matinee' | 'evening'
                })}
                className="w-full border border-neutral-300 rounded-lg px-3 py-3 text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent font-display"
              >
                <option value="all">All Times</option>
                <option value="matinee">Matinees</option>
                <option value="evening">Evening</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                Show Types
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.showBroadway !== false}
                    onChange={(e) => onFiltersChange({ 
                      ...filters, 
                      showBroadway: e.target.checked 
                    })}
                    className="mr-3 rounded border-neutral-500 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-base text-neutral-700">Broadway Shows</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.showOffBroadway !== false}
                    onChange={(e) => onFiltersChange({ 
                      ...filters, 
                      showOffBroadway: e.target.checked 
                    })}
                    className="mr-3 rounded border-neutral-500 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-base text-neutral-700">Off-Broadway Shows</span>
                </label>
              </div>
            </div>

            {/* Today's Offerings */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">Availability</h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="todaysOfferingsMobile"
                    checked={filters.showTodaysOfferings !== true}
                    onChange={() => onFiltersChange({ 
                      ...filters, 
                      showTodaysOfferings: false 
                    })}
                    className="mr-3 border-neutral-500 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-base text-neutral-700">Offerings from the Last 4 Months</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="todaysOfferingsMobile"
                    checked={filters.showTodaysOfferings === true}
                    onChange={() => onFiltersChange({ 
                      ...filters, 
                      showTodaysOfferings: true 
                    })}
                    className="mr-3 border-neutral-500 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-base text-neutral-700">Offerings from Today</span>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => onFiltersChange({
                dayOfWeek: 'all',
                sortBy: 'frequency',
                sortOrder: 'desc',
                searchQuery: '',
                showTime: 'all',
                showBroadway: true,
                showOffBroadway: true,
                showTodaysOfferings: false,
              })}
              className="flex-1 py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileFilter;
