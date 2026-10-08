import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Home } from '../pages/Home';
import { FolderDetail } from '../pages/FolderDetail';
import { Recents } from '../pages/Recents';
import { Favorites } from '../pages/Favorites';
import { Trash } from '../pages/Trash';
import { NoteEditor } from '../pages/NoteEditor';

// Scroll to top helper on navigation
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const contentIsland = document.getElementById('workspace-content-island');
    if (contentIsland) {
      contentIsland.scrollTo({ top: 0, behavior: 'instant' });
    }
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
              <Home />
            </AppShell>
          }
        />
        <Route
          path="/folders/:id"
          element={
            <AppShell>
              <FolderDetail />
            </AppShell>
          }
        />
        <Route
          path="/recents"
          element={
            <AppShell>
              <Recents />
            </AppShell>
          }
        />
        <Route
          path="/favorites"
          element={
            <AppShell>
              <Favorites />
            </AppShell>
          }
        />
        <Route
          path="/notes/new"
          element={
            <AppShell>
              <NoteEditor />
            </AppShell>
          }
        />
        <Route
          path="/notes/:id"
          element={
            <AppShell>
              <NoteEditor />
            </AppShell>
          }
        />
        <Route
          path="/search"
          element={
            <AppShell>
              <Home />
            </AppShell>
          }
        />
        <Route
          path="/trash"
          element={
            <AppShell>
              <Trash />
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
              <Home />
            </AppShell>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};
