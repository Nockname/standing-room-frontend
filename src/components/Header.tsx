import { Theater } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-neutral-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Theater className="h-8 w-8 text-warning-600" />
              <div className="ml-3">
                <h1 className="text-xl font-bold text-neutral-900">TKTS Analytics</h1>
                {/* <p className="text-sm text-neutral-600">Broadway Show Availability Tracker</p> */}
              </div>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <span className="text-sm text-neutral-600">
                Real-Time TKTS Analytics
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
