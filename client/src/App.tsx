import React, { useEffect } from 'react';
import { HostRouter } from './routes/HostRouter';
import { SyncProvider } from './components/SyncProvider';
import { SplashScreen } from './components/common/SplashScreen';
import { registerServiceWorker } from './pwa/registerSW';

export default function App(): React.JSX.Element {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <SyncProvider>
      <SplashScreen />
      <HostRouter />
    </SyncProvider>
  );
}
