import React, { useState } from 'react';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  RefreshCw,
  LogOut,
  UserCheck,
  Building,
  Mail,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface PendingApprovalScreenProps {
  onCheckStatus?: () => void;
}

export const PendingApprovalScreen: React.FC<PendingApprovalScreenProps> = () => {
  const { user, logout } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);

  const roleName = (user?.role || 'analista').toUpperCase();
  const displayName = user?.name || 'Trabajador';
  const email = user?.email || 'usuario@empresa.com';
  const company = user?.company || 'DataTech Analytics';

  const handleVerify = async () => {
    setIsChecking(true);
    setCheckMessage(null);

    try {
      // Intentar consultar al backend
      const res = await fetch('http://localhost:8000/api/v1/invitaciones/dashboard');
      if (res.ok) {
        const data = await res.json();
        const found = data.usuarios?.find(
          (u: any) => u.email.toLowerCase() === email.toLowerCase() || u.id === user?.id
        );
        if (found && (found.habilitado === true || found.estado === 'activo')) {
          setCheckMessage('¡Tu cuenta ha sido habilitada! Redirigiendo al panel...');
          setTimeout(() => {
            // Actualizar usuario en localStorage y reload
            if (user) {
              const updated = { ...user, habilitado: true, estado: 'activo' as const };
              localStorage.setItem('hardcrm_auth_user_v2', JSON.stringify(updated));
              window.location.reload();
            }
          }, 1200);
          return;
        }
      }

      // Check local storage fallback
      const rawUsers = localStorage.getItem('hardcrm_users_directory_v2');
      if (rawUsers) {
        const users = JSON.parse(rawUsers);
        const foundLocal = users.find(
          (u: any) => u.email.toLowerCase() === email.toLowerCase() || u.id === user?.id
        );
        if (foundLocal && foundLocal.habilitado === true) {
          setCheckMessage('¡Tu cuenta ha sido habilitada! Redirigiendo al panel...');
          setTimeout(() => {
            if (user) {
              const updated = { ...user, habilitado: true, estado: 'activo' as const };
              localStorage.setItem('hardcrm_auth_user_v2', JSON.stringify(updated));
              window.location.reload();
            }
          }, 1200);
          return;
        }
      }

      setCheckMessage('Tu solicitud continúa en la bandeja de revisión del Administrador.');
    } catch {
      setCheckMessage('No se pudo verificar el estado en este momento. Intenta de nuevo en unos segundos.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="pending-approval-wrapper">
      <div className="pending-approval-container">
        {/* Header Icon */}
        <div className="pending-icon-bubble">
          <ShieldAlert size={42} className="text-amber-500" />
          <span className="pending-pulse-ring" />
        </div>

        {/* Badge */}
        <div className="pending-status-pill">
          <Clock size={14} className="animate-spin" />
          <span>ESPERANDO AUTORIZACIÓN DEL ADMINISTRADOR</span>
        </div>

        {/* Title */}
        <h1 className="pending-title">Cuenta Registrada con Éxito</h1>

        {/* Description */}
        <p className="pending-lead">
          Has completado la validación de identidad <strong>OTP de 6 dígitos</strong>. Por motivos de seguridad y control de acceso corporativo, tu cuenta debe ser autorizada y habilitada por el <strong>Administrador</strong> antes de poder visualizar las herramientas y datos de la empresa.
        </p>

        {/* Worker Details Card */}
        <div className="pending-user-card">
          <div className="pending-card-header">
            <div className="pending-avatar">
              {user?.avatar || displayName.slice(0, 2).toUpperCase()}
            </div>
            <div className="pending-card-titles">
              <h3>{displayName}</h3>
              <span className="pending-role-tag">
                <Shield size={12} />
                Rol Asignado: {roleName}
              </span>
            </div>
          </div>

          <div className="pending-details-grid">
            <div className="pending-detail-item">
              <Mail size={15} />
              <div>
                <label>Correo Electrónico</label>
                <span>{email}</span>
              </div>
            </div>

            <div className="pending-detail-item">
              <Building size={15} />
              <div>
                <label>Empresa / Organización</label>
                <span>{company}</span>
              </div>
            </div>

            <div className="pending-detail-item">
              <UserCheck size={15} />
              <div>
                <label>Verificación OTP</label>
                <span className="verified-text">
                  <CheckCircle2 size={13} /> Confirmada con Éxito
                </span>
              </div>
            </div>

            <div className="pending-detail-item">
              <Clock size={15} />
              <div>
                <label>Estado Actual</label>
                <span className="pending-badge-text">Bloqueo Preventivo Activo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Message */}
        {checkMessage && (
          <div className={`pending-feedback-banner ${checkMessage.includes('¡') ? 'success' : 'info'}`}>
            <span>{checkMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pending-actions">
          <button
            type="button"
            className="pending-btn-verify"
            onClick={handleVerify}
            disabled={isChecking}
          >
            <RefreshCw size={16} className={isChecking ? 'animate-spin' : ''} />
            <span>{isChecking ? 'Consultando estado...' : 'Comprobar si ya fue Habilitada'}</span>
          </button>

          <button
            type="button"
            className="pending-btn-logout"
            onClick={logout}
          >
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>

        {/* Security Footer Note */}
        <div className="pending-footer-note">
          <span>🔒 Acceso protegido por autenticación 2FA & autorización administrativa basada en roles (RBAC).</span>
        </div>
      </div>
    </div>
  );
};
