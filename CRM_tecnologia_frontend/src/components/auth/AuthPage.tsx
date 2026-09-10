import { AccessRequestModal } from './AccessRequestModal';
﻿import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  ArrowRight,
  User,
  Shield,
  Sparkles,
  Lock,
  Mail,
  AlertCircle,
  Clock,
  ArrowLeft,
  CheckCircle2,
  BarChart3,
  FileText,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { OtpVerificationStep } from './OtpVerificationStep';
import { validarTokenInvitacion, completarRegistroInvitado } from '../../services/invitacionesApi';
import type { UserRole, User as AuthUser } from '../../types/auth';
import type { ValidateTokenResult } from '../../types/invitacion';

export const AuthPage: React.FC = () => {
  const [requestOpen, setRequestOpen] = useState(false);
  const { login, requestOtp, completeOtpAuth } = useAuth();

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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe] = useState(true);

  const [inviteFullName, setInviteFullName] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteConfirmPassword, setInviteConfirmPassword] = useState('');
  const [showInvitePassword, setShowInvitePassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const closeInviteFlow = () => {
    setStage('form');
    setPendingUserData(null);
    setErrorMessage(null);
    setInvitePassword('');
    setInviteConfirmPassword('');
    setInviteToken(null);
    setInviteValidation(null);
    setIsValidatingInvite(false);
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tok = params.get('invite_token');
    if (!tok) return;

    let cancelled = false;
    Promise.resolve()
      .then(() => {
        if (cancelled) return;
        setInviteToken(tok);
        setIsValidatingInvite(true);
        return validarTokenInvitacion(tok);
      })
      .then((res) => {
        if (!res || cancelled) return;
        setInviteValidation(res);
        if (res.valido && res.email) {
          setEmail(res.email);
          if (res.nombre_referencial) setInviteFullName(res.nombre_referencial);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setInviteValidation({ valido: false, mensaje: 'Error al conectar con el servidor para validar la invitación.' });
      })
      .finally(() => {
        if (cancelled) return;
        setIsValidatingInvite(false);
      });
    return () => { cancelled = true; };
  }, []);

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
    const formattedName = nameFromEmail.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Usuario';
    const effectiveRole: UserRole = email.toLowerCase().includes('admin') ? 'administrador' : 'colaborador';
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

  const handleInviteRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!inviteFullName.trim()) { setErrorMessage('Por favor introduce tu nombre completo.'); return; }
    if (!invitePassword || invitePassword.length < 6) { setErrorMessage('La contraseña debe tener como mínimo 6 caracteres.'); return; }
    if (invitePassword !== inviteConfirmPassword) { setErrorMessage('Las contraseñas no coinciden. Por favor verifícalas.'); return; }

    setIsSubmitting(true);
    const targetEmail = inviteValidation?.email || email;
    const assignedRole = inviteValidation?.rol_asignado || 'colaborador';
    const userData = { email: targetEmail.toLowerCase().trim(), fullName: inviteFullName.trim(), company: 'DataTech Analytics', role: assignedRole, password: invitePassword, isInvite: true };
    setPendingUserData(userData);

    try {
      const res = await requestOtp(userData.email, userData.fullName, userData.password, 'invite', userData.company);
      if (res.success) { setStage('otp'); }
      else { setErrorMessage(res.error || 'No se pudo enviar el código OTP al correo.'); }
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
        const res = await completarRegistroInvitado({ token: inviteToken, full_name: pendingUserData.fullName, password: pendingUserData.password || '' });
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
          habilitado: false,
          estado: 'pendiente_aprobacion',
          invitadoPor: 'Administrador',
        };
        completeOtpAuth(newUser);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al completar el registro.';
        setErrorMessage(msg);
        setStage('form');
      }
    } else {
      await login({ email: pendingUserData.email, password: pendingUserData.password, role: pendingUserData.role as UserRole, rememberMe });
    }
  };

  const getRoleIconAndBadge = (roleStr: string) => {
    const r = roleStr.toLowerCase();
    if (r === 'administrador' || r === 'admin') return (<span className="role-badge badge-admin"><Shield size={13} />Administrador</span>);
    return (<span className="role-badge badge-analista"><User size={13} />Colaborador</span>);
  };

  const features = [
    { icon: <BarChart3 size={18} />, title: 'Análisis Comparativo', desc: 'Visualiza y compara datasets empresariales con métricas en tiempo real.' },
    { icon: <FileText size={18} />, title: 'Reportes Ejecutivos', desc: 'Genera y revisa auditorías comparativas con trazabilidad completa.' },
    { icon: <Users size={18} />, title: 'Control de Accesos', desc: 'Gestiona equipos con invitaciones seguras y roles diferenciados.' },
  ];

  return (
    <div className="nexaflow-auth-wrapper">
      {/* Panel izquierdo */}
      <div className="auth-left-pane">
        <div className="auth-bg-circle circle-1" />
        <div className="auth-bg-circle circle-2" />
        <div className="auth-bg-circle circle-3" />

        <div className="auth-left-content">
          {/* Logo */}
          <div className="auth-left-logo">
            <div className="brand-logo-icon" style={{ background: 'linear-gradient(135deg, #00d4ff 0%, #bf00ff 100%)', boxShadow: '0 0 20px rgba(0, 212, 255, 0.45)', border: 'none' }}>
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="14" width="5.5" height="14" rx="2.75" fill="#00d4ff" opacity="0.85" />
                <rect x="13.25" y="6" width="5.5" height="22" rx="2.75" fill="#00d4ff" />
                <rect x="22.5" y="10" width="5.5" height="18" rx="2.75" fill="#33e0ff" />
              </svg>
            </div>
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#e0e6ff' }}>DataTech Analytics</span>
          </div>

          {/* Headline */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '28px' }}>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
                Plataforma Empresarial B2B
              </p>
              <h2 className="auth-hero-title" style={{ marginBottom: '14px', color: '#e0e6ff' }}>
                Inteligencia Comparativa & Control de Accesos
              </h2>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.65', maxWidth: '380px' }}>
                Centraliza el análisis de datos, auditorías y gestión de equipos en una sola plataforma segura.
              </p>
            </div>

            {/* Feature list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e0e6ff'
                  }}>
                    {f.icon}
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#e0e6ff', margin: '0 0 3px' }}>{f.title}</p>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: '1.5' }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom roles card */}
          <div className="auth-roles-preview-card" style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <div className="auth-role-item-preview">
              <div className="auth-role-icon-box" style={{ background: 'rgba(255,255,255,0.2)', color: '#e0e6ff' }}>
                <User size={18} />
              </div>
              <div>
                <strong style={{ color: '#e0e6ff' }}>Perfil Colaborador</strong>
                <p style={{ color: 'rgba(255,255,255,0.65)' }}>Carga de Datasets, comparativa de métricas y gestión de documentos corporativos.</p>
              </div>
            </div>
            <div className="auth-role-item-preview">
              <div className="auth-role-icon-box" style={{ background: 'rgba(255,255,255,0.2)', color: '#e0e6ff' }}>
                <Shield size={18} />
              </div>
              <div>
                <strong style={{ color: '#e0e6ff' }}>Perfil Administrador</strong>
                <p style={{ color: 'rgba(255,255,255,0.65)' }}>Generación de invitaciones, habilitación de cuentas y supervisión de reportes ejecutivos.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="auth-right-pane">
        <div className="auth-form-container">
          {stage === 'otp' && !inviteToken ? (
            <OtpVerificationStep
              email={pendingUserData?.email || email}
              fullName={pendingUserData?.fullName}
              onSuccess={handleOtpSuccess}
              onCancel={() => { setStage('form'); setErrorMessage(null); }}
            />
          ) : (
            <>
              {/* Header del formulario */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: '#0d2840', borderRadius: '20px', padding: '4px 12px',
                  marginBottom: '16px'
                }}>
                  <Shield size={13} color="#00b8e6" />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#00b8e6', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Autenticación 2FA & OTP
                  </span>
                </div>

                <h2 className="auth-title" style={{ marginBottom: '8px' }}>
                  Inicia sesión con seguridad
                </h2>
                <p style={{ fontSize: '14px', color: '#6b7494', lineHeight: '1.55', margin: 0 }}>
                  Introduce tus credenciales corporativas. Recibirás un código de verificación OTP en tu correo.
                </p>
              </div>

              {/* Security badge */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: '#0a2e22', border: '1px solid #bbf7d0',
                borderRadius: '10px', padding: '10px 14px', marginBottom: '24px'
              }}>
                <CheckCircle2 size={16} color="#00ff88" />
                <span style={{ fontSize: '13px', color: '#00cc6a', fontWeight: 500 }}>
                  Conexión cifrada · Código OTP de un solo uso · Sesión protegida
                </span>
              </div>

              {/* Formulario */}
              <form onSubmit={handleStandardLoginSubmit} className="auth-main-form">
                {errorMessage && (
                  <div className="auth-error-banner">
                    <AlertCircle size={15} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="auth-input-group">
                  <label htmlFor="auth-email" className="auth-label">
                    Correo corporativo
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6b7494', pointerEvents: 'none' }} />
                    <input
                      id="auth-email"
                      type="email"
                      required
                      className="auth-input-field"
                      placeholder="usuario@empresa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ paddingLeft: '42px' }}
                    />
                  </div>
                </div>

                <div className="auth-input-group">
                  <label htmlFor="auth-password" className="auth-label">
                    Contraseña
                  </label>
                  <div className="auth-password-input-wrapper">
                    <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6b7494', pointerEvents: 'none', zIndex: 1 }} />
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      className="auth-input-field password-field"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ paddingLeft: '42px' }}
                    />
                    <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <><EyeOff size={14} /><span>Ocultar</span></> : <><Eye size={14} /><span>Mostrar</span></>}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="auth-submit-btn" style={{ marginTop: '8px' }}>
                  <span>{isSubmitting ? 'Enviando código OTP...' : 'Solicitar Código OTP e Ingresar'}</span>
                  <ArrowRight size={17} />
                </button>
              </form>

              <button type="button" className="inv-btn-secondary access-request-trigger" onClick={() => setRequestOpen(true)}>Solicitar permiso para ingresar al sistema</button>
              {/* Footer info */}
              <p style={{ fontSize: '12px', color: '#6b7494', textAlign: 'center', marginTop: '20px', lineHeight: '1.6' }}>
                Al ingresar aceptas los términos de uso corporativo.
                <br />¿Fuiste invitado? Usa el enlace que recibiste por correo.
              </p>
            </>
          )}
        </div>
      </div>

      {requestOpen && <AccessRequestModal onClose={() => setRequestOpen(false)} />}
      {/* Modal de invitación */}
      {inviteToken && (
        <div className="inv-modal-overlay" onClick={closeInviteFlow}>
          <div className="inv-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <div className="inv-modal-header-icon">
                <Sparkles size={22} />
              </div>
              <div>
                <h3>Invitación de Acceso</h3>
                <p>Crea tu contraseña, confirma y valida tu OTP para registrar tu cuenta.</p>
              </div>
              <button type="button" className="inv-modal-close-btn" onClick={closeInviteFlow}>✕</button>
            </div>

            {isValidatingInvite ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <Clock className="animate-spin" size={28} color="#00b8e6" style={{ margin: '0 auto 10px' }} />
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#d0d6f0', margin: 0 }}>Validando enlace de invitación...</h3>
              </div>
            ) : inviteValidation && !inviteValidation.valido ? (
              <div className="inv-modal-form" style={{ gap: 14 }}>
                <div className="auth-invite-invalid-card" style={{ margin: 0 }}>
                  <div className="auth-invite-invalid-icon"><AlertCircle size={36} color="#ff0055" /></div>
                  <h3>Invitación no válida</h3>
                  <p>{inviteValidation.mensaje}</p>
                  <button type="button" className="auth-btn-back" onClick={closeInviteFlow}>
                    <ArrowLeft size={16} /><span>Volver al Inicio de Sesión</span>
                  </button>
                </div>
              </div>
            ) : stage === 'otp' ? (
              <div className="inv-modal-form" style={{ paddingTop: 18 }}>
                <OtpVerificationStep
                  email={pendingUserData?.email || email}
                  fullName={pendingUserData?.fullName}
                  onSuccess={handleOtpSuccess}
                  onCancel={() => { setStage('form'); setErrorMessage(null); }}
                />
              </div>
            ) : (
              <form onSubmit={handleInviteRegisterSubmit} className="inv-modal-form">
                {inviteValidation?.rol_asignado && (
                  <div className="auth-assigned-role-box" style={{ marginBottom: 4 }}>
                    <label>Rol asignado por el Administrador:</label>
                    <div>{getRoleIconAndBadge(inviteValidation.rol_asignado)}</div>
                  </div>
                )}

                {errorMessage && (
                  <div className="auth-error-banner">
                    <AlertCircle size={15} /><span>{errorMessage}</span>
                  </div>
                )}

                <div className="auth-input-group">
                  <label className="auth-label">Correo Electrónico Asignado</label>
                  <div className="auth-locked-input">
                    <Mail size={16} /><span>{inviteValidation?.email || email}</span>
                    <Lock size={14} className="locked-icon" />
                  </div>
                </div>

                <div className="auth-input-group">
                  <label htmlFor="invite-fullname" className="auth-label">Tu Nombre Completo *</label>
                  <input id="invite-fullname" type="text" required className="auth-input-field" placeholder="ej. Lucía Ramos" value={inviteFullName} onChange={(e) => setInviteFullName(e.target.value)} />
                </div>

                <div className="auth-input-group">
                  <label htmlFor="invite-pwd" className="auth-label">Crear Contraseña *</label>
                  <div className="auth-password-input-wrapper">
                    <input id="invite-pwd" type={showInvitePassword ? 'text' : 'password'} required minLength={6} className="auth-input-field password-field" placeholder="Mínimo 6 caracteres" value={invitePassword} onChange={(e) => setInvitePassword(e.target.value)} />
                    <button type="button" className="password-toggle-btn" onClick={() => setShowInvitePassword(!showInvitePassword)}>
                      {showInvitePassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="auth-input-group">
                  <label htmlFor="invite-confirm-pwd" className="auth-label">Verificar Contraseña *</label>
                  <input id="invite-confirm-pwd" type="password" required minLength={6} className="auth-input-field" placeholder="Repite tu contraseña" value={inviteConfirmPassword} onChange={(e) => setInviteConfirmPassword(e.target.value)} />
                </div>

                <div className="inv-modal-note">
                  <Clock size={14} />
                  <span>Al confirmar tu OTP, tu registro quedará completado y entrarás en estado <strong>En espera de habilitación</strong> hasta que el Administrador autorice tu acceso.</span>
                </div>

                <div className="inv-modal-actions">
                  <button type="button" className="inv-btn-secondary" onClick={closeInviteFlow}>Cancelar</button>
                  <button type="submit" disabled={isSubmitting} className="inv-btn-primary">
                    <span>{isSubmitting ? 'Enviando OTP...' : 'Confirmar y Enviar OTP'}</span>
                    <ArrowRight size={16} />
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

export default AuthPage;

