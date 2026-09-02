import React from 'react';
import { X, Bell, AlertCircle, TrendingUp, CheckCircle2, ShieldCheck } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const notifications = [
    {
      id: 1,
      type: 'alert',
      title: 'Quiebre de Inventario Crítico',
      desc: 'El stock de Servidores Dell PowerEdge R750 cayó bajo el mínimo (4 uds.).',
      time: 'Hace 10 min',
      icon: AlertCircle,
      color: '#dc2626',
      bg: '#fee2e2',
    },
    {
      id: 2,
      type: 'insight',
      title: 'Oportunidad de Venta Cruzada',
      desc: 'Fintech Hub completó compra de laptops; enviar propuesta de monitores 4K.',
      time: 'Hace 35 min',
      icon: TrendingUp,
      color: '#0052cc',
      bg: '#eff6ff',
    },
    {
      id: 3,
      type: 'security',
      title: 'Autenticación Biométrica Exitosa',
      desc: 'Ingreso confirmado con distancia euclidiana d = 0.312.',
      time: 'Hace 1 hora',
      icon: ShieldCheck,
      color: '#16a34a',
      bg: '#dcfce7',
    },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="security-icon-badge" style={{ backgroundColor: '#eef2ff', color: '#0052cc' }}>
              <Bell size={20} />
            </div>
            <div>
              <h3 className="modal-title">Centro de Notificaciones</h3>
              <p className="modal-subtitle">Alertas operativas, biometría y CRM</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {notifications.map((n) => {
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
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: n.bg,
                    color: n.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={16} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>{n.title}</strong>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{n.time}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#475569', marginTop: '2px', lineHeight: 1.35 }}>
                    {n.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button type="button" className="auth-secondary-btn" onClick={onClose} style={{ width: 'auto' }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
