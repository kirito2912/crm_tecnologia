import type {
  Invitacion,
  InvitacionCreatePayload,
  ValidateTokenResult,
  RegisterInvitedPayload,
  ToggleUserStatusPayload,
  InvitacionDashboardData,
} from '../types/invitacion';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/invitaciones`;

// ---------------------------------------------------------------------------
// Todas las funciones llaman directamente al backend.
// Si el backend no responde, se lanza el error para que el componente lo maneje.
// No hay datos hardcodeados ni fallback a localStorage.
// ---------------------------------------------------------------------------

export async function getInvitacionesDashboard(): Promise<InvitacionDashboardData> {
  const res = await fetch(`${API_BASE_URL}/dashboard`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Error al cargar el dashboard de invitaciones');
  }
  return res.json();
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
}

export async function validarTokenInvitacion(token: string): Promise<ValidateTokenResult> {
  const res = await fetch(`${API_BASE_URL}/validar/${token}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Token de invitación inválido');
  }
  return res.json();
}

export async function completarRegistroInvitado(data: RegisterInvitedPayload): Promise<{
  success: boolean;
  message: string;
  user: any;
  requiere_aprobacion: boolean;
}> {
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
}

export async function toggleUserStatus(
  userId: string,
  habilitado: boolean,
  motivo?: string
): Promise<any> {
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
