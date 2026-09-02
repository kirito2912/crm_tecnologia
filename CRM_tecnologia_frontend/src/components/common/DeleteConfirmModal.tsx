import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName: string;
  itemType: 'Cliente' | 'Producto' | 'Venta';
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  itemType,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="security-icon-badge" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '17px' }}>{title}</h3>
              <p className="modal-subtitle">Esta acción no se puede deshacer</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div style={{ backgroundColor: '#fff1f2', border: '1px solid #ffe4e6', borderRadius: '10px', padding: '14px', fontSize: '13px', color: '#9f1239' }}>
          ¿Estás seguro de que deseas eliminar permanentemente el {itemType.toLowerCase()}{' '}
          <strong style={{ color: '#881337' }}>"{itemName}"</strong>?
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
          <button type="button" className="auth-secondary-btn" onClick={onClose} style={{ width: 'auto' }}>
            Cancelar
          </button>
          <button
            type="button"
            className="auth-primary-btn"
            style={{ width: 'auto', backgroundColor: '#dc2626', padding: '10px 18px' }}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            <Trash2 size={16} />
            <span>Eliminar {itemType}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
