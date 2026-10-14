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
import { SplashLoader } from '../components/SplashLoader';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';
import { useNoteStore } from '../store/useNoteStore';
import { useNotesStore } from '../store/notesStore';
import { useFoldersStore } from '../store/foldersStore';
import { MARKETING_URL } from '../api/client';
import { isPWAMode } from '../pwa/registerSW';

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
 * and automatically redirects them to the workspace root ("/") or previous route.
 */
const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);
  const location = useLocation();

  if (isCheckingAuth) {
    return <SplashLoader />;
  }

  if (isAuthenticated) {
    const from = (location.state as any)?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }
  return <>{children}</>;
};

/**
 * ProtectedRoute Guard
 * Protects workspace and sensitive user account pages.
 * If user session is verifying, renders the smooth SplashLoader.
 * If user is not authenticated, redirects to /login?reason=unauthorized with location state.
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);
  const location = useLocation();

  if (isCheckingAuth) {
    return <SplashLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login?reason=unauthorized" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

/**
 * WorkspaceRoot component for "/"
 * 1. If session is verifying, displays SplashLoader.
 * 2. If authenticated, renders <AppShell><Home /></AppShell>.
 * 3. If unauthenticated:
 *    - In PWA: redirects to /login (app-noteeye.vercel.app/login)
 *    - In web app domain: redirects to the marketing main domain (https://noteeye.vercel.app)
 */
const WorkspaceRoot: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);

  if (isCheckingAuth) {
    return <SplashLoader />;
  }

  if (!isAuthenticated) {
    // PWA user invariant: stay in standalone app and redirect to /login
    if (isPWAMode()) {
      return <Navigate to="/login" replace />;
    }

    // Web browser on app workspace domain: redirect to marketing apex domain
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname.toLowerCase();
      if (hostname === 'app-noteeye.vercel.app' || hostname.includes('app-noteeye')) {
        window.location.replace(MARKETING_URL);
        return null;
      }
    }

    // Local dev fallback
    return <Navigate to="/login" replace />;
  }

  return (
    <AppShell>
      <Home />
    </AppShell>
  );
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
        useNoteStore.getState().resetToDefault();
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
            useNoteStore.getState().resetToDefault();
          }
        })
        .catch(() => {
          useUserStore.getState().resetUser();
          useNoteStore.getState().resetToDefault();
        });
    } else {
      useUserStore.getState().resetUser();
      useNoteStore.getState().resetToDefault();
    }
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      {/* Global Splash Transition Overlay for Login & Logout */}
      <SplashLoader />

      <Routes>
        {/* Workspace Root (Landing Page if guest, AppShell if logged in) */}
        <Route path="/" element={<WorkspaceRoot />} />

        {/* Protected Internal Drive Workspace Pages inside Noteeye AppShell */}
        <Route
          path="/folders/:id"
          element={
            <ProtectedRoute>
              <AppShell>
                <FolderDetail />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/recents"
          element={
            <ProtectedRoute>
              <AppShell>
                <Recents />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <AppShell>
                <Favorites />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notes/new"
          element={
            <ProtectedRoute>
              <AppShell>
                <NoteEditor />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notes/:id"
          element={
            <ProtectedRoute>
              <AppShell>
                <NoteEditor />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <AppShell>
                <Home />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/trash"
          element={
            <ProtectedRoute>
              <AppShell>
                <Trash />
              </AppShell>
            </ProtectedRoute>
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
        <Route
          path="/shell"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        />
        <Route
          path="/empty"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        />

        {/* Landing Page Route: Landing page never lives on app workspace */}
        <Route
          path="/landing"
          element={
            isPWAMode() ? (
              <Navigate to="/login" replace />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Catch-all fallback */}
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <AppShell>
                <Home />
              </AppShell>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};
