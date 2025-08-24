import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Settings, CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { getUserPreferences, updateSubscriptionPreferences, checkAuthStatus } from '../lib/supabase';

interface Preferences {
  broadway: boolean;
  offBroadway: boolean;
  offOffBroadway: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
}

function PreferencesPage() {
  const [preferences, setPreferences] = useState<Preferences>({
    broadway: true,
    offBroadway: false,
    offOffBroadway: false,
    frequency: 'immediate'
  });
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const verified = searchParams.get('verified');
    if (verified === 'true') {
      setMessage('Email verified successfully! Your subscription is now active.');
    }
    
    loadUserData();
  }, [searchParams]);

  const loadUserData = async () => {
    setLoading(true);
    
    const authStatus = await checkAuthStatus();
    setIsAuthenticated(authStatus.isAuthenticated && authStatus.isVerified);
    
    if (authStatus.isAuthenticated && authStatus.isVerified) {
      const result = await getUserPreferences();
      if (result.success && result.preferences) {
        setPreferences(result.preferences);
        setEmail(result.email || '');
      }
    }
    
    setLoading(false);
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    setError('');
    setMessage('');

    const result = await updateSubscriptionPreferences(preferences);
    
    if (result.success) {
      setMessage('Preferences saved successfully!');
    } else {
      setError(result.message);
    }
    
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] bg-secondary-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-[calc(100vh-4rem)] bg-secondary-50 flex items-center justify-center px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-3xl p-12 border border-secondary-200 shadow-lg">
            <div className="bg-warning-500 w-20 h-20 rounded-full flex items-center justify-center mb-8 mx-auto">
              <Mail className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-secondary-900 mb-6">Access Your Preferences</h1>
            <p className="text-xl text-secondary-700 mb-8 leading-relaxed">
              You need to be signed in to manage your notification preferences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/tdf" 
                className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105"
              >
                Subscribe to Notifications
              </Link>
              <Link 
                to="/" 
                className="bg-secondary-200 hover:bg-secondary-300 text-secondary-800 px-8 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="bg-primary-500 w-20 h-20 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-lg">
              <Settings className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-4">
              Notification Preferences
            </h1>
            <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
              Manage your subscription settings and choose what notifications you'd like to receive.
            </p>
            <p className="text-sm text-secondary-500 mt-2">
              Subscribed as: <span className="font-medium">{email}</span>
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl p-8 border border-secondary-200 shadow-lg">
              
              {/* Messages */}
              {message && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center space-x-3 mb-6">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <p className="text-green-700 text-sm">{message}</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center space-x-3 mb-6">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Notification Types */}
              <div className="space-y-6 mb-8">
                <h3 className="text-xl font-bold text-secondary-900 mb-4">Notification Types</h3>
                
                <div className="space-y-4">
                  <label className="flex items-center space-x-4 p-4 bg-secondary-50 rounded-2xl cursor-pointer hover:bg-secondary-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={preferences.broadway}
                      onChange={(e) => setPreferences(prev => ({ ...prev, broadway: e.target.checked }))}
                      className="w-5 h-5 text-primary-500 bg-white border-secondary-300 rounded focus:ring-primary-500 focus:ring-2"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-secondary-900">Broadway Shows</div>
                      <div className="text-sm text-secondary-600">Get notifications when new Broadway shows appear on TDF</div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-4 p-4 bg-secondary-50 rounded-2xl cursor-pointer hover:bg-secondary-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={preferences.offBroadway}
                      onChange={(e) => setPreferences(prev => ({ ...prev, offBroadway: e.target.checked }))}
                      className="w-5 h-5 text-primary-500 bg-white border-secondary-300 rounded focus:ring-primary-500 focus:ring-2"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-secondary-900">Off-Broadway Shows</div>
                      <div className="text-sm text-secondary-600">Get notifications when new Off-Broadway shows appear on TDF</div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-4 p-4 bg-secondary-50 rounded-2xl cursor-pointer hover:bg-secondary-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={preferences.offOffBroadway}
                      onChange={(e) => setPreferences(prev => ({ ...prev, offOffBroadway: e.target.checked }))}
                      className="w-5 h-5 text-primary-500 bg-white border-secondary-300 rounded focus:ring-primary-500 focus:ring-2"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-secondary-900">Off-Off-Broadway Shows</div>
                      <div className="text-sm text-secondary-600">Get notifications when new Off-Off-Broadway shows appear on TDF</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Frequency */}
              {/* <div className="mb-8">
                <h3 className="text-xl font-bold text-secondary-900 mb-4">Notification Frequency</h3>
                <div className="space-y-2">
                  {[
                    { value: 'immediate', label: 'Immediate', desc: 'Get notified as soon as new deals are available' },
                    { value: 'daily', label: 'Daily Digest', desc: 'Receive a daily summary of new deals' },
                    { value: 'weekly', label: 'Weekly Summary', desc: 'Get a weekly roundup of all deals' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center space-x-4 p-3 bg-secondary-50 rounded-xl cursor-pointer hover:bg-secondary-100 transition-colors">
                      <input
                        type="radio"
                        name="frequency"
                        value={option.value}
                        checked={preferences.frequency === option.value}
                        onChange={(e) => setPreferences(prev => ({ ...prev, frequency: e.target.value as any }))}
                        className="w-4 h-4 text-primary-500 bg-white border-secondary-300 focus:ring-primary-500 focus:ring-2"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-secondary-900">{option.label}</div>
                        <div className="text-sm text-secondary-600">{option.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div> */}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleSavePreferences}
                  disabled={saving}
                  className="flex-1 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-400 disabled:opacity-50 text-white py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center space-x-2"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Save Preferences</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-6 text-center">
                <Link 
                  to="/" 
                  className="text-secondary-600 hover:text-secondary-800 transition-colors"
                >
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PreferencesPage;
