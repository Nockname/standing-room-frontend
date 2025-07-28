const LoadingSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Skeleton */}
        <div className="mb-8 space-y-6">
          {/* Quick Insights */}
          <div className="bg-warning-600 text-white rounded-xl p-6 animate-pulse">
            <div className="grid grid-cols-3 gap-2 md:gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center">
                  <div className="w-16 h-8 bg-warning-700 rounded mx-auto mb-2"></div>
                  <div className="w-20 h-4 bg-warning-700 rounded mx-auto opacity-70"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Shows - Hidden on small screens */}
          <div className="hidden lg:block card relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 bg-neutral-300 rounded animate-pulse"></div>
              <div className="w-64 h-5 bg-neutral-300 rounded animate-pulse"></div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Broadway Shows */}
              <div>
                <div className="w-20 h-5 bg-neutral-300 rounded animate-pulse mx-auto mb-3"></div>
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-300 last:border-b-0">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-neutral-300 rounded-full animate-pulse"></div>
                        <div>
                          <div className="w-32 h-4 bg-neutral-300 rounded animate-pulse mb-1"></div>
                          <div className="w-24 h-3 bg-neutral-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="w-8 h-4 bg-neutral-300 rounded animate-pulse mb-1"></div>
                        <div className="w-16 h-3 bg-neutral-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Divider */}
              <div className="hidden lg:block absolute left-1/2 top-16 bottom-6 w-px bg-neutral-300 transform -translate-x-1/2"></div>

              {/* Off-Broadway Shows */}
              <div className="pt-6 lg:pt-0 border-t lg:border-t-0 border-neutral-300">
                <div className="w-24 h-5 bg-neutral-300 rounded animate-pulse mx-auto mb-3"></div>
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-300 last:border-b-0">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-neutral-300 rounded-full animate-pulse"></div>
                        <div>
                          <div className="w-28 h-4 bg-neutral-300 rounded animate-pulse mb-1"></div>
                          <div className="w-20 h-3 bg-neutral-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="w-8 h-4 bg-neutral-300 rounded animate-pulse mb-1"></div>
                        <div className="w-16 h-3 bg-neutral-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Best Days and Trends - Hidden on small screens */}
          <div className="hidden lg:grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Best Days Graph */}
            <div className="card">
              <div className="w-32 h-5 bg-neutral-300 rounded animate-pulse mb-4"></div>
              <div className="h-40 bg-neutral-200 rounded animate-pulse"></div>
            </div>
            
            {/* Recent Trends */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <div className="w-32 h-5 bg-neutral-300 rounded animate-pulse"></div>
                <div className="w-32 h-8 bg-neutral-200 rounded animate-pulse"></div>
              </div>
              <div className="h-40 bg-neutral-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <div className="w-full h-12 bg-neutral-200 rounded-lg animate-pulse"></div>
            </div>

            {/* Filter Toggle Button - Desktop only */}
            <div className="hidden lg:flex gap-2">
              <div className="w-20 h-12 bg-neutral-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Shows Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="w-48 h-8 bg-neutral-300 rounded animate-pulse mb-1"></div>
              <div className="w-32 h-5 bg-neutral-200 rounded animate-pulse"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24].map((i) => (
              <div key={i} className="card">
                {/* Header */}
                <div className="mb-4">
                  <div className="w-3/4 h-6 bg-neutral-300 rounded animate-pulse mb-2"></div>
                  <div className="w-1/2 h-4 bg-neutral-200 rounded animate-pulse mb-3"></div>
                  <div className="flex gap-2">
                    <div className="w-16 h-5 bg-neutral-300 rounded-full animate-pulse"></div>
                    <div className="w-12 h-5 bg-neutral-200 rounded-full animate-pulse"></div>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-3 mb-4">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-neutral-300 rounded animate-pulse"></div>
                        <div className="w-24 h-4 bg-neutral-200 rounded animate-pulse"></div>
                      </div>
                      <div className="w-16 h-4 bg-neutral-300 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>

                {/* Weekly breakdown */}
                <div className="pt-4 border-t border-neutral-200">
                  <div className="w-32 h-4 bg-neutral-300 rounded animate-pulse mb-3"></div>
                  <div className="grid grid-cols-7 gap-1">
                    {[1, 2, 3, 4, 5, 6, 7].map((k) => (
                      <div key={k} className="text-center">
                        <div className="w-6 h-3 bg-neutral-200 rounded animate-pulse mx-auto mb-1"></div>
                        <div className="w-6 h-6 bg-neutral-300 rounded animate-pulse mx-auto mb-1"></div>
                        <div className="w-8 h-3 bg-neutral-200 rounded animate-pulse mx-auto"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Skeleton */}
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center space-x-1">
              {/* Previous button */}
              <div className="w-10 h-10 bg-neutral-200 rounded-md animate-pulse"></div>
              
              {/* Page numbers */}
              {[1, 2, 3, 4, 5].map((i) => (
                <div 
                  key={i} 
                  className={`w-10 h-10 rounded-md animate-pulse ${
                    i === 2 ? 'bg-primary-500' : 'bg-neutral-200'
                  }`}
                ></div>
              ))}
              
              {/* Next button */}
              <div className="w-10 h-10 bg-neutral-200 rounded-md animate-pulse"></div>
            </nav>
          </div>
        </div>

        {/* Mobile Filter FAB */}
        <div className="fixed bottom-6 right-6 lg:hidden">
          <div className="w-14 h-14 bg-primary-500 rounded-full shadow-lg animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
