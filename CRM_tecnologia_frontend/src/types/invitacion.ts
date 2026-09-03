export type RolAsignado = 'analista' | 'programador' | 'auditor' | 'administrador';

export type EstadoInvitacion = 'pendiente' | 'registrado' | 'cancelado' | 'expirado';

export type EstadoUsuario = 'activo' | 'deshabilitado' | 'pendiente_aprobacion';

export interface Invitacion {
  id: string;
  email: string;
  nombre_referencial?: string;
  rol_asignado: RolAsignado | string;
  token: string;
  enlace_completo?: string;
  estado: EstadoInvitacion;
  creado_por: string;
  created_at: string;
  expires_at: string;
}

export interface InvitacionCreatePayload {
  email: string;
  nombre_referencial?: string;
  rol_asignado?: RolAsignado | string;
}

export interface ValidateTokenResult {
  valido: boolean;
  email?: string;
  nombre_referencial?: string;
  rol_asignado?: RolAsignado | string;
  mensaje: string;
}

export interface RegisterInvitedPayload {
  token: string;
  full_name: string;
  password: string;
  phone?: string;
}

export interface ToggleUserStatusPayload {
  habilitado: boolean;
  motivo?: string;
}

export interface NotificacionSolicitud {
  id: string;
  usuario_id: string;
  nombre: string;
  email: string;
  rol: string;
  fecha: string;
  mensaje: string;
}

export interface InvitacionDashboardData {
  total_usuarios: number;
  usuarios_habilitados: number;
  usuarios_pendientes: number;
  invitaciones_activas: number;
  usuarios: Array<{
    id: string;
    nombre: string;
    email: string;
    rol: string;
    empresa?: string;
    avatar?: string;
    biometric_verified?: boolean;
    habilitado?: boolean;
    estado?: EstadoUsuario | string;
    invitado_por?: string;
    created_at?: string;
  }>;
  invitaciones: Invitacion[];
  solicitudes_pendientes: NotificacionSolicitud[];
}
