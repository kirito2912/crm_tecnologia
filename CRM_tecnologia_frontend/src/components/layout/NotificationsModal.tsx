import React from 'react';
import { X, Bell, AlertCircle, TrendingUp, CheckCircle2, ShieldCheck, UserCheck, Clock } from 'lucide-react';
import { useInvitaciones } from '../../context/InvitacionesContext';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const { solicitudesPendientes } = useInvitaciones();

  if (!isOpen) return null;

  const baseNotifications = [
    {
      id: 'base-1',
      type: 'alert',
      title: 'Quiebre de Inventario Crítico',
      desc: 'El stock de Servidores Dell PowerEdge R750 cayó bajo el mínimo (4 uds.).',
      time: 'Hace 10 min',
      icon: AlertCircle,
      color: '#dc2626',
      bg: '#fee2e2',
    },
    {
      id: 'base-2',
      type: 'insight',
      title: 'Oportunidad de Venta Cruzada',
      desc: 'Fintech Hub completó compra de laptops; enviar propuesta de monitores 4K.',
      time: 'Hace 35 min',
      icon: TrendingUp,
      color: '#0052cc',
      bg: '#eff6ff',
    },
    {
      id: 'base-3',
      type: 'security',
      title: 'Autenticación Biométrica Exitosa',
      desc: 'Ingreso confirmado con distancia euclidiana d = 0.312.',
      time: 'Hace 1 hora',
      icon: ShieldCheck,
      color: '#16a34a',
      bg: '#dcfce7',
    },
  ];

  const pendingApprovalNotifications = solicitudesPendientes.map((sol) => ({
    id: `approval-${sol.id}`,
    type: 'approval',
    title: `Solicitud: Habilitar acceso a ${sol.nombre}`,
    desc: sol.mensaje,
    time: new Date(sol.fecha).toLocaleString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short',
    }),
    icon: UserCheck,
    color: '#d97706',
    bg: '#fffbeb',
    badge: 'Pendiente',
    badgeColor: '#f59e0b',
    badgeBg: '#fef3c7',
  }));

  const notifications = [...pendingApprovalNotifications, ...baseNotifications];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="security-icon-badge" style={{ backgroundColor: '#eef2ff', color: '#0052cc' }}>
              <Bell size={20} />
            </div>
            <div>
              <h3 className="modal-title">Centro de Notificaciones</h3>
              <p className="modal-subtitle">
                {pendingApprovalNotifications.length > 0
                  ? `${pendingApprovalNotifications.length} solicitud(es) de habilitación pendiente(s)`
                  : 'Alertas operativas, biometría y CRM'}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '60vh', overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
              <CheckCircle2 size={32} style={{ marginBottom: '8px', color: '#10b981' }} />
              <p style={{ margin: 0 }}>No hay notificaciones en este momento.</p>
            </div>
          ) : (
            notifications.map((n) => {
              const Icon = n.icon;
              return (
                <div
                  key={n.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    backgroundColor: (n as any).bg || '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: (n as any).bg || '#f1f5f9',
                      color: (n as any).color || '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>{n.title}</strong>
                      <span style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        <Clock size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
                        {n.time}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#475569', marginTop: '2px', lineHeight: 1.35 }}>
                      {n.desc}
                    </span>
                    {(n as any).badge && (
                      <span
                        style={{
                          alignSelf: 'flex-start',
                          marginTop: '4px',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: (n as any).badgeBg || '#fef3c7',
                          color: (n as any).badgeColor || '#d97706',
                        }}
                      >
                        {(n as any).badge}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
          <button type="button" className="auth-secondary-btn" onClick={onClose} style={{ width: 'auto' }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
