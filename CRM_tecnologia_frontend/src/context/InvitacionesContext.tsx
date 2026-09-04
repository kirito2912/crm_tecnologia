import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type {
  Invitacion,
  InvitacionCreatePayload,
  ValidateTokenResult,
  RegisterInvitedPayload,
  NotificacionSolicitud,
  InvitacionDashboardData,
} from '../types/invitacion';
import {
  getInvitacionesDashboard,
  crearInvitacion,
  toggleUserStatus,
  revocarInvitacion,
  validarTokenInvitacion,
  completarRegistroInvitado,
} from '../services/invitacionesApi';

interface InvitacionesContextType {
  usuarios: InvitacionDashboardData['usuarios'];
  invitaciones: Invitacion[];
  solicitudesPendientes: NotificacionSolicitud[];
  kpis: {
    totalUsuarios: number;
    usuariosHabilitados: number;
    usuariosPendientes: number;
    invitacionesActivas: number;
  };
  isLoading: boolean;
  refreshDashboard: () => Promise<void>;
  generarInvitacion: (payload: InvitacionCreatePayload, creadoPor?: string) => Promise<Invitacion>;
  alternarEstadoUsuario: (userId: string, habilitado: boolean, motivo?: string) => Promise<boolean>;
  cancelarInvitacion: (invitacionId: string) => Promise<boolean>;
  validarToken: (token: string) => Promise<ValidateTokenResult>;
  completarRegistro: (payload: RegisterInvitedPayload) => Promise<{
    success: boolean;
    message: string;
    user?: any;
    requiere_aprobacion?: boolean;
    error?: string;
  }>;
}

const InvitacionesContext = createContext<InvitacionesContextType | undefined>(undefined);

export const InvitacionesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [usuarios, setUsuarios] = useState<InvitacionDashboardData['usuarios']>([]);
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([]);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState<NotificacionSolicitud[]>([]);
  const [kpis, setKpis] = useState({
    totalUsuarios: 0,
    usuariosHabilitados: 0,
    usuariosPendientes: 0,
    invitacionesActivas: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getInvitacionesDashboard();
      setUsuarios(data.usuarios || []);
      setInvitaciones(data.invitaciones || []);
      setSolicitudesPendientes(data.solicitudes_pendientes || []);
      setKpis({
        totalUsuarios: data.total_usuarios || (data.usuarios?.length ?? 0),
        usuariosHabilitados: data.usuarios_habilitados || 0,
        usuariosPendientes: data.usuarios_pendientes || 0,
        invitacionesActivas: data.invitaciones_activas || 0,
      });
    } catch (err) {
      console.error('[InvitacionesContext] Error al cargar dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDashboard();
    // Auto polling every 10 seconds to detect new registered workers awaiting approval
    const timer = setInterval(() => {
      refreshDashboard();
    }, 10000);
    return () => clearInterval(timer);
  }, [refreshDashboard]);

  const generarInvitacion = async (
    payload: InvitacionCreatePayload,
    creadoPor?: string
  ): Promise<Invitacion> => {
    const inv = await crearInvitacion(payload, creadoPor);
    await refreshDashboard();
    return inv;
  };

  const alternarEstadoUsuario = async (
    userId: string,
    habilitado: boolean,
    motivo?: string
  ): Promise<boolean> => {
    try {
      // Actualización optimista — cambia el estado en memoria de inmediato
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, habilitado, estado: habilitado ? 'activo' : 'deshabilitado' }
            : u
        )
      );
      await toggleUserStatus(userId, habilitado, motivo);
      await refreshDashboard();
      return true;
    } catch (err) {
      console.error('[InvitacionesContext] Error alternando estado:', err);
      await refreshDashboard(); // revertir al estado real
      return false;
    }
  };

  const cancelarInvitacion = async (invitacionId: string): Promise<boolean> => {
    try {
      // Actualización optimista — elimina la invitación de memoria de inmediato
      setInvitaciones((prev) => prev.filter((i) => i.id !== invitacionId));
      await revocarInvitacion(invitacionId);
      await refreshDashboard();
      return true;
    } catch (err) {
      console.error('[InvitacionesContext] Error revocando invitación:', err);
      await refreshDashboard(); // revertir al estado real
      return false;
    }
  };

  const validarToken = async (token: string): Promise<ValidateTokenResult> => {
    return await validarTokenInvitacion(token);
  };

  const completarRegistro = async (
    payload: RegisterInvitedPayload
  ): Promise<{
    success: boolean;
    message: string;
    user?: any;
    requiere_aprobacion?: boolean;
    error?: string;
  }> => {
    try {
      const res = await completarRegistroInvitado(payload);
      await refreshDashboard();
      return {
        success: true,
        message: res.message,
        user: res.user,
        requiere_aprobacion: res.requiere_aprobacion,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Error al completar el registro',
        error: err.message,
      };
    }
  };

  return (
    <InvitacionesContext.Provider
      value={{
        usuarios,
        invitaciones,
        solicitudesPendientes,
        kpis,
        isLoading,
        refreshDashboard,
        generarInvitacion,
        alternarEstadoUsuario,
        cancelarInvitacion,
        validarToken,
        completarRegistro,
      }}
    >
      {children}
    </InvitacionesContext.Provider>
  );
};

export const useInvitaciones = (): InvitacionesContextType => {
  const context = useContext(InvitacionesContext);
  if (!context) {
    throw new Error('useInvitaciones must be used within an InvitacionesProvider');
  }
  return context;
};
