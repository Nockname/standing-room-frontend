import { useState, useEffect } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Show, FilterOptions } from '../types';
import { fetchShows } from '../lib/supabase';
import ShowCard from './ShowCard';
import FilterPanel from './FilterPanel';
import MobileFilter from './MobileFilter';
import Dashboard from './Dashboard';
import LoadingSkeleton from './LoadingSkeleton';

function HomePage() {
  const [shows, setShows] = useState<Show[]>([]);
  const [filteredShows, setFilteredShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterOptions>({
    dayOfWeek: 'all',
    sortBy: 'frequency',
    sortOrder: 'desc',
    searchQuery: '',
    showTime: 'all',
    showBroadway: true,
    showOffBroadway: true,
    showTodaysOfferings: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const SHOWS_PER_PAGE = 24;

  useEffect(() => {
    // Set filter loading only if we already have shows (not initial load)
    if (shows.length > 0) {
      setFilterLoading(true);
    }
    loadShows();
  }, [filters.showTime]); // Refetch when show time filter changes

  useEffect(() => {
    applyFilters();
    setCurrentPage(1); // Reset to first page when filters change
  }, [shows, filters]);

  useEffect(() => {
    // Scroll to top of results when page changes
    if (currentPage > 1) {
      const resultsSection = document.querySelector('[data-testid="results-section"]');
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [currentPage]);

  const loadShows = async () => {
    try {
      setLoading(true);
      const data = await fetchShows(filters.showTime);
      setShows(data);
    } catch (error) {
      console.error('Error loading shows:', error);
    } finally {
      setLoading(false);
      setFilterLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...shows];

    // Apply search filter
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(show =>
        show.title.toLowerCase().includes(query) ||
        (show.theater && show.theater.toLowerCase().includes(query))
      );
    }

    // Apply day of week filter
    if (filters.dayOfWeek !== 'all') {
      filtered = filtered.filter(show =>
        show.days_available?.some(day => day.day_of_week === filters.dayOfWeek)
      );
    }

    // Apply show type filters
    if (!filters.showBroadway || !filters.showOffBroadway) {
      filtered = filtered.filter(show => {
        if (!filters.showBroadway && show.category === 'Broadway') return false;
        if (!filters.showOffBroadway && show.category !== 'Broadway') return false;
        return true;
      });
    }

    // Apply today's offerings filter
    if (filters.showTodaysOfferings) {
      filtered = filtered.filter(show => show.availableToday === true);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      // Helper function to get filtered statistics for a show
      const getFilteredStats = (show: Show) => {
        // If filtering by specific day, get stats for that day
        if (filters.dayOfWeek !== 'all') {
          const dayData = show.days_available?.find(day => day.day_of_week === filters.dayOfWeek);
          if (dayData) {
            return {
              availability: dayData.availability_percentage / 100, // Convert to 0-1 scale like availability_frequency
              priceRange: dayData.average_price_range,
              discount: dayData.average_discount
            };
          }
        }
        
        // Fall back to overall show stats
        return {
          availability: show.availability_frequency,
          priceRange: show.average_price_range,
          discount: show.average_discount
        };
      };

      switch (filters.sortBy) {
        case 'frequency':
          const aStats = getFilteredStats(a);
          const bStats = getFilteredStats(b);
          comparison = aStats.availability - bStats.availability;
          break;
        case 'price':
          const aPriceStats = getFilteredStats(a);
          const bPriceStats = getFilteredStats(b);
          const aPrice = aPriceStats.priceRange ? aPriceStats.priceRange[0] : 0;
          const bPrice = bPriceStats.priceRange ? bPriceStats.priceRange[0] : 0;
          comparison = aPrice - bPrice;
          break;
        case 'discount':
          const aDiscountStats = getFilteredStats(a);
          const bDiscountStats = getFilteredStats(b);
          const aDiscount = aDiscountStats.discount || 0;
          const bDiscount = bDiscountStats.discount || 0;
          comparison = aDiscount - bDiscount;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    setFilteredShows(filtered);
  };

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const clearAllFilters = () => {
    setFilters({
      dayOfWeek: 'all',
      sortBy: 'frequency',
      sortOrder: 'desc',
      searchQuery: '',
      showTime: 'all',
      showBroadway: true,
      showOffBroadway: true,
      showTodaysOfferings: false,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard */}
        <Dashboard shows={shows} />

        {/* Search and Filter Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3.5 text-neutral-700 h-5 w-5" />
              <input
                type="text"
                placeholder="Search shows or theaters..."
                value={filters.searchQuery || ''}
                onChange={(e) => handleFiltersChange({ ...filters, searchQuery: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-neutral-400 rounded-lg input-focus text-neutral-900 placeholder-neutral-600 shadow-sm"
              />
            </div>

            {/* Filter Toggle Button - Desktop only */}
            <div className="hidden lg:flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`bg-primary-500 hover:bg-primary-600 text-white font-medium py-2.5 px-5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md items-center`}
              >
                Filters
              </button>
            </div>
          </div>

          {/* Desktop Filter Panel */}
          {showFilters && (
            <div className="hidden lg:block mb-6">
              <FilterPanel 
                filters={filters} 
                onFiltersChange={handleFiltersChange}
              />
            </div>
          )}
        </div>

        {/* Shows Grid */}
        <div data-testid="results-section">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-neutral-900">
              Available Shows 
              <span className="ml-2 text-lg font-normal text-neutral-600">
                ({filteredShows.length} found)
              </span>
            </h2>
          </div>

          {filteredShows.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-neutral-700 text-lg mb-4">
                No shows match your current filters
              </div>
              <button
                onClick={clearAllFilters}
                className="btn-primary"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(() => {
                  const startIndex = (currentPage - 1) * SHOWS_PER_PAGE;
                  const endIndex = startIndex + SHOWS_PER_PAGE;
                  const paginatedShows = filteredShows.slice(startIndex, endIndex);
                  
                  return paginatedShows.map((show) => (
                    <ShowCard 
                      key={show.id} 
                      show={show} 
                      selectedDay={filters.dayOfWeek === 'all' ? undefined : filters.dayOfWeek}
                      showTime={filters.showTime}
                      isFilterLoading={filterLoading}
                    />
                  ));
                })()}
              </div>

              {/* Pagination */}
              {filteredShows.length > SHOWS_PER_PAGE && (
                <div className="mt-8 flex justify-center">
                  <nav className="flex items-center space-x-1">
                    {/* Previous button */}
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentPage === 1
                          ? 'text-neutral-400 cursor-not-allowed'
                          : 'text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    {/* Page numbers */}
                    {(() => {
                      const totalPages = Math.ceil(filteredShows.length / SHOWS_PER_PAGE);
                      const pages = [];
                      
                      // Always show first page
                      if (totalPages > 0) {
                        pages.push(1);
                      }
                      
                      // Show ellipsis and current page area
                      if (currentPage > 3) {
                        pages.push('...');
                      }
                      
                      // Show pages around current page
                      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                        if (!pages.includes(i)) {
                          pages.push(i);
                        }
                      }
                      
                      // Show ellipsis and last page
                      if (currentPage < totalPages - 2) {
                        pages.push('...');
                      }
                      
                      if (totalPages > 1 && !pages.includes(totalPages)) {
                        pages.push(totalPages);
                      }
                      
                      return pages.map((page, index) => (
                        page === '...' ? (
                          <span key={`ellipsis-${index}`} className="px-3 py-2 text-neutral-500">
                            ...
                          </span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page as number)}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-primary-500 text-white'
                                : 'text-neutral-700 hover:bg-neutral-100'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      ));
                    })()}

                    {/* Next button */}
                    <button
                      onClick={() => setCurrentPage(Math.min(Math.ceil(filteredShows.length / SHOWS_PER_PAGE), currentPage + 1))}
                      disabled={currentPage >= Math.ceil(filteredShows.length / SHOWS_PER_PAGE)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentPage >= Math.ceil(filteredShows.length / SHOWS_PER_PAGE)
                          ? 'text-neutral-400 cursor-not-allowed'
                          : 'text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>

        {/* Floating Action Button for Mobile Filters */}
        <button
          onClick={() => setShowMobileFilters(true)}
          className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary-500 hover:bg-primary-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 focus:outline-none focus:ring-4 focus:ring-primary-300"
        >
          <Filter className="h-6 w-6" />
        </button>

        {/* Mobile Filter Modal */}
        <MobileFilter
          isOpen={showMobileFilters}
          onClose={() => setShowMobileFilters(false)}
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />
      </div>
    </div>
  );
}

export default HomePage;
