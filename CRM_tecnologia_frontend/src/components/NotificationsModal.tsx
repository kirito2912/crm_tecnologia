import React from 'react';
import { X, Bell, AlertTriangle, TrendingUp, Sparkles, CheckCheck } from 'lucide-react';

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
      title: 'Stock Crítico en Servidores Dell R740',
      time: 'Hace 15 min',
      desc: 'Quedan 4 unidades en almacén. Se estima quiebre en 9 días hábiles.',
      icon: AlertTriangle,
      color: '#dc2626',
      bg: '#fee2e2',
    },
    {
      id: 2,
      type: 'insight',
      title: 'Nueva Oportunidad de Venta Cruzada',
      time: 'Hace 2 horas',
      desc: '42 clientes han completado ciclo de compra de laptops para ofertar monitores 4K.',
      icon: Sparkles,
      color: '#4f46e5',
      bg: '#e0e7ff',
    },
    {
      id: 3,
      type: 'goal',
      title: 'Meta Comercial de Agosto Alcanzada al 100.5%',
      time: 'Hace 5 horas',
      desc: 'Ingresos mensuales registraron $342K superando la meta de $340K.',
      icon: TrendingUp,
      color: '#16a34a',
      bg: '#dcfce7',
    },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={20} color="#5850ec" />
            <h3 className="modal-title">Notificaciones del Sistema</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
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
                  gap: '12px',
                  padding: '12px 14px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #f1f5f9',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: n.bg,
                    color: n.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{n.title}</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{n.time}</span>
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '3px' }}>{n.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
          <button
            style={{
              fontSize: '12.5px',
              color: '#5850ec',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onClick={onClose}
          >
            <CheckCheck size={16} /> Marcar todas como leídas
          </button>
        </div>
      </div>
    </div>
  );
};
