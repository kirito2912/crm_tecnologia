export type UserRole = 'analista' | 'administrador';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole | string;
  company?: string;
  avatar?: string;
  biometricVerified: boolean;
  registeredAt: string;
}

export interface RegisterFormData {
  fullName: string;
  companyEmail: string;
  password: string;
  role?: UserRole | string;
  company?: string;
}

export interface LoginFormData {
  email: string;
  password?: string;
  role?: UserRole | string;
  rememberMe?: boolean;
}

export type RegisterStep = 1 | 2 | 3;

export interface FacialLandmarkPoint {
  id: number;
  name: string;
  x: number;
  y: number;
}

export interface EuclideanDistanceResult {
  distance: number;
  threshold: number;
  confidence: number;
  isMatch: boolean;
  embeddingDimension: number;
  sampleVectorA: number[];
  sampleVectorB: number[];
  details: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (formData: LoginFormData) => Promise<{ success: boolean; error?: string }>;
  loginWithFaceBiometrics: (email: string) => Promise<{ success: boolean; error?: string }>;
  register: (formData: RegisterFormData) => Promise<{ success: boolean; error?: string }>;
  requestOtp: (
    email: string,
    fullName?: string,
    password?: string,
    mode?: 'login' | 'register',
    company?: string
  ) => Promise<{ success: boolean; otpCode?: string; error?: string }>;
  verifyOtpAndLogin: (
    email: string,
    otpCode: string,
    userData?: Partial<User>
  ) => Promise<{ success: boolean; error?: string }>;
  completeOtpAuth: (user: User) => void;
  quickDemoLogin: (roleKey: 'analista' | 'admin' | 'administrador' | string) => void;
  logout: () => void;
}
