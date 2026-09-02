import React, { useState } from 'react';
import { RegisterStepOne } from './RegisterStepOne';
import { RegisterStepTwo } from './RegisterStepTwo';
import { RegisterStepThree } from './RegisterStepThree';
import { useAuth } from '../../context/AuthContext';
import type { RegisterFormData, RegisterStep } from '../../types/auth';
import { Check } from 'lucide-react';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [currentStep, setCurrentStep] = useState<RegisterStep>(1);
  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: '',
    companyEmail: '',
    password: '',
  });

  const handleFieldChange = (field: keyof RegisterFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCompleteRegistration = async () => {
    await register(formData);
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 1:
        return 'Paso 1 de 3: Ingresa tu información básica para comenzar.';
      case 2:
        return 'Paso 2 de 3: Completa la verificación biométrica facial.';
      case 3:
        return 'Paso 3 de 3: Revisa y activa tu espacio de trabajo.';
    }
  };

  const stepsList = [
    { num: 1, label: 'Datos' },
    { num: 2, label: 'Biometría' },
    { num: 3, label: 'Finalizar' },
  ];

  return (
    <div className="auth-step-container">
      {/* Title & Subtitle in Spanish */}
      <div className="auth-titles">
        <h2 className="auth-main-title">Crear Cuenta</h2>
        <p className="auth-subtitle">{getStepSubtitle()}</p>
      </div>

      {/* Stepper matching reference image */}
      <div className="stepper-container">
        <div className="stepper-track">
          {/* Connecting line 1 to 2 */}
          <div
            className={`stepper-line ${currentStep >= 2 ? 'completed' : ''}`}
            style={{ left: '16.6%', width: '33.3%' }}
          />
          {/* Connecting line 2 to 3 */}
          <div
            className={`stepper-line ${currentStep >= 3 ? 'completed' : ''}`}
            style={{ left: '50%', width: '33.3%' }}
          />

          {stepsList.map((step) => {
            const isCurrent = currentStep === step.num;
            const isCompleted = currentStep > step.num;

            return (
              <div key={step.num} className="stepper-item">
                <div
                  className={`stepper-circle ${
                    isCurrent ? 'active' : isCompleted ? 'completed' : 'pending'
                  }`}
                >
                  {isCompleted ? <Check size={14} strokeWidth={3} /> : step.num}
                </div>
                <span
                  className={`stepper-label ${
                    isCurrent ? 'active' : isCompleted ? 'completed' : 'pending'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Components */}
      {currentStep === 1 && (
        <RegisterStepOne
          formData={formData}
          onChange={handleFieldChange}
          onNext={() => setCurrentStep(2)}
          onSwitchToLogin={onSwitchToLogin}
        />
      )}

      {currentStep === 2 && (
        <RegisterStepTwo
          onNext={() => setCurrentStep(3)}
          onBack={() => setCurrentStep(1)}
          onSwitchToLogin={onSwitchToLogin}
        />
      )}

      {currentStep === 3 && (
        <RegisterStepThree
          formData={formData}
          onSubmit={handleCompleteRegistration}
          onBack={() => setCurrentStep(2)}
          onSwitchToLogin={onSwitchToLogin}
        />
      )}
    </div>
  );
};
