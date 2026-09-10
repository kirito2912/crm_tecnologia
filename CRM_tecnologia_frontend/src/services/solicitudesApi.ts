export interface SolicitudAcceso {
  id: string;
  nombre: string;
  email: string;
  empresa: string | null;
  motivo: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  created_at: string;
  resuelta_at: string | null;
  resuelta_por: string | null;
  invitacion_id: string | null;
  correo_enviado: boolean | null;
}

export interface SolicitudPayload {
  nombre: string;
  email: string;
  empresa: string;
  motivo: string;
}

const base = `${(import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')}/api/v1/solicitudes-acceso`;

async function request<T>(path: string, options: RequestInit = {}, admin = false): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set('Content-Type', 'application/json');
  if (admin) {
    const token = localStorage.getItem('hardcrm_access_token');
    if (!token) throw Object.assign(new Error('Vuelve a iniciar sesión para gestionar solicitudes.'), { status: 401 });
    headers.set('Authorization', `Bearer ${token}`);
  }
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, { ...options, headers });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Actualiza la tabla antes de reintentar.');
  }
  if (admin && response.status === 401) {
    localStorage.removeItem('hardcrm_access_token');
    window.dispatchEvent(new Event('hardcrm:session-expired'));
    throw Object.assign(new Error('Tu sesión venció o no es válida. Vuelve a iniciar sesión.'), { status: 401 });
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'No se pudo procesar la solicitud. Revisa los datos e inténtalo de nuevo.');
  return data;
}

export const solicitarAcceso = (data: SolicitudPayload) => request<{ message: string }>('/', { method: 'POST', body: JSON.stringify(data) });
export const listarSolicitudes = () => request<SolicitudAcceso[]>('/', {}, true);
export const resolverSolicitud = (id: string, decision: 'aprobar' | 'rechazar', rol: 'colaborador' | 'administrador') =>
  request<SolicitudAcceso>(`/${encodeURIComponent(id)}/resolver`, { method: 'POST', body: JSON.stringify({ decision, rol }) }, true);
export const reenviarRespuesta = (id: string) => request<SolicitudAcceso>(`/${encodeURIComponent(id)}/reenviar`, { method: 'POST' }, true);
