import { Link } from 'react-router-dom';
import { Ticket, Bell, TrendingUp, DollarSign, Clock, Star } from 'lucide-react';
import { preload } from '../lib/supabase';

function LandingPage() {

  preload();

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="relative px-6 pt-20 pb-16 text-center">
          <div className="max-w-4xl mx-auto">
            {/* Main Headline */}
            <h1 className="text-6xl md:text-7xl font-bold text-secondary-900 mb-6 leading-tight">
              <span className="block text-warning-500">
                Standing Room
              </span>
              {/* Your go-to place for all things TDF */}
            </h1>
            <h1 className="text-4xl md:text-4xl font-bold text-secondary-700 mb-6 leading-tight">
              Your go-to place for all things TDF
            </h1>
            
            {/* Description */}
            <p className="text-xl md:text-2xl text-secondary-600 mb-12 leading-relaxed max-w-4xl mx-auto font-medium">
              Find in-depth analytics on TKTS discounts and receive instant notifications when new shows are available through the TDF Membership.
            </p>

            <br></br>
            

            <div className="h-8" />
            {/* Feature Cards */}
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
              {/* TKTS Card */}
              <Link 
                to="/tkts" 
                className="group relative bg-white rounded-3xl p-8 border border-secondary-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-warning-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="bg-warning-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                    <Ticket className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-secondary-900 mb-4">TKTS Discounts</h3>
                  <p className="text-secondary-700 text-lg mb-6 leading-relaxed">
                    Analyze when shows are discounted, find average discount prices and percentages,
                    and discover when tickets usually sellout.
                  </p>
                  <div className="flex items-center justify-center space-x-4 text-sm text-secondary-600">
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>Analytics</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4" />
                      <span>Live Discounts</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>Timing Insights</span>
                    </div>
                  </div>
                </div>
              </Link>
              
              {/* TDF Card */}
              <Link 
                to="/tdf" 
                className="group relative bg-white rounded-3xl p-8 border border-secondary-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-secondary-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="bg-secondary-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                    <Bell className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-secondary-900 mb-4">TDF Notifications</h3>
                  <p className="text-secondary-700 text-lg mb-6 leading-relaxed">
                    Get instant notifications when shows are available through TDF Membership. Never miss a deal again.
                  </p>
                  <div className="flex items-center justify-center space-x-4 text-sm text-secondary-600">
                    <div className="flex items-center space-x-1">
                      <Bell className="w-4 h-4" />
                      <span>Instant Alerts</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4" />
                      <span>All Venues</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>Early Access</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Educational Sections */}
      <div className="relative bg-white border-t border-secondary-200">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-6">Understanding the Theatre Development Fund</h2>
            <p className="text-xl text-secondary-700 max-w-3xl mx-auto">
              Learn about the programs that make Broadway more accessible
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-20">
            {/* What is TKTS */}
            <div className="bg-white rounded-3xl p-8 border border-secondary-200 shadow-lg">
              <h3 className="text-2xl font-bold text-primary-600 mb-4">What is TKTS?</h3>
              <p className="text-secondary-700 text-lg leading-relaxed mb-4">
                TKTS is the famous red steps booth in Times Square that sells discounted same-day Broadway and Off-Broadway tickets.
              </p>
              <ul className="text-secondary-600 text-sm space-y-2">
                <li>• Same-day discounts up to 50% off</li>
                <li>• Located in Times Square & Brooklyn</li>
                <li>• Cash, credit cards, and digital payments accepted</li>
                <li>• Shows availability updates throughout the day</li>
              </ul>
            </div>
            
            {/* What is the TDF Membership */}
            <div className="bg-white rounded-3xl p-8 border border-secondary-200 shadow-lg">
              <h3 className="text-2xl font-bold text-primary-600 mb-4">What is the TDF Membership?</h3>
              <p className="text-secondary-700 text-lg leading-relaxed mb-4">
                TDF Membership provides exclusive access to heavily discounted tickets for theater, dance, and music performances.
              </p>
              <ul className="text-secondary-600 text-sm space-y-2">
                <li>• All tickets under $60</li>
                <li>• Access to shows not available at TKTS</li>
                <li>• Advance notice of discount opportunities</li>
                <li>• Annual $42 membership fee required</li>
              </ul>
            </div>
          </div>
          
          {/* Additional Info Section */}
          <div className="mt-16 bg-white rounded-3xl p-8 border border-secondary-200 shadow-lg">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-accent-700 mb-4">How Standing Room Helps</h3>
              <p className="text-secondary-700 text-lg leading-relaxed max-w-4xl mx-auto">
                Standing Room tracks TKTS discount patterns and timing to help you plan your theater visits more effectively. 
                We also monitor TDF membership deals and send instant notifications when new opportunities become available, 
                ensuring you never miss out on the best Broadway discounts.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom CTA */}
      <div className="relative bg-white border-t border-secondary-200">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold text-secondary-900 mb-4">Ready to Save on Broadway?</h2>
          <p className="text-secondary-700 text-lg mb-8">
            Join thousands of theater lovers who are already saving money and staying informed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/tkts" 
              className="bg-warning-500 hover:bg-warning-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              TKTS Discounts
            </Link>
            <Link 
              to="/tdf" 
              className="bg-secondary-500 hover:bg-secondary-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              Theater Notifications
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
