import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, ArrowRight, RefreshCw, AlertCircle, Mail } from 'lucide-react';
import { requestOtpApi, verifyOtpApi } from '../../services/authApi';

interface OtpVerificationStepProps {
  email: string;
  fullName?: string;
  onSuccess: (token?: string) => void;
  onCancel: () => void;
}

export const OtpVerificationStep: React.FC<OtpVerificationStepProps> = ({
  email,
  fullName,
  onSuccess,
  onCancel,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    // Only accept numeric
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    // Handle single character input
    const char = cleanVal[cleanVal.length - 1];
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setErrorMessage(null);

    // Auto-focus next input
    if (index < 5 && char) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all 6 digits filled, automatically verify
    const fullCode = newDigits.join('');
    if (fullCode.length === 6 && !newDigits.includes('')) {
      handleVerify(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedData[i] || '';
    }
    setDigits(newDigits);
    setErrorMessage(null);

    const targetIdx = Math.min(pastedData.length, 5);
    inputRefs.current[targetIdx]?.focus();

    if (pastedData.length === 6) {
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || digits.join('');
    if (code.length !== 6) {
      setErrorMessage('Por favor introduce los 6 dígitos del código que recibiste en tu correo.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const res = await verifyOtpApi(email, code);
      if (res.success) {
        onSuccess(res.accessToken);
      } else {
        setErrorMessage(res.error || 'Código OTP incorrecto o expirado.');
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setErrorMessage('Error al verificar el código con el servidor.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || isResending) return;
    setIsResending(true);
    setErrorMessage(null);
    setResendSuccess(false);

    try {
      const res = await requestOtpApi(email, fullName);
      if (res.success) {
        setResendSuccess(true);
        setCountdown(60);
        setCanResend(false);
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        setTimeout(() => setResendSuccess(false), 4000);
      } else {
        setErrorMessage(res.error || 'No se pudo reenviar el código.');
      }
    } catch {
      setErrorMessage('Error al conectar con el servidor.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="otp-verification-container">
      {/* Header Badge */}
      <div className="otp-badge-wrapper">
        <div className="otp-icon-shield">
          <ShieldCheck size={28} className="text-indigo-600" />
        </div>
      </div>

      <div className="otp-text-header">
        <h3 className="otp-title">Verificación de Seguridad</h3>
        <p className="otp-description">
          Hemos enviado un código confidencial de 6 dígitos a tu correo:
          <br />
          <strong className="otp-highlight-email">{email}</strong>
        </p>
      </div>

      <div className="otp-email-hint-box">
        <Mail size={16} className="text-indigo-500" style={{ flexShrink: 0 }} />
        <span>Revisa tu bandeja de entrada o carpeta de spam e ingresa el código a continuación.</span>
      </div>

      {/* Resend Confirmation Banner */}
      {resendSuccess && (
        <div className="otp-resend-success-banner">
          <span>✓ Nuevo código enviado a tu correo electrónico.</span>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="auth-error-banner" style={{ marginTop: '12px' }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 6 Digit Inputs */}
      <div className="otp-inputs-grid">
        {digits.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => {
              inputRefs.current[idx] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            className={`otp-digit-box ${digit ? 'filled' : ''} ${errorMessage ? 'has-error' : ''}`}
            aria-label={`Dígito ${idx + 1}`}
          />
        ))}
      </div>

      {/* Action Button */}
      <button
        type="button"
        disabled={isVerifying || digits.join('').length < 6}
        className="auth-submit-btn"
        style={{ marginTop: '20px' }}
        onClick={() => handleVerify()}
      >
        <span>{isVerifying ? 'Verificando código...' : 'Verificar e Ingresar'}</span>
        <ArrowRight size={17} />
      </button>

      {/* Resend & Return controls */}
      <div className="otp-footer-controls">
        <button
          type="button"
          disabled={!canResend || isResending}
          onClick={handleResend}
          className={`otp-resend-link ${!canResend ? 'disabled' : ''}`}
        >
          <RefreshCw size={13} className={isResending ? 'animate-spin' : ''} />
          <span>
            {canResend
              ? 'Reenviar código a mi correo'
              : `Reenviar nuevo código en ${countdown}s`}
          </span>
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="otp-cancel-link"
        >
          ← Cambiar correo o volver
        </button>
      </div>
    </div>
  );
};
