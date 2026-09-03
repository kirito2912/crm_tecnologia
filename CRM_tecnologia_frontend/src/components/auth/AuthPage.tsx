import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  ArrowRight,
  User,
  Shield,
  Code,
  FileCheck,
  Sparkles,
  Lock,
  Mail,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { OtpVerificationStep } from './OtpVerificationStep';
import { validarTokenInvitacion, completarRegistroInvitado } from '../../services/invitacionesApi';
import type { UserRole, User as AuthUser } from '../../types/auth';
import type { ValidateTokenResult } from '../../types/invitacion';

export const AuthPage: React.FC = () => {
  const { login, requestOtp, quickDemoLogin, completeOtpAuth } = useAuth();

  // Mode: 'login' or 'invite_register'
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteValidation, setInviteValidation] = useState<ValidateTokenResult | null>(null);
  const [isValidatingInvite, setIsValidatingInvite] = useState(false);

  const [stage, setStage] = useState<'form' | 'otp'>('form');
  const [pendingUserData, setPendingUserData] = useState<{
    email: string;
    fullName: string;
    company: string;
    role: UserRole | string;
    password?: string;
    isInvite?: boolean;
  } | null>(null);

  // Standard Login Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Invite Register Fields
  const [inviteFullName, setInviteFullName] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteConfirmPassword, setInviteConfirmPassword] = useState('');
  const [showInvitePassword, setShowInvitePassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detectar token de invitación en la URL al cargar
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tok = params.get('invite_token');
    if (tok) {
      setInviteToken(tok);
      setIsValidatingInvite(true);
      validarTokenInvitacion(tok)
        .then((res) => {
          setInviteValidation(res);
          if (res.valido && res.email) {
            setEmail(res.email);
            if (res.nombre_referencial) {
              setInviteFullName(res.nombre_referencial);
            }
          }
        })
        .catch(() => {
          setInviteValidation({
            valido: false,
            mensaje: 'Error al conectar con el servidor para validar la invitación.',
          });
        })
        .finally(() => {
          setIsValidatingInvite(false);
        });
    }
  }, []);

  // Submit standard login
  const handleStandardLoginSubmit = async (e: React.FormEvent) => {
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
      isInvite: false,
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

  // Submit invited worker registration
  const handleInviteRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!inviteFullName.trim()) {
      setErrorMessage('Por favor introduce tu nombre completo.');
      return;
    }
    if (!invitePassword || invitePassword.length < 6) {
      setErrorMessage('La contraseña debe tener como mínimo 6 caracteres.');
      return;
    }
    if (invitePassword !== inviteConfirmPassword) {
      setErrorMessage('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    setIsSubmitting(true);
    const targetEmail = inviteValidation?.email || email;
    const assignedRole = inviteValidation?.rol_asignado || 'programador';

    const userData = {
      email: targetEmail.toLowerCase().trim(),
      fullName: inviteFullName.trim(),
      company: 'DataTech Analytics',
      role: assignedRole,
      password: invitePassword,
      isInvite: true,
    };
    setPendingUserData(userData);

    try {
      const res = await requestOtp(
        userData.email,
        userData.fullName,
        userData.password,
        'register',
        userData.company
      );
      if (res.success) {
        setStage('otp');
      } else {
        setErrorMessage(res.error || 'No se pudo enviar el código OTP al correo.');
      }
    } catch {
      setErrorMessage('Error de comunicación con el servicio de autenticación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSuccess = async () => {
    if (!pendingUserData) return;

    if (pendingUserData.isInvite && inviteToken) {
      try {
        // Completar registro de invitado
        const res = await completarRegistroInvitado({
          token: inviteToken,
          full_name: pendingUserData.fullName,
          password: pendingUserData.password || '',
        });

        // Limpiar parámetro URL
        window.history.replaceState({}, document.title, window.location.pathname);

        const newUser: AuthUser = {
          id: res.user?.id || `USR-${Math.floor(1000 + Math.random() * 9000)}`,
          name: pendingUserData.fullName,
          email: pendingUserData.email,
          role: pendingUserData.role,
          company: 'DataTech Analytics',
          avatar: pendingUserData.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
          biometricVerified: true,
          registeredAt: new Date().toISOString(),
          habilitado: false, // Bloqueo preventivo
          estado: 'pendiente_aprobacion',
          invitadoPor: 'Administrador',
        };

        completeOtpAuth(newUser);
      } catch (err: any) {
        setErrorMessage(err.message || 'Error al completar el registro.');
        setStage('form');
      }
    } else {
      await login({
        email: pendingUserData.email,
        password: pendingUserData.password,
        role: pendingUserData.role as UserRole,
        rememberMe,
      });
    }
  };

  const getRoleIconAndBadge = (roleStr: string) => {
    const r = roleStr.toLowerCase();
    if (r === 'programador' || r === 'developer' || r === 'dev') {
      return (
        <span className="role-badge badge-dev">
          <Code size={13} />
          Programador / Developer
        </span>
      );
    }
    if (r === 'auditor') {
      return (
        <span className="role-badge badge-auditor">
          <FileCheck size={13} />
          Auditor IT & Seguridad
        </span>
      );
    }
    if (r === 'administrador' || r === 'admin') {
      return (
        <span className="role-badge badge-admin">
          <Shield size={13} />
          Administrador
        </span>
      );
    }
    return (
      <span className="role-badge badge-analista">
        <User size={13} />
        Analista de Datos
      </span>
    );
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
            Inteligencia Comparativa & Control de Accesos
          </h2>
          <p className="auth-hero-desc">
            Plataforma corporativa de auditoría y análisis de datos con sistema de invitaciones seguras estilo GitHub, verificación OTP en 2 pasos y autorización preventiva de cuentas.
          </p>

          <div className="auth-roles-preview-card">
            <div className="auth-role-item-preview">
              <div className="auth-role-icon-box" style={{ background: '#dcfce7', color: '#15803d' }}>
                <User size={18} />
              </div>
              <div>
                <strong>Perfil Analista & Programador</strong>
                <p>Carga de Datasets, comparativa de métricas y gestión de documentos corporativos.</p>
              </div>
            </div>

            <div className="auth-role-item-preview">
              <div className="auth-role-icon-box" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                <Shield size={18} />
              </div>
              <div>
                <strong>Perfil Administrador</strong>
                <p>Generación de invitaciones, habilitación de cuentas y supervisión de reportes ejecutivos.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 50% Right Side: Form / OTP / Invite Flow */}
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
          ) : inviteToken ? (
            /* Flujo de Registro por Invitación */
            <div>
              {isValidatingInvite ? (
                <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                  <Clock className="animate-spin" size={32} color="#4f46e5" style={{ margin: '0 auto 1rem' }} />
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                    Validando enlace de invitación...
                  </h3>
                </div>
              ) : inviteValidation && !inviteValidation.valido ? (
                <div className="auth-invite-invalid-card">
                  <div className="auth-invite-invalid-icon">
                    <AlertCircle size={36} color="#ef4444" />
                  </div>
                  <h3>Invitación no válida</h3>
                  <p>{inviteValidation.mensaje}</p>
                  <button
                    type="button"
                    className="auth-btn-back"
                    onClick={() => {
                      setInviteToken(null);
                      window.history.replaceState({}, document.title, window.location.pathname);
                    }}
                  >
                    <ArrowLeft size={16} />
                    <span>Ir al Inicio de Sesión Estándar</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="auth-invite-banner">
                    <Sparkles size={16} />
                    <span>INVITACIÓN DE ACCESO CORPORATIVO</span>
                  </div>

                  <h2 className="auth-title">
                    Te han invitado al equipo
                  </h2>

                  <p className="auth-lead">
                    Configura tu contraseña y valida tu identidad con un código OTP para registrar tu cuenta en la plataforma.
                  </p>

                  {inviteValidation?.rol_asignado && (
                    <div className="auth-assigned-role-box">
                      <label>Rol asignado por el Administrador:</label>
                      <div>{getRoleIconAndBadge(inviteValidation.rol_asignado)}</div>
                    </div>
                  )}

                  {errorMessage && (
                    <div className="auth-error-banner">
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <form onSubmit={handleInviteRegisterSubmit} className="auth-main-form">
                    {/* Email (Locked) */}
                    <div className="auth-input-group">
                      <label className="auth-label">Correo Electrónico Asignado</label>
                      <div className="auth-locked-input">
                        <Mail size={16} />
                        <span>{inviteValidation?.email || email}</span>
                        <Lock size={14} className="locked-icon" />
                      </div>
                    </div>

                    {/* Full Name */}
                    <div className="auth-input-group">
                      <label htmlFor="invite-fullname" className="auth-label">
                        Tu Nombre Completo *
                      </label>
                      <input
                        id="invite-fullname"
                        type="text"
                        required
                        className="auth-input-field"
                        placeholder="ej. Lucía Ramos"
                        value={inviteFullName}
                        onChange={(e) => setInviteFullName(e.target.value)}
                      />
                    </div>

                    {/* Password */}
                    <div className="auth-input-group">
                      <label htmlFor="invite-pwd" className="auth-label">
                        Definir Contraseña *
                      </label>
                      <div className="auth-password-input-wrapper">
                        <input
                          id="invite-pwd"
                          type={showInvitePassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          className="auth-input-field password-field"
                          placeholder="Mínimo 6 caracteres"
                          value={invitePassword}
                          onChange={(e) => setInvitePassword(e.target.value)}
                        />
                        <button
                          type="button"
                          className="password-toggle-btn"
                          onClick={() => setShowInvitePassword(!showInvitePassword)}
                        >
                          {showInvitePassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="auth-input-group">
                      <label htmlFor="invite-confirm-pwd" className="auth-label">
                        Confirmar Contraseña *
                      </label>
                      <input
                        id="invite-confirm-pwd"
                        type="password"
                        required
                        minLength={6}
                        className="auth-input-field"
                        placeholder="Repite tu contraseña"
                        value={inviteConfirmPassword}
                        onChange={(e) => setInviteConfirmPassword(e.target.value)}
                      />
                    </div>

                    {/* Note about pending approval */}
                    <div className="auth-pending-info-note">
                      <Clock size={15} />
                      <span>
                        Al completar la verificación OTP, tu cuenta quedará registrada y enviada a la bandeja del Administrador para su <strong>habilitación</strong>.
                      </span>
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
                          : 'Solicitar Código OTP y Registrarme →'}
                      </span>
                      <ArrowRight size={17} />
                    </button>
                  </form>
                </>
              )}
            </div>
          ) : (
            /* Flujo Estándar de Login */
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
                      <span>Administrador (Bandeja & Invitaciones)</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="auth-divider-line">
                <span>o continúa con tu correo</span>
              </div>

              {/* Formulario */}
              <form onSubmit={handleStandardLoginSubmit} className="auth-main-form">
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
