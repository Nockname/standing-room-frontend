import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Bell, Mail, CheckCircle, AlertCircle, LogOut } from 'lucide-react';
import { subscribeToNotifications, checkAuthStatus, signOut } from '../lib/supabase';

function TDFPage() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Check if user was redirected after email verification
  useEffect(() => {
    const verified = searchParams.get('verified');
    if (verified === 'true') {
      setSubscribed(true);
      setNeedsVerification(false);
    }
  }, [searchParams]);

  // Check if user is already authenticated on component mount
  useEffect(() => {
    checkAuthStatus().then(({ isAuthenticated, isVerified }) => {
      if (isAuthenticated && isVerified) {
        setSubscribed(true);
        setNeedsVerification(false);
      }
      setCheckingAuth(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');

    // Subscribe with Broadway notifications enabled by default
    const result = await subscribeToNotifications(email, { broadway: true, offBroadway: false, offOffBroadway: false, frequency: 'immediate' });

    if (result.success) {
      setSubscribed(true);
      setNeedsVerification(result.needsVerification || false);
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    setError('');

    const result = await signOut();
    
    if (result.success) {
      setSubscribed(false);
      setNeedsVerification(false);
      setEmail('');
      navigate('/');
    } else {
      setError(result.message);
    }

    setLoggingOut(false);
  };

  // Show loading screen while checking authentication
  if (checkingAuth) {
    return (
      <div className="h-[calc(100vh-4rem)] bg-secondary-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (subscribed) {
    return (
      <div className="h-[calc(100vh-4rem)] bg-secondary-50 flex items-center justify-center px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-3xl p-12 border border-secondary-200 shadow-lg">
            <div className="bg-accent-700 w-20 h-20 rounded-full flex items-center justify-center mb-8 mx-auto">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-secondary-900 mb-6">
              {needsVerification ? "Check Your Email!" : "You're Logged In!"}
            </h1>
            <p className="text-xl text-secondary-700 mb-8 leading-relaxed">
              {needsVerification 
                ? "We've sent you an email. Please click the link in the email to confirm your identity."
                : "We'll send you emails about TDF discounts."
              }
            </p>
            <p className="text-secondary-600 mb-8">
              {needsVerification 
                ? "Once verified, you'll be able to manage your notification preferences and choose which types of theater deals you want to receive."
                : "You can manage your notification preferences anytime."
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!needsVerification && (
                <Link 
                  to="/tdf/preferences" 
                  className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105"
                >
                  Manage Preferences
                </Link>
              )}
              <Link 
                to="/tkts" 
                className="bg-warning-500 hover:bg-warning-600 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105"
              >
                Browse TKTS Discounts
              </Link>
              <Link 
                to="/" 
                className="bg-secondary-200 hover:bg-secondary-300 text-secondary-800 px-8 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105"
              >
                Back to Home
              </Link>
            </div>
            
            {/* Logout button */}
            {needsVerification ||
              <div className="mt-6 pt-6 border-t border-secondary-200">
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center justify-center space-x-2 text-secondary-600 hover:text-secondary-800 transition-colors disabled:opacity-50"
                >
                  {loggingOut ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-secondary-600"></div>
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  <span className="text-sm">{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-5rem)] bg-secondary-50">
      <div className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="bg-primary-500 w-24 h-24 rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-lg">
              <Bell className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-secondary-900 mb-6 leading-tight">
              Never Miss a
              <span className="block text-warning-500">
                TDF Deal
              </span>
            </h1>
            <p className="text-xl text-secondary-700 max-w-3xl mx-auto leading-relaxed">
              Get instant notifications when new Broadway, Off-Broadway, or Off-Off-Broadway shows are available on the TDF Membership.
            </p>
          </div>

          {/* Signup Form */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl p-12 border border-secondary-200 shadow-lg">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-secondary-900 mb-4">Join the TDF Notification List</h2>
                <p className="text-secondary-700">
                  Enter your email below to get started. 
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}
                
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full pl-12 pr-4 py-4 bg-secondary-50 border border-secondary-300 rounded-2xl text-secondary-900 placeholder-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-400 disabled:opacity-50 text-white py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <span>Get TDF Notifications</span>
                    </>
                  )}
                </button>
              </form>
              
              <div className="flex items-center justify-center space-x-2 mt-6 text-sm text-secondary-600">
                <span>We respect your privacy. Unsubscribe anytime.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TDFPage;
