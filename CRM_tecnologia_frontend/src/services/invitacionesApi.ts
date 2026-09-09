import type {
  Invitacion,
  InvitacionCreatePayload,
  ValidateTokenResult,
  RegisterInvitedPayload,
  ToggleUserStatusPayload,
  InvitacionDashboardData,
} from '../types/invitacion';

const BACKEND_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE_URL = `${BACKEND_BASE_URL}/api/v1/invitaciones`;
const LOCAL_STORAGE_PERMISSIONS_KEY = 'hardcrm_user_permissions_v2';
const LOCAL_STORAGE_INVITACIONES_KEY = 'hardcrm_invitaciones_list_v2';
const LOCAL_STORAGE_USERS_KEY = 'hardcrm_users_directory_v2';

// ---------------------------------------------------------------------------
// Helper: try a fetch, fall back to localStorage logic on network error.
// ---------------------------------------------------------------------------
async function _tryFetch<T>(fetchFn: () => Promise<T>, fallbackFn: () => T | Promise<T>): Promise<T> {
  try {
    return await fetchFn();
  } catch (err: any) {
    if (err?.code === 'ECONNREFUSED' || err?.message?.includes('fetch failed') || err?.message?.includes('Failed to fetch')) {
      return fallbackFn();
    }
    throw err;
  }
}

export async function getInvitacionesDashboard(): Promise<InvitacionDashboardData> {
  return _tryFetch(
    async () => {
      const res = await fetch(`${API_BASE_URL}/dashboard`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Error al cargar el dashboard de invitaciones');
      }
      return res.json();
    },
    () => {
      // localStorage fallback
      const rawUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
      const users: any[] = rawUsers ? JSON.parse(rawUsers) : [];
      const pendientes = users
        .filter((u) => u.estado === 'pendiente_aprobacion' || (!u.habilitado && u.estado !== 'deshabilitado'))
        .map((u) => ({
          id: `SOL-${u.id}`,
          usuario_id: u.id,
          nombre: u.nombre || u.name || '',
          email: u.email,
          rol: u.rol || 'analista',
          fecha: u.created_at || new Date().toISOString(),
          mensaje: 'Requiere habilitación',
        }));
      const rawInvs = localStorage.getItem(LOCAL_STORAGE_INVITACIONES_KEY);
      const invitaciones: any[] = rawInvs ? JSON.parse(rawInvs) : [];
      const habilitados = users.filter((u) => u.habilitado).length;
      return {
        total_usuarios: users.length,
        usuarios_habilitados: habilitados,
        usuarios_pendientes: pendientes.length,
        invitaciones_activas: invitaciones.filter((i) => i.estado === 'pendiente').length,
        usuarios: users,
        invitaciones: invitaciones,
        solicitudes_pendientes: pendientes,
      } as InvitacionDashboardData;
    }
  );
}

export async function listarInvitaciones(): Promise<Invitacion[]> {
  const res = await fetch(`${API_BASE_URL}/`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Error al listar invitaciones');
  }
  return res.json();
}

export async function crearInvitacion(
  data: InvitacionCreatePayload,
  creadoPor: string = 'Administrador'
): Promise<Invitacion> {
  return _tryFetch(
    async () => {
      const res = await fetch(`${API_BASE_URL}/?creado_por=${encodeURIComponent(creadoPor)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Error al crear la invitación');
      }
      return res.json();
    },
    () => {
      // localStorage fallback
      const rawInvs = localStorage.getItem(LOCAL_STORAGE_INVITACIONES_KEY);
      const invitaciones: any[] = rawInvs ? JSON.parse(rawInvs) : [];
      const token = `inv_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const FRONTEND_FALLBACK = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
      const frontendUrl = import.meta.env.VITE_FRONTEND_URL || FRONTEND_FALLBACK;
      const newInv: Invitacion = {
        id: `INV-${Date.now()}`,
        email: data.email,
        nombre_referencial: data.nombre_referencial,
        rol_asignado: data.rol_asignado,
        token,
        enlace_completo: `${frontendUrl}/?invite_token=${token}`,
        estado: 'pendiente',
        creado_por: creadoPor,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        email_enviado: false,
      } as any;
      invitaciones.push(newInv);
      localStorage.setItem(LOCAL_STORAGE_INVITACIONES_KEY, JSON.stringify(invitaciones));
      return newInv;
    }
  );
}

export async function validarTokenInvitacion(token: string): Promise<ValidateTokenResult> {
  return _tryFetch(
    async () => {
      const res = await fetch(`${API_BASE_URL}/validar/${token}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Token de invitación inválido');
      }
      return res.json();
    },
    () => {
      const raw = localStorage.getItem(LOCAL_STORAGE_INVITACIONES_KEY);
      const invs: any[] = raw ? JSON.parse(raw) : [];
      const inv = invs.find((i) => i.token === token);
      if (!inv) return { valido: false, mensaje: 'Token no encontrado' } as ValidateTokenResult;
      if (inv.estado !== 'pendiente') return { valido: false, mensaje: 'La invitación ya fue utilizada o expiró' } as ValidateTokenResult;
      const now = new Date();
      if (inv.expires_at && new Date(inv.expires_at) < now) return { valido: false, mensaje: 'La invitación ha expirado' } as ValidateTokenResult;
      return { valido: true, email: inv.email, rol_asignado: inv.rol_asignado, nombre_referencial: inv.nombre_referencial } as ValidateTokenResult;
    }
  );
}

export async function completarRegistroInvitado(data: RegisterInvitedPayload): Promise<{
  success: boolean;
  message: string;
  user: any;
  requiere_aprobacion: boolean;
}> {
  return _tryFetch(
    async () => {
      const res = await fetch(`${API_BASE_URL}/completar-registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Error al completar el registro');
      }
      return res.json();
    },
    () => {
      // localStorage fallback
      const rawInvs = localStorage.getItem(LOCAL_STORAGE_INVITACIONES_KEY);
      const invs: any[] = rawInvs ? JSON.parse(rawInvs) : [];
      const inv = invs.find((i) => i.token === data.token);
      if (!inv) throw new Error('Token de invitación no encontrado');

      const rawUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
      const users: any[] = rawUsers ? JSON.parse(rawUsers) : [];
      const newUser = {
        id: `USR-${Date.now()}`,
        nombre: data.full_name,
        email: inv.email,
        rol: inv.rol_asignado,
        habilitado: false,
        estado: 'pendiente_aprobacion',
        created_at: new Date().toISOString(),
      };
      users.push(newUser);
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));

      // Mark invitation as used
      inv.estado = 'registrado';
      localStorage.setItem(LOCAL_STORAGE_INVITACIONES_KEY, JSON.stringify(invs));

      return { success: true, message: 'Registro completado', user: newUser, requiere_aprobacion: true };
    }
  );
}

export async function toggleUserStatus(
  userId: string,
  habilitado: boolean,
  motivo?: string
): Promise<any> {
  return _tryFetch(
    async () => {
      const payload: ToggleUserStatusPayload = { habilitado, motivo };
      const res = await fetch(`${API_BASE_URL}/usuarios/${userId}/toggle-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Error al cambiar estado del usuario');
      }
      return res.json();
    },
    () => {
      const raw = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
      const users: any[] = raw ? JSON.parse(raw) : [];
      const idx = users.findIndex((u) => u.id === userId);
      if (idx === -1) throw new Error('Usuario no encontrado');
      users[idx].habilitado = habilitado;
      users[idx].estado = habilitado ? 'activo' : 'deshabilitado';
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
      return users[idx];
    }
  );
}

export async function revocarInvitacion(invitacionId: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/${invitacionId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Error al revocar la invitación');
  }
  return res.json();
}

export async function actualizarPermisosUsuario(
  userId: string,
  proyectosPermitidos: string[]
): Promise<void> {
  try {
    const res = await fetch(`${API_BASE_URL}/usuarios/${userId}/permisos`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proyectos_permitidos: proyectosPermitidos }),
    });
    if (res.ok) {
      // Also sync localStorage for ProjectSelector to pick up immediately
      const raw = localStorage.getItem(LOCAL_STORAGE_PERMISSIONS_KEY);
      const all: Record<string, string[]> = raw ? JSON.parse(raw) : {};
      all[userId] = proyectosPermitidos;
      localStorage.setItem(LOCAL_STORAGE_PERMISSIONS_KEY, JSON.stringify(all));
      return;
    }
  } catch (err) {
    console.warn('[InvitacionesApi] Permisos PATCH fallback:', err);
  }
  // Fallback: persist only in localStorage
  const raw = localStorage.getItem(LOCAL_STORAGE_PERMISSIONS_KEY);
  const all: Record<string, string[]> = raw ? JSON.parse(raw) : {};
  all[userId] = proyectosPermitidos;
  localStorage.setItem(LOCAL_STORAGE_PERMISSIONS_KEY, JSON.stringify(all));
}

export function getPermisosUsuario(userId: string): string[] | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PERMISSIONS_KEY);
    if (!raw) return null;
    const all: Record<string, string[]> = JSON.parse(raw);
    return all[userId] ?? null;
  } catch {
    return null;
  }
}
