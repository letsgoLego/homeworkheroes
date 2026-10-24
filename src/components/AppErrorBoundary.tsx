import { Component, ReactNode } from 'react';

interface State { hasError: boolean }

async function hardReload() {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    // ignore – reload anyway
  }
  window.location.reload();
}

export default class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[AppErrorBoundary]', error);
    const msg = String((error as Error)?.message || error);
    // Stale cached app files after a new release: reload once automatically.
    if (/Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk/i.test(msg)) {
      if (!sessionStorage.getItem('laxhjalp_chunk_reload')) {
        sessionStorage.setItem('laxhjalp_chunk_reload', '1');
        hardReload();
      }
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-sm text-center space-y-4">
          <div className="text-5xl">📚</div>
          <h1 className="text-2xl font-bold text-foreground">Hoppsan, något gick fel</h1>
          <p className="text-muted-foreground">
            Läxhjälp kunde inte visas just nu. Ladda om så hämtas den senaste versionen.
          </p>
          <button
            onClick={hardReload}
            className="w-full rounded-xl bg-primary text-primary-foreground py-3 font-semibold"
          >
            Ladda om Läxhjälp
          </button>
        </div>
      </div>
    );
  }
}
