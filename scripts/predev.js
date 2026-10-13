import { execSync } from 'node:child_process';

const PORTS = [5000, 5173];

for (const port of PORTS) {
  try {
    const stdout = execSync(`netstat -ano | findstr :${port}`).toString();
    const lines = stdout.split('\n').filter((l) => l.includes('LISTENING') || l.includes('Listen'));
    const pids = new Set();
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1]?.trim();
      if (pid && pid !== '0' && pid !== String(process.pid)) {
        pids.add(pid);
      }
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        console.log(`[predev] Cleared stale process ${pid} on port ${port}`);
      } catch {}
    }
  } catch {
    // Port is already free
  }
}
