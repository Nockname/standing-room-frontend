import { FilterOptions, DayOfWeek } from '../types';

interface FilterPanelProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onFiltersChange }) => {
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

  return (
    <div className="card">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Day of Week Filter */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Day of Week
          </label>
          <select
            value={filters.dayOfWeek}
            onChange={(e) => onFiltersChange({ ...filters, dayOfWeek: e.target.value as DayOfWeek | 'all' })}
            className="w-full border border-neutral-500 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent font-display text-sm"
          >
            {daysOfWeek.map(day => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
        </div>

        {/* Show Time Filter */}
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
            className="w-full border border-neutral-500 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent font-display text-sm"
          >
            <option value="all">All Times</option>
            <option value="matinee">Matinees</option>
            <option value="evening">Evening</option>
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Sort By
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => onFiltersChange({ ...filters, sortBy: e.target.value as FilterOptions['sortBy'] })}
            className="w-full border border-neutral-500 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent font-display text-sm"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Order
          </label>
          <select
            value={filters.sortOrder}
            onChange={(e) => onFiltersChange({ ...filters, sortOrder: e.target.value as 'asc' | 'desc' })}
            className="w-full border border-neutral-500 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent font-display text-sm"
          >
            <option value="desc">High to Low</option>
            <option value="asc">Low to High</option>
          </select>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Show Type Filters */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Show Types
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.showBroadway !== false}
                onChange={(e) => onFiltersChange({ 
                  ...filters, 
                  showBroadway: e.target.checked 
                })}
                className="mr-2 rounded border-neutral-500 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-neutral-700">Broadway Shows</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.showOffBroadway !== false}
                onChange={(e) => onFiltersChange({ 
                  ...filters, 
                  showOffBroadway: e.target.checked 
                })}
                className="mr-2 rounded border-neutral-500 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-neutral-700">Off-Broadway Shows</span>
            </label>
          </div>
        </div>

        {/* Clear Filters */}
        <div className="flex items-end">
          <button
            onClick={() => onFiltersChange({
              dayOfWeek: 'all',
              sortBy: 'frequency',
              sortOrder: 'desc',
              searchQuery: '',
              showTime: 'all',
              showBroadway: true,
              showOffBroadway: true,
            })}
            className="btn-secondary w-full"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
