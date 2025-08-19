import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import TKTSPage from './components/TKTSPage';
import TDFPage from './components/TDFPage';
import PreferencesPage from './components/PreferencesPage';
import ShowDetailNew from './components/ShowDetailNew';
import NotFoundPage from './components/NotFoundPage';

// Component to scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-secondary-50">
        <Header />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/tkts" element={<TKTSPage />} />
          <Route path="/tdf" element={<TDFPage />} />
          <Route path="/tdf/preferences" element={<PreferencesPage />} />
          <Route path="/show/:showId" element={<ShowDetailNew />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
