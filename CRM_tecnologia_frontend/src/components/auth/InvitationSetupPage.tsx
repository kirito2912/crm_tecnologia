import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Shield,
  Sparkles,
  Clock,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { OtpVerificationStep } from './OtpVerificationStep';
import { validarTokenInvitacion } from '../../services/invitacionesApi';
import type { UserRole, User as AuthUser } from '../../types/auth';
import type { ValidateTokenResult } from '../../types/invitacion';

type InviteFlowStage =
  | 'validating'
  | 'invalid'
  | 'password_form'
  | 'otp_sent'
  | 'saving'
  | 'success_saved'
  | 'error';

interface InvitationSetupPageProps {
  inviteToken: string;
  onGotoLogin: () => void;
  onRegistrationComplete: (user: AuthUser) => void;
}

export const InvitationSetupPage: React.FC<InvitationSetupPageProps> = ({
  inviteToken,
  onGotoLogin,
  onRegistrationComplete,
}) => {
  const { requestOtp, completeOtpAuth } = useAuth();

  const [stage, setStage] = useState<InviteFlowStage>('validating');
  const [inviteValidation, setInviteValidation] = useState<ValidateTokenResult | null>(null);
  const [pendingUserData, setPendingUserData] = useState<{
    email: string;
    fullName: string;
    role: UserRole | string;
    password: string;
  } | null>(null);

  const [savedUser, setSavedUser] = useState<AuthUser | null>(null);

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then(() => {
        if (cancelled) return;
        return validarTokenInvitacion(inviteToken);
      })
      .then((res) => {
        if (cancelled || !res) return;
        setInviteValidation(res);
        if (res.valido && res.email) {
          if (res.nombre_referencial) setFullName(res.nombre_referencial);
          setStage('password_form');
        } else {
          setStage('invalid');
        }
      })
      .catch(() => {
        if (cancelled) return;
        setInviteValidation({
          valido: false,
          mensaje: 'Error al conectar con el servidor para validar la invitación.',
        });
        setStage('invalid');
      });
    return () => {
      cancelled = true;
    };
  }, [inviteToken]);

  useEffect(() => {
    if (password && confirmPassword) {
      setPasswordsMatch(password === confirmPassword);
    } else {
      setPasswordsMatch(true);
    }
  }, [password, confirmPassword]);

  const getRoleIconAndBadge = (roleStr: string) => {
    const r = roleStr.toLowerCase();
    if (r === 'administrador' || r === 'admin')
      return (
        <span className="role-badge badge-admin">
          <Shield size={13} />
          Administrador
        </span>
      );
    return (
      <span className="role-badge badge-analista">
        <User size={13} />
        Colaborador
      </span>
    );
  };

  const handleSubmitPasswordForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Por favor introduce tu nombre completo.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('La contraseña debe tener como mínimo 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    if (!inviteValidation?.email) {
      setErrorMessage('No se pudo determinar el correo de la invitación.');
      return;
    }

    setIsSubmitting(true);
    const targetEmail = inviteValidation.email.toLowerCase().trim();
    const assignedRole = inviteValidation.rol_asignado || 'colaborador';
    const userData = {
      email: targetEmail,
      fullName: fullName.trim(),
      role: assignedRole,
      password,
    };
    setPendingUserData(userData);

    try {
      const res = await requestOtp(
        userData.email,
        userData.fullName,
        userData.password,
        'invite'
      );
      if (res.success) {
        setStage('otp_sent');
      } else {
        setErrorMessage(
          res.error || 'No se pudo enviar el código OTP al correo.'
        );
      }
    } catch {
      setErrorMessage('Error de comunicación con el servicio de autenticación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSuccess = async () => {
    if (!pendingUserData || !inviteToken) return;
    setStage('saving');

    try {
      const { completarRegistroInvitado } = await import('../../services/invitacionesApi');
      const res = await completarRegistroInvitado({
        token: inviteToken,
        full_name: pendingUserData.fullName,
        password: pendingUserData.password,
      });

      if (!res.success || !res.user?.id) throw new Error('El servidor no confirmó el registro.');

      const avatar = pendingUserData.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      const newUser: AuthUser = {
        id: res.user.id,
        name: pendingUserData.fullName,
        email: pendingUserData.email,
        role: pendingUserData.role,
        company: 'DataTech Analytics',
        avatar,
        biometricVerified: true,
        registeredAt: new Date().toISOString(),
        habilitado: false,
        estado: 'pendiente_aprobacion',
        invitadoPor: (res.user as any)?.invitado_por || 'Administrador',
      };

      setSavedUser(newUser);
      setPendingUserData({ ...pendingUserData, password: '' });
      setPassword('');
      setConfirmPassword('');
      setStage('success_saved');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Error al completar el registro.';
      setErrorMessage(msg);
      setStage('error');
    }
  };

  const handleContinueAfterSuccess = () => {
    if (!savedUser) return;
    completeOtpAuth(savedUser);
    onRegistrationComplete(savedUser);
  };

  return (
    <div className="nexaflow-auth-wrapper">
      <div className="auth-left-pane">
        <div className="auth-bg-circle circle-1" />
        <div className="auth-bg-circle circle-2" />
        <div className="auth-bg-circle circle-3" />

        <div className="auth-left-content">
          <div className="auth-left-logo">
            <div
              className="brand-logo-icon"
              style={{
                background: 'linear-gradient(135deg, #00d4ff 0%, #bf00ff 100%)',
                boxShadow: '0 0 20px rgba(0, 212, 255, 0.45)',
                border: 'none',
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="4"
                  y="14"
                  width="5.5"
                  height="14"
                  rx="2.75"
                  fill="#00d4ff"
                  opacity="0.85"
                />
                <rect
                  x="13.25"
                  y="6"
                  width="5.5"
                  height="22"
                  rx="2.75"
                  fill="#00d4ff"
                />
                <rect
                  x="22.5"
                  y="10"
                  width="5.5"
                  height="18"
                  rx="2.75"
                  fill="#33e0ff"
                />
              </svg>
            </div>
            <span
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: '#e0e6ff',
              }}
            >
              DataTech Analytics
            </span>
          </div>

          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '28px',
            }}
          >
            <div>
              <p
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.65)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                }}
              >
                Configuración de Cuenta Invitada
              </p>
              <h2
                className="auth-hero-title"
                style={{ marginBottom: '14px', color: '#e0e6ff' }}
              >
                Activa tu acceso en 3 pasos seguros
              </h2>
              <p
                style={{
                  fontSize: '15px',
                  color: 'rgba(255,255,255,0.75)',
                  lineHeight: '1.65',
                  maxWidth: '380px',
                }}
              >
                Crea tu contraseña, confirma tu identidad con el código OTP y
                espera la habilitación del Administrador. Todo protegido con
                cifrado de extremo a extremo.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                {
                  n: '1',
                  t: 'Crear Contraseña',
                  d: 'Define una clave segura para tu cuenta corporativa.',
                },
                {
                  n: '2',
                  t: 'Verificar OTP',
                  d: 'Confirma el código de 6 dígitos enviado a tu correo.',
                },
                {
                  n: '3',
                  t: 'Esperar Habilitación',
                  d: 'El Administrador autorizará tu acceso y proyectos.',
                },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'rgba(0, 212, 255, 0.2)',
                      border: '1px solid rgba(0, 212, 255, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#00d4ff',
                      fontWeight: 800,
                      fontSize: '13px',
                      flexShrink: 0,
                    }}
                  >
                    {s.n}
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#e0e6ff',
                        margin: '0 0 3px',
                      }}
                    >
                      {s.t}
                    </p>
                    <p
                      style={{
                        fontSize: '13px',
                        color: 'rgba(255,255,255,0.65)',
                        margin: 0,
                        lineHeight: '1.5',
                      }}
                    >
                      {s.d}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right-pane">
        <div className="auth-form-container">
          {stage === 'validating' && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Clock
                className="animate-spin"
                size={36}
                color="#00b8e6"
                style={{ margin: '0 auto 16px' }}
              />
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#2a3358',
                  margin: 0,
                }}
              >
                Validando enlace de invitación...
              </h3>
              <p style={{ fontSize: '13px', color: '#6b7494', marginTop: '8px' }}>
                Estamos comprobando la vigencia de tu invitación.
              </p>
            </div>
          )}

          {stage === 'invalid' && (
            <div>
              <div
                style={{
                  textAlign: 'center',
                  marginBottom: '28px',
                }}
              >
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    background: 'rgba(255, 0, 85, 0.1)',
                    border: '2px solid rgba(255, 0, 85, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <AlertCircle size={36} color="#ff0055" />
                </div>
                <h2
                  className="auth-title"
                  style={{ marginBottom: '8px', fontSize: '22px' }}
                >
                  Invitación no válida
                </h2>
                <p style={{ fontSize: '14px', color: '#6b7494', lineHeight: '1.55' }}>
                  {inviteValidation?.mensaje ||
                    'El enlace de invitación no existe, fue utilizado o expiró.'}
                </p>
              </div>

              <button
                type="button"
                className="auth-submit-btn"
                onClick={onGotoLogin}
              >
                <LogIn size={17} />
                <span>Ir al Inicio de Sesión</span>
              </button>
            </div>
          )}

          {stage === 'password_form' && (
            <>
              <div style={{ marginBottom: '28px' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#0d2840',
                    borderRadius: '20px',
                    padding: '4px 12px',
                    marginBottom: '16px',
                  }}
                >
                  <Sparkles size={13} color="#00b8e6" />
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#00b8e6',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Paso 1 de 3 · Configurar Credenciales
                  </span>
                </div>

                <h2
                  className="auth-title"
                  style={{ marginBottom: '8px', fontSize: '24px' }}
                >
                  Crea tu contraseña de acceso
                </h2>
                <p
                  style={{
                    fontSize: '14px',
                    color: '#6b7494',
                    lineHeight: '1.55',
                    margin: 0,
                  }}
                >
                  Estás a un paso de completar tu registro. Tu correo ya fue
                  verificado por el sistema.
                </p>
              </div>

              {inviteValidation?.rol_asignado && (
                <div
                  className="auth-assigned-role-box"
                  style={{ marginBottom: '16px' }}
                >
                  <label>Rol asignado por el Administrador:</label>
                  <div>{getRoleIconAndBadge(inviteValidation.rol_asignado)}</div>
                </div>
              )}

              {errorMessage && (
                <div className="auth-error-banner">
                  <AlertCircle size={15} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form
                onSubmit={handleSubmitPasswordForm}
                className="auth-main-form"
              >
                <div className="auth-input-group">
                  <label className="auth-label">
                    Correo Electrónico Asignado
                  </label>
                  <div className="auth-locked-input">
                    <Mail size={16} />
                    <span>{inviteValidation?.email}</span>
                    <Lock size={14} className="locked-icon" />
                  </div>
                </div>

                <div className="auth-input-group">
                  <label htmlFor="inv-setup-name" className="auth-label">
                    Tu Nombre Completo *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User
                      size={16}
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#6b7494',
                        pointerEvents: 'none',
                      }}
                    />
                    <input
                      id="inv-setup-name"
                      type="text"
                      required
                      className="auth-input-field"
                      placeholder="ej. Lucía Ramos Gutiérrez"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      style={{ paddingLeft: '42px' }}
                    />
                  </div>
                </div>

                <div className="auth-input-group">
                  <label htmlFor="inv-setup-pwd" className="auth-label">
                    Crear Contraseña *
                  </label>
                  <div className="auth-password-input-wrapper">
                    <Lock
                      size={16}
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#6b7494',
                        pointerEvents: 'none',
                        zIndex: 1,
                      }}
                    />
                    <input
                      id="inv-setup-pwd"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      className="auth-input-field password-field"
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ paddingLeft: '42px' }}
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
                  {password && password.length < 6 && (
                    <p
                      style={{
                        fontSize: '12px',
                        color: '#ff6b6b',
                        marginTop: '6px',
                        margin: '6px 0 0',
                      }}
                    >
                      ⚠ La contraseña debe tener al menos 6 caracteres.
                    </p>
                  )}
                </div>

                <div className="auth-input-group">
                  <label htmlFor="inv-setup-pwd-2" className="auth-label">
                    Verificar Contraseña *
                  </label>
                  <div className="auth-password-input-wrapper">
                    <Lock
                      size={16}
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#6b7494',
                        pointerEvents: 'none',
                        zIndex: 1,
                      }}
                    />
                    <input
                      id="inv-setup-pwd-2"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      className={`auth-input-field password-field ${!passwordsMatch && confirmPassword ? 'has-error' : ''}`}
                      placeholder="Repite tu contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{ paddingLeft: '42px' }}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={14} />
                      ) : (
                        <Eye size={14} />
                      )}
                    </button>
                  </div>
                  {confirmPassword && !passwordsMatch && (
                    <p
                      style={{
                        fontSize: '12px',
                        color: '#ff0055',
                        marginTop: '6px',
                        margin: '6px 0 0',
                        fontWeight: 600,
                      }}
                    >
                      ✗ Las contraseñas no coinciden.
                    </p>
                  )}
                  {confirmPassword && passwordsMatch && password.length >= 6 && (
                    <p
                      style={{
                        fontSize: '12px',
                        color: '#00b36b',
                        marginTop: '6px',
                        margin: '6px 0 0',
                        fontWeight: 600,
                      }}
                    >
                      ✓ Las contraseñas coinciden y son válidas.
                    </p>
                  )}
                </div>

                <div
                  style={{
                    fontSize: '12px',
                    color: '#6b7494',
                    textAlign: 'center',
                    marginTop: '8px',
                    marginBottom: '16px',
                    lineHeight: '1.6',
                  }}
                >
                  <Clock size={12} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
                  Al continuar recibirás un <strong>código OTP de 6 dígitos</strong> en tu correo para confirmar tu identidad.
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="auth-submit-btn"
                  style={{ marginTop: '4px' }}
                >
                  <span>
                    {isSubmitting
                      ? 'Generando código OTP...'
                      : 'Confirmar y Enviar Código OTP'}
                  </span>
                  <ArrowRight size={17} />
                </button>
              </form>

              <p
                style={{
                  fontSize: '12px',
                  color: '#6b7494',
                  textAlign: 'center',
                  marginTop: '20px',
                  lineHeight: '1.6',
                  margin: 0,
                }}
              >
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={onGotoLogin}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0088cc',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Ir al Inicio de Sesión
                </button>
              </p>
            </>
          )}

          {stage === 'otp_sent' && (
            <OtpVerificationStep
              email={pendingUserData?.email || inviteValidation?.email || ''}
              fullName={pendingUserData?.fullName}
              onSuccess={handleOtpSuccess}
              onCancel={() => {
                setStage('password_form');
                setErrorMessage(null);
              }}
            />
          )}

          {stage === 'saving' && <p role="status">Guardando tu cuenta para la aprobación del administrador...</p>}

          {stage === 'success_saved' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div
                style={{
                  width: '88px',
                  height: '88px',
                  borderRadius: '50%',
                  background:
                    'radial-gradient(circle at center, rgba(0, 255, 136, 0.25) 0%, rgba(0, 255, 136, 0.05) 70%)',
                  border: '3px solid rgba(0, 255, 136, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  animation: 'successPulse 1.8s ease-in-out infinite',
                }}
              >
                <CheckCircle2
                  size={52}
                  color="#00ff88"
                  strokeWidth={2}
                />
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#0a2e22',
                  borderRadius: '20px',
                  padding: '4px 14px',
                  marginBottom: '16px',
                }}
              >
                <Shield size={12} color="#00ff88" />
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#00ff88',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  Paso 2 de 3 · Verificación Completada
                </span>
              </div>

              <h2
                className="auth-title"
                style={{
                  marginBottom: '8px',
                  fontSize: '26px',
                  color: '#0f2a4a',
                }}
              >
                ¡Cuenta Creada!
              </h2>

              <p
                style={{
                  fontSize: '16px',
                  color: '#2a3358',
                  lineHeight: '1.6',
                  margin: '0 auto 12px',
                  fontWeight: 700,
                  maxWidth: '420px',
                }}
              >
                Tu usuario y contraseña han sido guardados con éxito
              </p>

              <p
                style={{
                  fontSize: '14px',
                  color: '#6b7494',
                  lineHeight: '1.6',
                  margin: '0 auto 32px',
                  maxWidth: '420px',
                }}
              >
                Tu identidad fue confirmada mediante verificación OTP. Ahora
                tu registro está listo y solamente falta que el Administrador
                habilite tu acceso para que puedas ingresar a la plataforma.
              </p>

              {pendingUserData && (
                <div
                  style={{
                    background: '#f0f4fa',
                    border: '1px solid #d9e3f5',
                    borderRadius: '12px',
                    padding: '18px 20px',
                    textAlign: 'left',
                    marginBottom: '28px',
                    maxWidth: '420px',
                    margin: '0 auto 28px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: '14px',
                      alignItems: 'center',
                      marginBottom: '12px',
                    }}
                  >
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background:
                          'linear-gradient(135deg, #00d4ff 0%, #bf00ff 100%)',
                        color: 'white',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '15px',
                        flexShrink: 0,
                      }}
                    >
                      {pendingUserData.fullName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 700,
                          color: '#1a2450',
                          fontSize: '15px',
                        }}
                      >
                        {pendingUserData.fullName}
                      </p>
                      <p
                        style={{
                          margin: '2px 0 0',
                          fontSize: '13px',
                          color: '#6b7494',
                        }}
                      >
                        {pendingUserData.email}
                      </p>
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      paddingTop: '10px',
                      borderTop: '1px dashed #cfd9ee',
                      fontSize: '12px',
                    }}
                  >
                    <span style={{ color: '#6b7494' }}>
                      Rol:{' '}
                      <strong style={{ color: '#2a3358' }}>
                        {pendingUserData.role}
                      </strong>
                    </span>
                    <span style={{ color: '#6b7494' }}>
                      Estado:{' '}
                      <strong style={{ color: '#cc8c00' }}>
                        En espera de habilitación
                      </strong>
                    </span>
                  </div>
                </div>
              )}

              <button
                type="button"
                className="auth-submit-btn"
                style={{ maxWidth: '320px', margin: '0 auto' }}
                onClick={handleContinueAfterSuccess}
              >
                <span>Continuar</span>
                <ArrowRight size={17} />
              </button>
            </div>
          )}

          {stage === 'error' && (
            <div>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'rgba(255, 0, 85, 0.1)',
                  border: '2px solid rgba(255, 0, 85, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}
              >
                <AlertCircle size={36} color="#ff0055" />
              </div>

              <h2
                className="auth-title"
                style={{ marginBottom: '8px', fontSize: '22px', textAlign: 'center' }}
              >
                Ocurrió un error
              </h2>
              <p
                style={{
                  fontSize: '14px',
                  color: '#6b7494',
                  textAlign: 'center',
                  lineHeight: '1.55',
                  marginBottom: '24px',
                }}
              >
                {errorMessage ||
                  'No se pudo completar el registro. Por favor intenta de nuevo.'}
              </p>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <button
                  type="button"
                  className="auth-submit-btn"
                  onClick={() => {
                    setErrorMessage(null);
                    setStage('password_form');
                  }}
                >
                  <span>Volver a intentar</span>
                </button>
                <button
                  type="button"
                  className="inv-btn-secondary"
                  onClick={onGotoLogin}
                >
                  Ir al Inicio de Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes successPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0, 255, 136, 0.4); }
          50% { box-shadow: 0 0 0 18px rgba(0, 255, 136, 0); }
        }
      `}</style>
    </div>
  );
};

export default InvitationSetupPage;
