import React, { useState } from 'react';
import {
  UserPlus,
  Users,
  ShieldCheck,
  Clock,
  Link as LinkIcon,
  Copy,
  Check,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Mail,
  Shield,
  Code,
  FileCheck,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useInvitaciones } from '../../context/InvitacionesContext';
import type { RolAsignado } from '../../types/invitacion';

export const InvitacionesView: React.FC = () => {
  const {
    usuarios,
    invitaciones,
    solicitudesPendientes,
    kpis,
    isLoading,
    refreshDashboard,
    generarInvitacion,
    alternarEstadoUsuario,
    cancelarInvitacion,
  } = useInvitaciones();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<RolAsignado>('programador');
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [createdInviteLink, setCreatedInviteLink] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'activos' | 'pendientes' | 'deshabilitados'>('todos');
  const [roleFilter, setRoleFilter] = useState<string>('todos');

  // Toast / Feedback State
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => {
      setActionFeedback(null);
    }, 3500);
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes('@')) {
      showToast('Por favor introduce un correo válido.');
      return;
    }

    setIsSubmittingInvite(true);
    try {
      const inv = await generarInvitacion({
        email: inviteEmail.trim().toLowerCase(),
        nombre_referencial: inviteName.trim() || undefined,
        rol_asignado: inviteRole,
      });

      const fullLink =
        inv.enlace_completo ||
        `${window.location.origin}/?invite_token=${inv.token}`;

      setCreatedInviteLink(fullLink);
      showToast(`¡Invitación creada con éxito para ${inv.email}!`);
    } catch (err: any) {
      showToast(err.message || 'Error al generar la invitación');
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const handleCopyLink = (linkOrToken: string, id: string) => {
    const fullLink = linkOrToken.startsWith('http')
      ? linkOrToken
      : `${window.location.origin}/?invite_token=${linkOrToken}`;

    navigator.clipboard.writeText(fullLink);
    setCopiedToken(id);
    showToast('Enlace de invitación copiado al portapapeles');
    setTimeout(() => {
      setCopiedToken(null);
    }, 2500);
  };

  const handleToggleStatus = async (userId: string, currentHabilitado: boolean, userName: string) => {
    const newStatus = !currentHabilitado;
    const ok = await alternarEstadoUsuario(userId, newStatus);
    if (ok) {
      showToast(
        newStatus
          ? `Acceso HABILITADO para ${userName}`
          : `Acceso DESHABILITADO para ${userName}`
      );
    } else {
      showToast('Error al actualizar el estado del usuario');
    }
  };

  const handleRevokeInvite = async (invId: string, email: string) => {
    if (window.confirm(`¿Seguro que deseas cancelar la invitación para ${email}?`)) {
      const ok = await cancelarInvitacion(invId);
      if (ok) {
        showToast(`Invitación para ${email} revocada.`);
      }
    }
  };

  // Filtrado de usuarios
  const filteredUsers = usuarios.filter((u) => {
    const matchesSearch =
      u.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.rol.toLowerCase().includes(searchQuery.toLowerCase());

    const isPending = u.habilitado === false || u.estado === 'pendiente_aprobacion';
    const isHabilitado = u.habilitado === true && u.estado === 'activo';
    const isDeshabilitado = u.habilitado === false && u.estado === 'deshabilitado';

    let matchesStatus = true;
    if (statusFilter === 'activos') matchesStatus = isHabilitado;
    if (statusFilter === 'pendientes') matchesStatus = isPending;
    if (statusFilter === 'deshabilitados') matchesStatus = isDeshabilitado;

    let matchesRole = true;
    if (roleFilter !== 'todos') {
      matchesRole = u.rol.toLowerCase() === roleFilter.toLowerCase();
    }

    return matchesSearch && matchesStatus && matchesRole;
  });

  const getRoleBadge = (rol: string) => {
    const r = rol.toLowerCase();
    if (r === 'administrador' || r === 'admin') {
      return (
        <span className="role-badge badge-admin">
          <Shield size={12} />
          Administrador
        </span>
      );
    }
    if (r === 'programador' || r === 'developer' || r === 'dev') {
      return (
        <span className="role-badge badge-dev">
          <Code size={12} />
          Programador
        </span>
      );
    }
    if (r === 'auditor') {
      return (
        <span className="role-badge badge-auditor">
          <FileCheck size={12} />
          Auditor
        </span>
      );
    }
    return (
      <span className="role-badge badge-analista">
        <Users size={12} />
        Analista de Datos
      </span>
    );
  };

  return (
    <div className="invitaciones-view-container">
      {/* Toast Notification */}
      {actionFeedback && (
        <div className="inv-toast-notification">
          <Sparkles size={16} />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Header View */}
      <div className="inv-header">
        <div>
          <span className="inv-kicker">CONTROL DE ACCESO & SEGURIDAD ORGANIZACIONAL</span>
          <h1 className="inv-title">Gestión de Invitaciones y Personal</h1>
          <p className="inv-subtitle">
            Genera enlaces de invitación estilo GitHub con roles asignados, supervisa solicitudes pendientes con bloqueo preventivo y habilita o revoca cuentas al instante.
          </p>
        </div>

        <div className="inv-header-actions">
          <button
            type="button"
            className="inv-btn-refresh"
            onClick={() => refreshDashboard()}
            title="Recargar datos"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            className="inv-btn-primary"
            onClick={() => {
              setCreatedInviteLink(null);
              setInviteEmail('');
              setInviteName('');
              setInviteRole('programador');
              setIsModalOpen(true);
            }}
          >
            <UserPlus size={18} />
            <span>Generar Invitación</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Metrics */}
      <div className="inv-kpis-grid">
        <div className="inv-kpi-card card-total">
          <div className="inv-kpi-icon-box">
            <Users size={22} />
          </div>
          <div className="inv-kpi-data">
            <span className="inv-kpi-value">{kpis.totalUsuarios}</span>
            <span className="inv-kpi-label">Personal Registrado</span>
          </div>
        </div>

        <div className="inv-kpi-card card-active">
          <div className="inv-kpi-icon-box">
            <ShieldCheck size={22} />
          </div>
          <div className="inv-kpi-data">
            <span className="inv-kpi-value">{kpis.usuariosHabilitados}</span>
            <span className="inv-kpi-label">Cuentas Habilitadas</span>
          </div>
        </div>

        <div className={`inv-kpi-card card-pending ${kpis.usuariosPendientes > 0 ? 'pulse-alert' : ''}`}>
          <div className="inv-kpi-icon-box">
            <Clock size={22} />
          </div>
          <div className="inv-kpi-data">
            <span className="inv-kpi-value">{kpis.usuariosPendientes}</span>
            <span className="inv-kpi-label">Solicitudes Pendientes</span>
          </div>
          {kpis.usuariosPendientes > 0 && <span className="kpi-alert-dot" />}
        </div>

        <div className="inv-kpi-card card-links">
          <div className="inv-kpi-icon-box">
            <LinkIcon size={22} />
          </div>
          <div className="inv-kpi-data">
            <span className="inv-kpi-value">{kpis.invitacionesActivas}</span>
            <span className="inv-kpi-label">Enlaces de Invitación Activos</span>
          </div>
        </div>
      </div>

      {/* Banner de Solicitudes Pendientes de Aprobación */}
      {solicitudesPendientes.length > 0 && (
        <div className="inv-pending-requests-section">
          <div className="pending-section-header">
            <div className="pending-badge-header">
              <AlertTriangle size={18} className="text-amber-500" />
              <h3>Solicitudes de Habilitación Pendientes ({solicitudesPendientes.length})</h3>
            </div>
            <span className="pending-section-sub">
              Estos trabajadores completaron el registro y validación OTP, pero tienen acceso restringido hasta tu autorización.
            </span>
          </div>

          <div className="pending-requests-list">
            {solicitudesPendientes.map((sol) => (
              <div key={sol.id} className="pending-request-card">
                <div className="pending-req-info">
                  <div className="pending-req-avatar">
                    {sol.nombre.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="pending-req-name-row">
                      <strong>{sol.nombre}</strong>
                      <span className="pending-req-email">({sol.email})</span>
                      {getRoleBadge(sol.rol)}
                    </div>
                    <p className="pending-req-msg">{sol.mensaje}</p>
                  </div>
                </div>

                <div className="pending-req-actions">
                  <button
                    type="button"
                    className="btn-enable-now"
                    onClick={() => handleToggleStatus(sol.usuario_id, false, sol.nombre)}
                  >
                    <CheckCircle size={16} />
                    <span>Habilitar Acceso Inmediato</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content: Personal & Invitaciones */}
      <div className="inv-main-grid">
        {/* Left/Top: Directorio de Personal con Botones Habilitar/Deshabilitar */}
        <div className="inv-section-card">
          <div className="inv-section-card-header">
            <div>
              <h2>Directorio de Personal & Control de Acceso</h2>
              <p>Lista de cuentas del sistema con botón interactivo para alternar estado.</p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="inv-filter-bar">
            <div className="inv-search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Buscar por nombre, correo o rol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="inv-filter-selects">
              <div className="inv-filter-group">
                <Filter size={14} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <option value="todos">Todos los Estados</option>
                  <option value="activos">Habilitados (Activos)</option>
                  <option value="pendientes">Pendientes de Aprobación</option>
                  <option value="deshabilitados">Deshabilitados</option>
                </select>
              </div>

              <div className="inv-filter-group">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="todos">Todos los Roles</option>
                  <option value="analista">Analista</option>
                  <option value="programador">Programador</option>
                  <option value="auditor">Auditor</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table of Users */}
          <div className="inv-table-wrapper">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Trabajador</th>
                  <th>Rol Asignado</th>
                  <th>Estado Actual</th>
                  <th>Invitado Por</th>
                  <th style={{ textAlign: 'center' }}>Acción de Acceso</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="inv-empty-cell">
                      No se encontraron trabajadores con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isHabilitado = u.habilitado === true && u.estado !== 'pendiente_aprobacion';
                    const isPending = u.habilitado === false || u.estado === 'pendiente_aprobacion';

                    return (
                      <tr key={u.id} className={isPending ? 'tr-pending-highlight' : ''}>
                        <td>
                          <div className="inv-user-cell">
                            <div className="inv-user-avatar">
                              {u.avatar || u.nombre.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="inv-user-meta">
                              <strong>{u.nombre}</strong>
                              <span>{u.email}</span>
                            </div>
                          </div>
                        </td>

                        <td>{getRoleBadge(u.rol)}</td>

                        <td>
                          {isPending ? (
                            <span className="status-pill status-pending">
                              <Clock size={12} />
                              Pendiente Aprobación
                            </span>
                          ) : isHabilitado ? (
                            <span className="status-pill status-active">
                              <CheckCircle size={12} />
                              Habilitado
                            </span>
                          ) : (
                            <span className="status-pill status-disabled">
                              <XCircle size={12} />
                              Deshabilitado
                            </span>
                          )}
                        </td>

                        <td>
                          <span className="inv-invited-by">
                            {u.invitado_por || 'Sistema Principal'}
                          </span>
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className={`btn-toggle-status ${isHabilitado ? 'btn-disable' : 'btn-enable'}`}
                            onClick={() => handleToggleStatus(u.id, isHabilitado, u.nombre)}
                            title={isHabilitado ? 'Deshabilitar acceso' : 'Habilitar acceso'}
                          >
                            {isHabilitado ? (
                              <>
                                <XCircle size={14} />
                                <span>Deshabilitar</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle size={14} />
                                <span>Habilitar</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right/Bottom: Enlaces de Invitación Activos */}
        <div className="inv-section-card">
          <div className="inv-section-card-header">
            <div>
              <h2>Enlaces de Invitación (Estilo GitHub)</h2>
              <p>Enlaces criptográficos únicos generados para nuevos ingresos.</p>
            </div>
          </div>

          <div className="inv-links-list">
            {invitaciones.length === 0 ? (
              <div className="inv-links-empty">
                <LinkIcon size={32} />
                <p>No hay enlaces de invitación creados.</p>
                <button
                  type="button"
                  className="inv-btn-primary small"
                  onClick={() => setIsModalOpen(true)}
                >
                  <UserPlus size={15} />
                  <span>Crear Primera Invitación</span>
                </button>
              </div>
            ) : (
              invitaciones.map((inv) => {
                const isPending = inv.estado === 'pendiente';
                const isCopied = copiedToken === inv.id;

                return (
                  <div key={inv.id} className={`inv-link-card ${inv.estado}`}>
                    <div className="inv-link-top-row">
                      <div className="inv-link-email-info">
                        <Mail size={15} />
                        <strong>{inv.email}</strong>
                        {inv.nombre_referencial && (
                          <span className="inv-link-ref-name">({inv.nombre_referencial})</span>
                        )}
                      </div>
                      <div>{getRoleBadge(inv.rol_asignado)}</div>
                    </div>

                    <div className="inv-link-token-row">
                      <div className="inv-token-display">
                        <span className="inv-token-text">
                          {inv.enlace_completo || `${window.location.origin}/?invite_token=${inv.token}`}
                        </span>
                      </div>

                      <div className="inv-link-actions-group">
                        <button
                          type="button"
                          className={`btn-copy-token ${isCopied ? 'copied' : ''}`}
                          onClick={() => handleCopyLink(inv.enlace_completo || inv.token, inv.id)}
                          title="Copiar enlace de invitación"
                        >
                          {isCopied ? <Check size={14} /> : <Copy size={14} />}
                          <span>{isCopied ? 'Copiado' : 'Copiar Enlace'}</span>
                        </button>

                        {isPending && (
                          <button
                            type="button"
                            className="btn-revoke-token"
                            onClick={() => handleRevokeInvite(inv.id, inv.email)}
                            title="Revocar invitación"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="inv-link-footer-row">
                      <span className="inv-link-meta">
                        Creado: {new Date(inv.created_at).toLocaleDateString()} por {inv.creado_por}
                      </span>
                      <span className={`inv-status-tag ${inv.estado}`}>
                        {inv.estado === 'pendiente' && 'Vigente / Enlace Activo'}
                        {inv.estado === 'registrado' && 'Registro Completado'}
                        {inv.estado === 'cancelado' && 'Revocado'}
                        {inv.estado === 'expirado' && 'Expirado'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal: Generar Enlace de Invitación */}
      {isModalOpen && (
        <div className="inv-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="inv-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <div className="inv-modal-header-icon">
                <UserPlus size={24} />
              </div>
              <div>
                <h3>Generar Enlace de Invitación</h3>
                <p>Crea un enlace único para que un nuevo trabajador configure su cuenta con verificación OTP.</p>
              </div>
              <button
                type="button"
                className="inv-modal-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {createdInviteLink ? (
              <div className="inv-modal-success-state">
                <div className="inv-success-icon-box">
                  <CheckCircle size={36} />
                </div>
                <h4>¡Enlace de Invitación Creado!</h4>
                <p>
                  Comparte este enlace con el trabajador. Podrá definir su contraseña, validar su código OTP y quedará en espera de tu aprobación.
                </p>

                <div className="inv-success-link-box">
                  <input
                    type="text"
                    readOnly
                    value={createdInviteLink}
                    className="inv-success-link-input"
                  />
                  <button
                    type="button"
                    className="btn-copy-success"
                    onClick={() => handleCopyLink(createdInviteLink, 'modal-success')}
                  >
                    {copiedToken === 'modal-success' ? <Check size={16} /> : <Copy size={16} />}
                    <span>{copiedToken === 'modal-success' ? '¡Copiado!' : 'Copiar'}</span>
                  </button>
                </div>

                <div className="inv-modal-actions">
                  <button
                    type="button"
                    className="inv-btn-primary"
                    onClick={() => {
                      setCreatedInviteLink(null);
                      setInviteEmail('');
                      setInviteName('');
                      setIsModalOpen(false);
                    }}
                  >
                    Listo / Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateInvite} className="inv-modal-form">
                <div className="inv-form-group">
                  <label htmlFor="inv-email">Correo Electrónico del Trabajador *</label>
                  <input
                    id="inv-email"
                    type="email"
                    required
                    placeholder="ej. nuevo.desarrollador@empresa.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="inv-form-input"
                  />
                </div>

                <div className="inv-form-group">
                  <label htmlFor="inv-name">Nombre Referencial (Opcional)</label>
                  <input
                    id="inv-name"
                    type="text"
                    placeholder="ej. Lucía Ramos"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="inv-form-input"
                  />
                </div>

                <div className="inv-form-group">
                  <label htmlFor="inv-role">Rol Predefinido en el Sistema *</label>
                  <select
                    id="inv-role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as RolAsignado)}
                    className="inv-form-select"
                  >
                    <option value="programador">Programador / Desarrollador Frontend & Backend</option>
                    <option value="analista">Analista de Datos (Datasets & Comparativas)</option>
                    <option value="auditor">Auditor IT & Seguridad</option>
                    <option value="administrador">Administrador de Plataforma</option>
                  </select>
                </div>

                <div className="inv-modal-note">
                  <Shield size={14} />
                  <span>
                    El trabajador registrado pasará automáticamente a estado <strong>Pendiente de Aprobación</strong>. No podrá ver ningún dato sensible hasta que presiones <strong>"Habilitar"</strong>.
                  </span>
                </div>

                <div className="inv-modal-actions">
                  <button
                    type="button"
                    className="inv-btn-secondary"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingInvite}
                    className="inv-btn-primary"
                  >
                    <Sparkles size={16} />
                    <span>{isSubmittingInvite ? 'Generando enlace...' : 'Generar Enlace Único'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
