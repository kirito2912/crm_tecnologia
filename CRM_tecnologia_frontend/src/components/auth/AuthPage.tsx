import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight, User, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { OtpVerificationStep } from './OtpVerificationStep';
import type { UserRole } from '../../types/auth';

export const AuthPage: React.FC = () => {
  const { login, requestOtp, quickDemoLogin } = useAuth();

  const [stage, setStage] = useState<'form' | 'otp'>('form');
  const [pendingUserData, setPendingUserData] = useState<{
    email: string;
    fullName: string;
    company: string;
    role: UserRole;
    password?: string;
  } | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !email.includes('@')) {
      setErrorMessage('Por favor introduce un correo electrónico corporativo válido.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsSubmitting(true);

    const nameFromEmail = email.split('@')[0].replace(/[._-]/g, ' ');
    const formattedName =
      nameFromEmail
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ') || 'Usuario';

    const effectiveRole: UserRole = email.toLowerCase().includes('admin')
      ? 'administrador'
      : 'analista';

    const userData = {
      email: email.toLowerCase().trim(),
      fullName: formattedName,
      company: email.split('@')[1]?.split('.')[0].toUpperCase() || 'DataTech Analytics',
      role: effectiveRole,
      password,
    };
    setPendingUserData(userData);

    try {
      const res = await requestOtp(userData.email, formattedName, password, 'login', userData.company);
      if (res.success) {
        setStage('otp');
      } else {
        setErrorMessage(res.error || 'No se pudo generar el código OTP. Verifica tus credenciales.');
      }
    } catch {
      setErrorMessage('Error de comunicación con el servicio de autenticación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSuccess = async () => {
    if (!pendingUserData) return;

    await login({
      email: pendingUserData.email,
      password: pendingUserData.password,
      role: pendingUserData.role,
      rememberMe,
    });
  };

  return (
    <div className="nexaflow-auth-wrapper">
      {/* 50% Left Side: Banner Visual */}
      <div className="auth-left-pane">
        <div className="auth-bg-circle circle-1" />
        <div className="auth-bg-circle circle-2" />
        <div className="auth-bg-circle circle-3" />

        <div className="auth-left-content">
          <div className="auth-left-logo">
            <div className="brand-logo-icon" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="14" width="5.5" height="14" rx="2.75" fill="#4f5bc9" opacity="0.85" />
                <rect x="13.25" y="6" width="5.5" height="22" rx="2.75" fill="#4f5bc9" />
                <rect x="22.5" y="10" width="5.5" height="18" rx="2.75" fill="#7e87e8" />
              </svg>
            </div>
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>DataTech Analytics</span>
          </div>

          <h2 className="auth-hero-title">
            Inteligencia Comparativa de Empresas y Datasets
          </h2>
          <p className="auth-hero-desc">
            Plataforma especializada en auditoría de catálogos, análisis de brechas de precios, evolución temporal de ventas y generación de reportes ejecutivos.
          </p>

          <div className="auth-roles-preview-card">
            <div className="auth-role-item-preview">
              <div className="auth-role-icon-box" style={{ background: '#dcfce7', color: '#15803d' }}>
                <User size={18} />
              </div>
              <div>
                <strong>Perfil Analista</strong>
                <p>Carga de Datasets CSV, análisis de discrepancias y emisión de reportes ejecutivos.</p>
              </div>
            </div>

            <div className="auth-role-item-preview">
              <div className="auth-role-icon-box" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                <Shield size={18} />
              </div>
              <div>
                <strong>Perfil Administrador</strong>
                <p>Bandeja de reportes de comparativas, revisión de hallazgos y aprobación estratégica.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 50% Right Side: Form / OTP */}
      <div className="auth-right-pane">
        <div className="auth-form-container">
          {stage === 'otp' ? (
            <OtpVerificationStep
              email={pendingUserData?.email || email}
              fullName={pendingUserData?.fullName}
              onSuccess={handleOtpSuccess}
              onCancel={() => {
                setStage('form');
                setErrorMessage(null);
              }}
            />
          ) : (
            <>
              <span className="auth-kicker">AUTENTICACIÓN 2FA & OTP</span>

              <h2 className="auth-title">
                Inicia sesión con seguridad
              </h2>

              <p className="auth-lead">
                Ingresa tus credenciales para recibir tu código de acceso OTP o entra con 1 clic en modo demo.
              </p>

              {/* Demo Quick Logins */}
              <div className="auth-quick-demo-section">
                <span className="auth-quick-label">ACCESO RÁPIDO DEMO (1 CLIC):</span>
                <div className="auth-quick-grid">
                  <button
                    type="button"
                    className="demo-chip-btn"
                    onClick={() => {
                      setEmail('analista@empresa.com');
                      quickDemoLogin('analista');
                    }}
                  >
                    <div className="demo-chip-avatar" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
                      CM
                    </div>
                    <div className="demo-chip-text">
                      <strong>Carlos Mendoza</strong>
                      <span>Analista (Datasets & Comparativas)</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="demo-chip-btn"
                    onClick={() => {
                      setEmail('admin@empresa.com');
                      quickDemoLogin('admin');
                    }}
                  >
                    <div className="demo-chip-avatar" style={{ backgroundColor: '#e0e7ff', color: '#4338ca' }}>
                      JD
                    </div>
                    <div className="demo-chip-text">
                      <strong>Jane Doe</strong>
                      <span>Administrador (Bandeja de Reportes)</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="auth-divider-line">
                <span>o continúa con tu correo</span>
              </div>

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="auth-main-form">
                {errorMessage && (
                  <div className="auth-error-banner">
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Email Field */}
                <div className="auth-input-group">
                  <label htmlFor="auth-email" className="auth-label">
                    Correo corporativo
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    required
                    className="auth-input-field"
                    placeholder="analista@empresa.com o admin@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Password Field */}
                <div className="auth-input-group">
                  <label htmlFor="auth-password" className="auth-label">
                    Contraseña
                  </label>
                  <div className="auth-password-input-wrapper">
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      className="auth-input-field password-field"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <>
                          <EyeOff size={14} />
                          <span>Ocultar</span>
                        </>
                      ) : (
                        <>
                          <Eye size={14} />
                          <span>Mostrar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="auth-submit-btn"
                >
                  <span>
                    {isSubmitting
                      ? 'Enviando código OTP...'
                      : 'Solicitar Código OTP e Ingresar →'}
                  </span>
                  <ArrowRight size={17} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
