import React, { useEffect } from 'react';
import { HostRouter } from './routes/HostRouter';
import { SyncProvider } from './components/SyncProvider';
import { registerServiceWorker } from './pwa/registerSW';

export default function App(): React.JSX.Element {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <SyncProvider>
      <HostRouter />
    </SyncProvider>
  );
}
