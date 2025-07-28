import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './components/HomePage';
import ShowDetail from './components/ShowDetail';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-secondary-50">
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/show/:showId" element={<ShowDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
