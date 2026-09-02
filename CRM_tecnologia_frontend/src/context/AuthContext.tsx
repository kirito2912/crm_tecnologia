import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, RegisterFormData, LoginFormData, AuthContextType } from '../types/auth';

const STORAGE_KEY = 'hardcrm_auth_user_v2';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth from localStorage on mount only
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (formData: LoginFormData): Promise<{ success: boolean; error?: string }> => {
    if (!formData.email) {
      return { success: false, error: 'Por favor ingresa tu correo corporativo.' };
    }

    const emailClean = formData.email.toLowerCase().trim();
    const nameFromEmail = emailClean.split('@')[0];
    const formattedName =
      nameFromEmail
        .split(/[._-]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ') || 'Usuario';

    // Determinar rol
    let assignedRole = formData.role || 'analista';
    if (emailClean.includes('admin') || emailClean.includes('jane')) {
      assignedRole = 'administrador';
    }

    const authUser: User = {
      id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
      name: formattedName,
      email: emailClean,
      role: assignedRole,
      company: emailClean.split('@')[1]?.split('.')[0].toUpperCase() || 'DataTech Analytics',
      avatar: formattedName.split(' ').map((n) => n[0]).join('').slice(0, 2),
      biometricVerified: true,
      registeredAt: new Date().toISOString(),
    };

    setUser(authUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
    return { success: true };
  };

  const loginWithFaceBiometrics = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!email) {
      return { success: false, error: 'Correo corporativo inválido.' };
    }

    const emailClean = email.toLowerCase().trim();
    let formattedName = 'Jane Doe';
    let role = 'administrador';
    let company = 'DataTech Analytics';

    if (emailClean.includes('analista') || emailClean.includes('carlos')) {
      formattedName = 'Carlos Mendoza';
      role = 'analista';
      company = 'DataTech Analytics';
    } else {
      const nameFromEmail = emailClean.split('@')[0];
      formattedName =
        nameFromEmail
          .split(/[._-]/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ') || 'Usuario';
      company = emailClean.split('@')[1]?.split('.')[0].toUpperCase() || 'DataTech Analytics';
      role = emailClean.includes('admin') ? 'administrador' : 'analista';
    }

    const authUser: User = {
      id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
      name: formattedName,
      email: emailClean,
      role,
      company,
      avatar: formattedName.split(' ').map((n) => n[0]).join('').slice(0, 2),
      biometricVerified: true,
      registeredAt: new Date().toISOString(),
    };

    setUser(authUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
    return { success: true };
  };

  const register = async (formData: RegisterFormData): Promise<{ success: boolean; error?: string }> => {
    if (!formData.fullName || !formData.companyEmail) {
      return { success: false, error: 'Por favor completa todos los datos requeridos.' };
    }

    const role = formData.role || 'analista';

    try {
      const { saveLocalRegisteredAccount, registerUserBackend } = await import('../services/authApi');
      saveLocalRegisteredAccount({
        email: formData.companyEmail,
        password: formData.password,
        fullName: formData.fullName,
        role,
        company: formData.company || formData.companyEmail.split('@')[1]?.split('.')[0].toUpperCase() || 'DataTech Analytics',
        registeredAt: new Date().toISOString(),
      });

      await registerUserBackend(
        formData.fullName,
        formData.companyEmail,
        formData.password,
        formData.company,
        role
      );
    } catch (e) {
      console.warn('Error sincronizando registro con backend:', e);
    }

    const initials =
      formData.fullName
        .trim()
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'US';

    const newUser: User = {
      id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
      name: formData.fullName,
      email: formData.companyEmail,
      role,
      company: formData.company || formData.companyEmail.split('@')[1]?.split('.')[0].toUpperCase() || 'DataTech Analytics',
      avatar: initials,
      biometricVerified: true,
      registeredAt: new Date().toISOString(),
    };

    setUser(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    return { success: true };
  };

  const requestOtp = async (
    email: string,
    fullName?: string,
    password?: string,
    mode?: 'login' | 'register',
    company?: string
  ): Promise<{ success: boolean; otpCode?: string; error?: string }> => {
    try {
      const { requestOtpApi } = await import('../services/authApi');
      const res = await requestOtpApi(email, fullName, password, mode, company);
      return {
        success: res.success,
        otpCode: res.otpCode,
        error: res.error,
      };
    } catch {
      return { success: false, error: 'Error al solicitar el código OTP.' };
    }
  };

  const verifyOtpAndLogin = async (
    email: string,
    otpCode: string,
    userData?: Partial<User>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { verifyOtpApi } = await import('../services/authApi');
      const res = await verifyOtpApi(email, otpCode);
      if (!res.success) {
        return { success: false, error: res.error || 'Código OTP inválido.' };
      }

      const emailClean = email.toLowerCase().trim();
      const nameFromEmail = emailClean.split('@')[0];
      const formattedName =
        userData?.name ||
        nameFromEmail
          .split(/[._-]/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ') ||
        'Usuario Verificado';

      const detectedRole =
        userData?.role || (emailClean.includes('admin') ? 'administrador' : 'analista');

      const authUser: User = {
        id: userData?.id || `USR-${Math.floor(1000 + Math.random() * 9000)}`,
        name: formattedName,
        email: emailClean,
        role: detectedRole,
        company: userData?.company || emailClean.split('@')[1]?.split('.')[0].toUpperCase() || 'DataTech Analytics',
        avatar: userData?.avatar || formattedName.split(' ').map((n) => n[0]).join('').slice(0, 2),
        biometricVerified: true,
        registeredAt: new Date().toISOString(),
      };

      setUser(authUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
      if (res.accessToken) {
        localStorage.setItem('hardcrm_access_token', res.accessToken);
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Error al verificar el código OTP.' };
    }
  };

  const completeOtpAuth = (authUser: User) => {
    setUser(authUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
  };

  const quickDemoLogin = (roleKey: 'analista' | 'admin' | 'administrador' | string) => {
    let demoUser: User;
    const key = roleKey.toLowerCase();
    if (key === 'admin' || key === 'administrador') {
      demoUser = {
        id: 'USR-ADMIN',
        name: 'Jane Doe',
        email: 'admin@empresa.com',
        role: 'administrador',
        company: 'DataTech Analytics',
        avatar: 'JD',
        biometricVerified: true,
        registeredAt: new Date().toISOString(),
      };
    } else {
      demoUser = {
        id: 'USR-ANALISTA',
        name: 'Carlos Mendoza',
        email: 'analista@empresa.com',
        role: 'analista',
        company: 'DataTech Analytics',
        avatar: 'CM',
        biometricVerified: true,
        registeredAt: new Date().toISOString(),
      };
    }

    setUser(demoUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demoUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('hardcrm_access_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithFaceBiometrics,
        register,
        requestOtp,
        verifyOtpAndLogin,
        completeOtpAuth,
        quickDemoLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
