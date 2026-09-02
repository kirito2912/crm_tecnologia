import React, { useState } from 'react';
import { User, Building, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import type { RegisterFormData } from '../../types/auth';

interface RegisterStepOneProps {
  formData: RegisterFormData;
  onChange: (field: keyof RegisterFormData, value: string) => void;
  onNext: () => void;
  onSwitchToLogin: () => void;
}

export const RegisterStepOne: React.FC<RegisterStepOneProps> = ({
  formData,
  onChange,
  onNext,
  onSwitchToLogin,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setError('Por favor ingresa tu nombre completo.');
      return;
    }
    if (!formData.companyEmail.trim() || !formData.companyEmail.includes('@')) {
      setError('Por favor ingresa un correo corporativo válido.');
      return;
    }
    if (!formData.password || formData.password.length < 8) {
      setError('La contraseña debe contener al menos 8 caracteres.');
      return;
    }
    setError(null);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      {error && (
        <div className="auth-error-banner">
          {error}
        </div>
      )}

      {/* Field: Full Name */}
      <div className="form-group">
        <label className="form-label" htmlFor="fullName">
          Nombre Completo
        </label>
        <div className="input-with-icon-wrapper">
          <User className="input-icon" size={17} />
          <input
            id="fullName"
            type="text"
            className="form-input"
            placeholder="Jane Doe"
            value={formData.fullName}
            onChange={(e) => onChange('fullName', e.target.value)}
            autoComplete="name"
          />
        </div>
      </div>

      {/* Field: Company Email */}
      <div className="form-group">
        <label className="form-label" htmlFor="companyEmail">
          Correo Corporativo
        </label>
        <div className="input-with-icon-wrapper">
          <Building className="input-icon" size={17} />
          <input
            id="companyEmail"
            type="email"
            className="form-input"
            placeholder="jane@company.com"
            value={formData.companyEmail}
            onChange={(e) => onChange('companyEmail', e.target.value)}
            autoComplete="email"
          />
        </div>
      </div>

      {/* Field: Password */}
      <div className="form-group">
        <label className="form-label" htmlFor="password">
          Contraseña
        </label>
        <div className="input-with-icon-wrapper">
          <Lock className="input-icon" size={17} />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            className="form-input"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => onChange('password', e.target.value)}
            autoComplete="new-password"
          />
          <button
            type="button"
            className="password-toggle-btn"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <span className="form-helper-text">
          Debe tener al menos 8 caracteres con alta complejidad.
        </span>
      </div>

      {/* Action Button */}
      <button type="submit" className="auth-primary-btn">
        <span>Continuar a Verificación</span>
        <ArrowRight size={17} strokeWidth={2.3} />
      </button>

      {/* Switch to Login */}
      <div className="auth-switch-footer">
        <span>¿Ya tienes una cuenta corporativa? </span>
        <button
          type="button"
          className="auth-link-btn"
          onClick={onSwitchToLogin}
        >
          Inicia sesión aquí
        </button>
      </div>
    </form>
  );
};
