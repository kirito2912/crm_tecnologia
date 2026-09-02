import React from 'react';
import type { ReactNode } from 'react';
import { ShieldCheck, Server, ArrowLeft } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
  onGoToLanding?: () => void;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, onGoToLanding }) => {
  return (
    <div className="auth-container">
      {/* Left side: Form Panel */}
      <div className="auth-form-side">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div
            className="auth-header-brand"
            style={{ cursor: onGoToLanding ? 'pointer' : 'default', marginBottom: 0 }}
            onClick={onGoToLanding}
            title="Volver a la página principal"
          >
            <div className="auth-brand-logo">
              <Server size={18} strokeWidth={2.6} />
            </div>
            <span className="auth-brand-name">HardCRM Pro</span>
          </div>

          {onGoToLanding && (
            <button
              type="button"
              onClick={onGoToLanding}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                color: '#64748b',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={14} />
              <span>Página Principal</span>
            </button>
          )}
        </div>

        <div className="auth-form-wrapper">
          {children}
        </div>
      </div>

      {/* Right side: Visual Hardware Tech Pane */}
      <div className="auth-visual-side">
        {/* Decorative background grid and lighting */}
        <div className="auth-visual-backdrop">
          <div className="auth-tech-graphic">
            <div className="rack-server-illumination" />
          </div>
        </div>

        {/* Floating Security Badge Card in Spanish */}
        <div className="enterprise-security-card">
          <div className="security-icon-badge">
            <ShieldCheck size={24} strokeWidth={2.2} />
          </div>
          <div className="security-card-content">
            <h4 className="security-card-title">Seguridad de Grado Empresarial</h4>
            <p className="security-card-desc">
              Tus datos comerciales y pipeline de hardware están blindados mediante reconocimiento facial y algoritmos de distancia euclidiana.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
