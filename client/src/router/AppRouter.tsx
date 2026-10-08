import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { HomePage } from '../pages/HomePage';
import { TrashPage } from '../pages/TrashPage';

// Scroll to top helper on navigation
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
};

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Populated Drive Workspace Pages inside Noteeye AppShell */}
        <Route
          path="/"
          element={
            <AppShell>
              <HomePage />
            </AppShell>
          }
        />
        <Route
          path="/recents"
          element={
            <AppShell>
              <HomePage />
            </AppShell>
          }
        />
        <Route
          path="/favorites"
          element={
            <AppShell>
              <HomePage />
            </AppShell>
          }
        />
        <Route
          path="/search"
          element={
            <AppShell>
              <HomePage />
            </AppShell>
          }
        />
        <Route
          path="/trash"
          element={
            <AppShell>
              <TrashPage />
            </AppShell>
          }
        />

        {/* Isolated App Shell Wireframe ("nothing to show!") as specified in plan */}
        <Route path="/shell" element={<AppShell />} />
        <Route path="/empty" element={<AppShell />} />

        {/* Catch-all fallback */}
        <Route
          path="*"
          element={
            <AppShell>
              <HomePage />
            </AppShell>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};
