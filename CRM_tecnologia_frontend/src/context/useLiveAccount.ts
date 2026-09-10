import { useEffect } from 'react';
import type { User } from '../types/auth';

export function useLiveAccount(userId: string | undefined, update: (row: any | null) => void) {
  useEffect(() => {
    if (!userId) return;
    let stopped = false;
    let running = false;
    const controller = new AbortController();
    const refresh = async () => {
      if (stopped || running) return;
      running = true;
      try {
        const base = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
        const response = await fetch(base + '/api/v1/usuarios/' + encodeURIComponent(userId), { cache: 'no-store', signal: controller.signal });
        if (stopped) return;
        if (response.status === 404) { update(null); return; }
        if (!response.ok) return;
        const row = await response.json();
        if (!stopped && row.id === userId) update(row);
      } catch { /* Retry on the next interval; never fabricate permissions. */ }
      finally { running = false; }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    window.addEventListener('focus', refresh);
    window.addEventListener('hardcrm:permissions-updated', refresh);
    return () => {
      stopped = true;
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('hardcrm:permissions-updated', refresh);
    };
  }, [userId, update]);
}

export function applyAccountUpdate(current: User, row: any): User {
  let permissions = row.permisos_proyectos;
  if (typeof permissions === 'string') {
    try { permissions = JSON.parse(permissions); } catch { permissions = []; }
  }
  return { ...current, role: row.rol, habilitado: row.habilitado, estado: row.estado,
    permisosProyectos: Array.isArray(permissions) ? permissions : undefined };
}
