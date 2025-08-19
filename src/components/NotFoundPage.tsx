import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center px-6">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-3xl p-12 border border-secondary-200 shadow-lg">
          
          <h1 className="text-6xl font-bold text-secondary-900 mb-4">404</h1>
          <h2 className="text-3xl font-bold text-secondary-900 mb-6">Page Not Found</h2>
          
          <p className="text-xl text-secondary-700 mb-8 leading-relaxed">
            I've a feeling we're not in Kansas anymore.
          </p>
          
          {/* <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/" 
              className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2"
            >
              <Home className="w-5 h-5" />
              <span>Go Home</span>
            </Link>
            
            <Link 
              to="/tkts" 
              className="bg-warning-500 hover:bg-warning-600 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2"
            >
              <Search className="w-5 h-5" />
              <span>Browse Shows</span>
            </Link>
          </div> */}
          
          <div className="mt-8 pt-6 border-t border-secondary-200">
            <p className="text-secondary-600 text-sm">
              Need help? Try going back to the{' '}
              <Link to="/" className="text-primary-500 hover:text-primary-600 font-medium">
                homepage
              </Link>{' '}
              or browsing{' '}
              <Link to="/tkts" className="text-primary-500 hover:text-primary-600 font-medium">
                TKTS analytics
              </Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
