import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Home } from '../pages/Home';
import { FolderDetail } from '../pages/FolderDetail';
import { Recents } from '../pages/Recents';
import { Favorites } from '../pages/Favorites';
import { Trash } from '../pages/Trash';
import { NoteEditor } from '../pages/NoteEditor';
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import { Profile } from '../pages/Profile';
import { Settings } from '../pages/Settings';
import { LandingPage } from '../pages/LandingPage';
import { SplashLoader } from '../components/SplashLoader';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';
import { useNoteStore } from '../store/useNoteStore';
import { useNotesStore } from '../store/notesStore';
import { useFoldersStore } from '../store/foldersStore';

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

/**
 * GuestRoute Guard
 * If the user is already authenticated, prevents access to /login and /register
 * and automatically redirects them to the workspace root ("/").
 */
const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

/**
 * ProtectedRoute Guard
 * Protects sensitive user account pages (/profile, /settings).
 * If the user is not authenticated, redirects them to /login.
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

export const AppRouter: React.FC = () => {
  // Validate authentication session on initial app boot
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const isLogoutAction =
        searchParams.get('action') === 'logout' || searchParams.get('logout') === 'true';

      if (isLogoutAction) {
        useAuthStore.getState().logout();
        useUserStore.getState().resetUser();
        searchParams.delete('action');
        searchParams.delete('logout');
        const cleanSearch = searchParams.toString() ? `?${searchParams.toString()}` : '';
        window.history.replaceState(
          {},
          '',
          `${window.location.pathname}${cleanSearch}${window.location.hash}`
        );
        return;
      }

      const tokenFromUrl = searchParams.get('auth_token');
      if (tokenFromUrl) {
        localStorage.setItem('noteeye_auth_token', tokenFromUrl);
        searchParams.delete('auth_token');
        const cleanSearch = searchParams.toString() ? `?${searchParams.toString()}` : '';
        window.history.replaceState(
          {},
          '',
          `${window.location.pathname}${cleanSearch}${window.location.hash}`
        );
      }
    }

    const token = localStorage.getItem('noteeye_auth_token');
    if (token) {
      useAuthStore
        .getState()
        .checkAuth()
        .then((isValid) => {
          if (isValid) {
            useUserStore.getState().fetchProfile().catch(() => {});
            useNoteStore.getState().fetchWorkspaceData().catch(() => {});
            useNotesStore.getState().fetchNotes().catch(() => {});
            useFoldersStore.getState().fetchFolders().catch(() => {});
          } else {
            useUserStore.getState().resetUser();
          }
        })
        .catch(() => {
          useUserStore.getState().resetUser();
        });
    } else {
      useUserStore.getState().resetUser();
    }
  }, []);


  return (
    <BrowserRouter>
      <ScrollToTop />
      {/* Global Splash Transition Overlay for Login & Logout */}
      <SplashLoader />

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

        {/* Authentication Pages protected by GuestRoute Guard */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />

        {/* Dedicated Account & Settings Pages protected by ProtectedRoute Guard */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppShell>
                <Profile />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AppShell>
                <Settings />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sessions"
          element={
            <ProtectedRoute>
              <AppShell>
                <Settings />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* Isolated App Shell Wireframe */}
        <Route path="/shell" element={<AppShell />} />
        <Route path="/empty" element={<AppShell />} />

        {/* Landing Page Route (Available for preview & marketing on app domain) */}
        <Route path="/landing" element={<LandingPage />} />

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
