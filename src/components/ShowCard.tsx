import { useNavigate } from 'react-router-dom';
import { Show, DayOfWeek } from '../types';
import { DollarSign, Percent, Clock, TrendingUp, HelpCircle } from 'lucide-react';

interface ShowCardProps {
  show: Show;
  selectedDay?: DayOfWeek;
  showTime?: 'all' | 'matinee' | 'evening';
  isFilterLoading?: boolean;
}

const ShowCard: React.FC<ShowCardProps> = ({ show, selectedDay, showTime, isFilterLoading = false }) => {
  const navigate = useNavigate();
  
  const handleCardClick = () => {
    navigate(`/show/${show.id}`);
  };
  
  const getDayData = (day?: DayOfWeek) => {
    if (!day || !show.days_available) return null;
    return show.days_available.find(d => d.day_of_week === day);
  };

  const dayData = getDayData(selectedDay);
  const displayPriceRange = dayData?.average_price_range || show.average_price_range;
  const displayDiscount = dayData?.average_discount || show.average_discount;
  const displayAvailability = selectedDay && dayData 
    ? dayData.availability_percentage 
    : show.availability_frequency * 100;

  // Generate dynamic labels based on current filters
  const getAvailabilityLabel = () => {
    const showTimeLabel = showTime === 'matinee' ? 'Matinee' : showTime === 'evening' ? 'Evening' : '';
    const dayLabel = selectedDay ? `${selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}` : '';
    
    if (selectedDay && showTime && showTime !== 'all') {
      return `${dayLabel} ${showTimeLabel} Availability`;
    } else if (selectedDay) {
      return `${dayLabel} Availability`;
    } else if (showTime && showTime !== 'all') {
      return `${showTimeLabel} Availability`;
    } else {
      return 'Overall Availability';
    }
  };

  const getPriceLabel = () => {
    const showTimeLabel = showTime === 'matinee' ? 'Matinee' : showTime === 'evening' ? 'Evening' : '';
    const dayLabel = selectedDay ? selectedDay : '';
    
    if (selectedDay && showTime && showTime !== 'all') {
      return `Average ${dayLabel} ${showTimeLabel} Price`;
    } else if (selectedDay) {
      return `Average ${dayLabel} Price`;
    } else if (showTime && showTime !== 'all') {
      return `Average ${showTimeLabel} Price`;
    } else {
      return 'Average Price';
    }
  };

  const getDiscountLabel = () => {
    const showTimeLabel = showTime === 'matinee' ? 'Matinee' : showTime === 'evening' ? 'Evening' : '';
    const dayLabel = selectedDay ? selectedDay : '';
    
    if (selectedDay && showTime && showTime !== 'all') {
      return `Average ${dayLabel} ${showTimeLabel} Discount`;
    } else if (selectedDay) {
      return `Average ${dayLabel} Discount`;
    } else if (showTime && showTime !== 'all') {
      return `Average ${showTimeLabel} Discount`;
    } else {
      return 'Average Discount';
    }
  };

  // Generate tooltip explanation based on current filters
  const getAvailabilityTooltip = () => {
    const showTimeLabel = showTime === 'matinee' ? 'matinee' : showTime === 'evening' ? 'evening' : '';
    const dayLabel = selectedDay ? selectedDay : 'day';

    return `The percentage of ${dayLabel}s in the last four months when ${showTimeLabel} TKTS tickets were available for ${show.title}.`;
  };

  const getAvailabilityColor = (percentage: number) => {
    if (percentage >= 80) return 'text-warning-900 bg-warning-500 border-warning-700';
    if (percentage >= 60) return 'text-warning-900 bg-warning-400 border-warning-600';
    if (percentage >= 40) return 'text-warning-900 bg-warning-300 border-warning-500';
    return 'text-error-900 bg-error-200 border-error-400';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    
    // Handle both timestamp format (overall last seen) and date format (day-specific performance date)
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Unknown';
    
    return date.toLocaleDateString();
  };

  return (
    <div 
      className="card hover:shadow-lg transition-all duration-200 relative cursor-pointer hover:scale-[1.02]"
      onClick={handleCardClick}
    >
      {/* Loading overlay for filter changes */}
      {isFilterLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-xl">
          <div className="flex items-center space-x-2 text-neutral-600">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent"></div>
            <span className="text-sm">Updating...</span>
          </div>
        </div>
      )}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-neutral-900 mb-1">{show.title}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {show.category && (
              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                show.category === 'Broadway' 
                  ? 'bg-secondary-500 text-white' 
                  : 'bg-primary-500 text-white'
              }`}>
                {show.category}
              </span>
            )}
            {show.theater && (
              <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-neutral-100 text-neutral-700">
                {show.theater}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* Availability */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-neutral-700" />
            <span className="text-sm text-neutral-600">
              {getAvailabilityLabel()}
            </span>
            {/* Tooltip */}
            <div className="relative group">
              <HelpCircle className="h-3 w-3 text-neutral-400 hover:text-neutral-600 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-neutral-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-64">
                {getAvailabilityTooltip()}
                {/* Arrow */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-neutral-900"></div>
              </div>
            </div>
          </div>
          <span className={`px-2 py-1 text-sm font-semibold rounded-full border ${getAvailabilityColor(displayAvailability)}`}>
            {displayAvailability.toFixed(1)}%
          </span>
        </div>

        {/* Price Range */}
        {displayPriceRange && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-neutral-700" />
              <span className="text-sm text-neutral-600">
                {getPriceLabel()}
              </span>
            </div>
            <span className="text-sm font-semibold text-neutral-900">
              ${displayPriceRange[0]} - ${displayPriceRange[1]}
            </span>
          </div>
        )}

        {/* Discount */}
        {displayDiscount && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-neutral-700" />
              <span className="text-sm text-neutral-600">
                {getDiscountLabel()}
              </span>
            </div>
            <span className="text-sm font-semibold text-warning-600">
              {displayDiscount.toFixed(1)}%
            </span>
          </div>
        )}

        {/* Last Seen - only show when not filtering by specific day */}
        {!selectedDay && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-neutral-700" />
              <span className="text-sm text-neutral-600">Last Seen</span>
            </div>
            <span className="text-sm text-neutral-900">
              {formatDate(show.last_seen)}
            </span>
          </div>
        )}
      </div>

      {/* Weekly breakdown preview (only show if no specific day selected) */}
      {!selectedDay && show.days_available && show.days_available.length > 0 && (
        <div className="mt-4 pt-4 border-t border-neutral-500">
          <h4 className="text-sm font-medium text-neutral-800 mb-2">Weekly Breakdown</h4>
          <div className="grid grid-cols-7 gap-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayLabel, index) => {
              const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
              const dayName = dayNames[index];
              const dayInfo = show.days_available?.find(d => d.day_of_week === dayName);
              const percentage = dayInfo?.availability_percentage || 0;
              const colorClasses = getAvailabilityColor(percentage);
              
              return (
                <div key={dayLabel} className="text-center">
                  <div className="text-xs text-neutral-600 mb-1">{dayLabel}</div>
                  <div
                    className={`h-3 rounded-full ${colorClasses.split(' ')[1]} border ${colorClasses.split(' ')[2]} mx-auto`}
                    style={{ width: `${Math.min(Math.max(percentage * 0.6, 8), 40)}px` }}
                    title={`${percentage.toFixed(1)}%`}
                  ></div>
                  <div className="text-xs text-neutral-700 mt-1">
                    {percentage.toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowCard;
