export type AppRole = 'administrador' | 'colaborador';

export function normalizeRole(role?: string | null): AppRole {
  return ['admin', 'administrador'].includes((role || '').trim().toLowerCase())
    ? 'administrador'
    : 'colaborador';
}
