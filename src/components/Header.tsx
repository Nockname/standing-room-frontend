import { Link, useLocation } from 'react-router-dom';
import { Theater } from 'lucide-react';

const Header: React.FC = () => {
  const location = useLocation();

  return (
    <header className="bg-white shadow-sm border-b border-neutral-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center hover:opacity-80 transition-opacity">
              <Theater className="h-8 w-8 text-warning-600" />
              <div className="ml-3">
                <h1 className="text-xl font-bold text-neutral-900">Standing Room</h1>
              </div>
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-6">
              <Link 
                to="/tkts" 
                className={`text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/tkts') || location.pathname.startsWith('/show')
                    ? 'text-warning-400' 
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                TKTS Analytics
              </Link>
              <Link 
                to="/tdf" 
                className={`text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/tdf')
                    ? 'text-secondary-400' 
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                TDF Notifications
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
