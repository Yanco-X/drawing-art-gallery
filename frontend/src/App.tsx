import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ScrollToTop } from './components/ScrollToTop';
import { SessionProvider } from './contexts/SessionProvider';
import { SocialsProvider } from './contexts/SocialsProvider';
import { ThemeProvider } from './contexts/ThemeProvider';
import { claimTabVisit } from './lib/visitorId';
import CollectionPage from './pages/CollectionPage';
import CollectionsIndexPage from './pages/CollectionsIndexPage';
import LandingPage from './pages/LandingPage';
import MetricsPage from './pages/MetricsPage';
import PiecePage from './pages/PiecePage';
import WaivedPage from './pages/WaivedPage';
import { recordEvent } from './services';

function App() {
  useEffect(() => {
    if (claimTabVisit()) recordEvent({ kind: 'visit' });
  }, []);

  return (
    <ThemeProvider>
      <SessionProvider>
        <SocialsProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<LandingPage />} />
              <Route path="/piece/:id" element={<PiecePage />} />
              <Route path="/collections" element={<CollectionsIndexPage />} />
              <Route path="/collections/:slug" element={<CollectionPage />} />
              <Route path="/waived" element={<WaivedPage />} />
              <Route path="/metrics" element={<MetricsPage />} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </BrowserRouter>
        </SocialsProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}

export default App;
