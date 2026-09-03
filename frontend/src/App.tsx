import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ScrollToTop } from './components/ScrollToTop';
import { SessionProvider } from './contexts/SessionProvider';
import { ThemeProvider } from './contexts/ThemeProvider';
import CollectionPage from './pages/CollectionPage';
import CollectionsIndexPage from './pages/CollectionsIndexPage';
import LandingPage from './pages/LandingPage';
import PiecePage from './pages/PiecePage';
import WaivedPage from './pages/WaivedPage';

function App() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<LandingPage />} />
            <Route path="/piece/:id" element={<PiecePage />} />
            <Route path="/collections" element={<CollectionsIndexPage />} />
            <Route path="/collections/:slug" element={<CollectionPage />} />
            <Route path="/waived" element={<WaivedPage />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </BrowserRouter>
      </SessionProvider>
    </ThemeProvider>
  );
}

export default App;
