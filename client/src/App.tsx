import React from 'react';
import { HostRouter } from './routes/HostRouter';
import { SyncProvider } from './components/SyncProvider';

export default function App(): React.JSX.Element {
  return (
    <SyncProvider>
      <HostRouter />
    </SyncProvider>
  );
}
