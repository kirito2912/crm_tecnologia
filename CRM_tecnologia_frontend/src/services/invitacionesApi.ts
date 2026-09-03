import type {
  Invitacion,
  InvitacionCreatePayload,
  ValidateTokenResult,
  RegisterInvitedPayload,
  ToggleUserStatusPayload,
  InvitacionDashboardData,
} from '../types/invitacion';

const API_BASE_URL = 'http://localhost:8000/api/v1/invitaciones';
const LOCAL_STORAGE_INVITACIONES_KEY = 'hardcrm_invitaciones_list_v2';
const LOCAL_STORAGE_USERS_KEY = 'hardcrm_users_directory_v2';

const INITIAL_LOCAL_INVITACIONES: Invitacion[] = [
  {
    id: 'INV-DEV01',
    email: 'dev.frontend@empresa.com',
    nombre_referencial: 'Lucía Ramos',
    rol_asignado: 'programador',
    token: 'inv_tok_lucia_ramosp982',
    enlace_completo: `${window.location.origin}/?invite_token=inv_tok_lucia_ramosp982`,
    estado: 'pendiente',
    creado_por: 'Jane Doe (Administrador)',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    expires_at: new Date(Date.now() + 3600000 * 24 * 6).toISOString(),
  },
  {
    id: 'INV-AUD02',
    email: 'auditor.it@empresa.com',
    nombre_referencial: 'Roberto Silva',
    rol_asignado: 'auditor',
    token: 'inv_tok_roberto_silva841',
    enlace_completo: `${window.location.origin}/?invite_token=inv_tok_roberto_silva841`,
    estado: 'pendiente',
    creado_por: 'Jane Doe (Administrador)',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    expires_at: new Date(Date.now() + 3600000 * 24 * 6.5).toISOString(),
  },
];

function getStoredInvitaciones(): Invitacion[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_INVITACIONES_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_INVITACIONES_KEY, JSON.stringify(INITIAL_LOCAL_INVITACIONES));
      return INITIAL_LOCAL_INVITACIONES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_LOCAL_INVITACIONES;
  }
}

function saveStoredInvitaciones(invs: Invitacion[]) {
  localStorage.setItem(LOCAL_STORAGE_INVITACIONES_KEY, JSON.stringify(invs));
}

export async function getInvitacionesDashboard(): Promise<InvitacionDashboardData> {
  try {
    const res = await fetch(`${API_BASE_URL}/dashboard`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[InvitacionesApi] Error de red en dashboard, usando fallback local:', err);
  }

  // Fallback local
  const invs = getStoredInvitaciones();
  const rawUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
  const users = rawUsers
    ? JSON.parse(rawUsers)
    : [
        {
          id: 'USR-ADMIN',
          nombre: 'Jane Doe',
          email: 'admin@empresa.com',
          rol: 'administrador',
          empresa: 'DataTech Analytics',
          avatar: 'JD',
          biometric_verified: true,
          habilitado: true,
          estado: 'activo',
          invitado_por: 'Sistema Principal',
          created_at: new Date().toISOString(),
        },
        {
          id: 'USR-ANALISTA',
          nombre: 'Carlos Mendoza',
          email: 'analista@empresa.com',
          rol: 'analista',
          empresa: 'DataTech Analytics',
          avatar: 'CM',
          biometric_verified: true,
          habilitado: true,
          estado: 'activo',
          invitado_por: 'Sistema Principal',
          created_at: new Date().toISOString(),
        },
      ];

  const habilitados = users.filter((u: any) => u.habilitado !== false && u.estado !== 'pendiente_aprobacion').length;
  const pendientes = users.filter((u: any) => u.habilitado === false || u.estado === 'pendiente_aprobacion').length;
  const activas = invs.filter((i) => i.estado === 'pendiente').length;

  const solicitudes = users
    .filter((u: any) => u.habilitado === false || u.estado === 'pendiente_aprobacion')
    .map((u: any) => ({
      id: `SOL-${u.id}`,
      usuario_id: u.id,
      nombre: u.nombre,
      email: u.email,
      rol: u.rol,
      fecha: u.created_at || new Date().toISOString(),
      mensaje: `El trabajador ${u.nombre} (${u.email}) completó su verificación OTP con rol '${u.rol}'. Requiere autorización.`,
    }));

  return {
    total_usuarios: users.length,
    usuarios_habilitados: habilitados,
    usuarios_pendientes: pendientes,
    invitaciones_activas: activas,
    usuarios: users,
    invitaciones: invs,
    solicitudes_pendientes: solicitudes,
  };
}

export async function listarInvitaciones(): Promise<Invitacion[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[InvitacionesApi] Listar error fallback:', err);
  }
  return getStoredInvitaciones();
}

export async function crearInvitacion(
  data: InvitacionCreatePayload,
  creadoPor: string = 'Jane Doe (Administrador)'
): Promise<Invitacion> {
  try {
    const res = await fetch(`${API_BASE_URL}/?creado_por=${encodeURIComponent(creadoPor)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      return await res.json();
    }
    const errData = await res.json();
    throw new Error(errData.detail || 'Error al generar la invitación');
  } catch (err: any) {
    if (err.message && !err.message.includes('fetch')) {
      throw err;
    }
    // Fallback local
    const invs = getStoredInvitaciones();
    const token = `inv_tok_${Math.random().toString(36).substring(2, 12)}_${Date.now().toString(36)}`;
    const nueva: Invitacion = {
      id: `INV-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      email: data.email.toLowerCase().trim(),
      nombre_referencial: data.nombre_referencial || data.email.split('@')[0],
      rol_asignado: data.rol_asignado || 'analista',
      token,
      enlace_completo: `${window.location.origin}/?invite_token=${token}`,
      estado: 'pendiente',
      creado_por: creadoPor,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 3600000 * 24 * 7).toISOString(),
    };
    invs.unshift(nueva);
    saveStoredInvitaciones(invs);
    return nueva;
  }
}

export async function validarTokenInvitacion(token: string): Promise<ValidateTokenResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/validar/${token}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[InvitacionesApi] Validar token fallback:', err);
  }

  // Fallback local
  const invs = getStoredInvitaciones();
  const inv = invs.find((i) => i.token === token);
  if (!inv) {
    return { valido: false, mensaje: 'El enlace de invitación no es válido o no existe.' };
  }
  if (inv.estado === 'registrado') {
    return { valido: false, email: inv.email, rol_asignado: inv.rol_asignado, mensaje: 'Esta invitación ya fue utilizada previamente.' };
  }
  if (inv.estado !== 'pendiente') {
    return { valido: false, mensaje: `Esta invitación se encuentra en estado '${inv.estado}'.` };
  }
  return {
    valido: true,
    email: inv.email,
    nombre_referencial: inv.nombre_referencial,
    rol_asignado: inv.rol_asignado,
    mensaje: `Invitación válida para el rol de ${inv.rol_asignado}.`,
  };
}

export async function completarRegistroInvitado(data: RegisterInvitedPayload): Promise<{
  success: boolean;
  message: string;
  user: any;
  requiere_aprobacion: boolean;
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/completar-registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      return await res.json();
    }
    const errData = await res.json();
    throw new Error(errData.detail || 'Error al completar registro');
  } catch (err: any) {
    if (err.message && !err.message.includes('fetch')) {
      throw err;
    }
    // Fallback local
    const invs = getStoredInvitaciones();
    const invIndex = invs.findIndex((i) => i.token === data.token);
    const inv = invIndex >= 0 ? invs[invIndex] : null;
    const email = inv ? inv.email : 'usuario@empresa.com';
    const rol = inv ? inv.rol_asignado : 'programador';

    if (invIndex >= 0) {
      invs[invIndex].estado = 'registrado';
      saveStoredInvitaciones(invs);
    }

    const newUser = {
      id: `USR-${Math.floor(100 + Math.random() * 900)}`,
      nombre: data.full_name,
      email,
      rol,
      empresa: 'DataTech Analytics',
      avatar: data.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
      biometric_verified: true,
      habilitado: false, // Deshabilitado hasta aprobación
      estado: 'pendiente_aprobacion',
      invitado_por: inv ? inv.creado_por : 'Jane Doe (Administrador)',
      created_at: new Date().toISOString(),
    };

    const rawUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    const users = rawUsers ? JSON.parse(rawUsers) : [];
    users.unshift(newUser);
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));

    return {
      success: true,
      message: 'Registro completado con éxito. Tu cuenta fue enviada a la bandeja de autorización del Administrador.',
      user: newUser,
      requiere_aprobacion: true,
    };
  }
}

export async function toggleUserStatus(
  userId: string,
  habilitado: boolean,
  motivo?: string
): Promise<any> {
  try {
    const payload: ToggleUserStatusPayload = { habilitado, motivo };
    const res = await fetch(`${API_BASE_URL}/usuarios/${userId}/toggle-status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    }
    const errData = await res.json();
    throw new Error(errData.detail || 'Error al cambiar estado del usuario');
  } catch (err: any) {
    if (err.message && !err.message.includes('fetch')) {
      throw err;
    }
    // Fallback local
    const rawUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    const users = rawUsers ? JSON.parse(rawUsers) : [];
    const idx = users.findIndex((u: any) => u.id === userId);
    if (idx >= 0) {
      users[idx].habilitado = habilitado;
      users[idx].estado = habilitado ? 'activo' : 'deshabilitado';
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
      return users[idx];
    }
    return { id: userId, habilitado, estado: habilitado ? 'activo' : 'deshabilitado' };
  }
}

export async function revocarInvitacion(invitacionId: string): Promise<{ message: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/${invitacionId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[InvitacionesApi] Revocar error fallback:', err);
  }

  const invs = getStoredInvitaciones();
  const idx = invs.findIndex((i) => i.id === invitacionId);
  if (idx >= 0) {
    invs[idx].estado = 'cancelado';
    saveStoredInvitaciones(invs);
  }
  return { message: 'Invitación cancelada correctamente.' };
}
