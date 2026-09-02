import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, ArrowRight, ArrowLeft, RefreshCw, ScanFace } from 'lucide-react';
import type { RegisterFormData } from '../../types/auth';

interface RegisterStepThreeProps {
  formData: RegisterFormData;
  onSubmit: () => Promise<void>;
  onBack: () => void;
  onSwitchToLogin: () => void;
}

export const RegisterStepThree: React.FC<RegisterStepThreeProps> = ({
  formData,
  onSubmit,
  onBack,
  onSwitchToLogin,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFinish = async () => {
    setIsSubmitting(true);
    await onSubmit();
    setIsSubmitting(false);
  };

  return (
    <div className="auth-form">
      <div className="summary-card">
        <div className="summary-header">
          <CheckCircle2 size={24} color="#16a34a" />
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Perfil Listo para Activación</h4>
            <p style={{ fontSize: '12px', color: '#64748b' }}>Tu entorno CRM B2B y firma biométrica han sido configurados</p>
          </div>
        </div>

        <div className="summary-list">
          <div className="summary-row">
            <span className="summary-label">Usuario:</span>
            <span className="summary-value">{formData.fullName}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Email Corporativo:</span>
            <span className="summary-value">{formData.companyEmail}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Seguridad Biométrica:</span>
            <span className="summary-badge success">
              <ShieldCheck size={13} /> Vector Facial Euclidiano (128-D)
            </span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Autenticación Óptica:</span>
            <span className="summary-value" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0052cc', fontWeight: 700 }}>
              <ScanFace size={14} /> Reconocimiento Facial Activo
            </span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Permisos:</span>
            <span className="summary-value">Ingesta Big Data + Pipeline Comercial</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          type="button"
          className="auth-primary-btn"
          onClick={handleFinish}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <RefreshCw size={17} className="animate-spin" />
              <span>Inicializando Espacio de Trabajo...</span>
            </>
          ) : (
            <>
              <span>Completar Registro y Acceder al Dashboard</span>
              <ArrowRight size={17} strokeWidth={2.3} />
            </>
          )}
        </button>

        <button
          type="button"
          className="auth-secondary-btn"
          onClick={onBack}
          disabled={isSubmitting}
        >
          <ArrowLeft size={16} />
          <span>Regresar a Biometría Facial</span>
        </button>
      </div>

      {/* Switch to Login */}
      <div className="auth-switch-footer">
        <span>¿Ya tienes una cuenta? </span>
        <button
          type="button"
          className="auth-link-btn"
          onClick={onSwitchToLogin}
        >
          Inicia sesión aquí
        </button>
      </div>
    </div>
  );
};
