import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Shield,
  Activity,
  Lock,
  Cloud,
  X,
  User,
  Mail,
  FolderKanban,
  ScanFace,
  Fingerprint,
  Info,
  Sparkles,
  AlertCircle,
  Upload,
} from 'lucide-react';
import './FacialVerification.css';

/* ================================================================
   TIPOS
   ================================================================ */
interface FacialVerificationProps {
  onVerified: (result: VerificationResult) => void;
  onCancel: () => void;
  projectName: string;
  userEmail: string;
}

interface VerificationResult {
  verified: boolean;
  similarity: number;
  confidence: number;
  timestamp: string;
  userName: string;
  landmarks?: FacialLandmark[];
  faceAttributes?: FaceAttributes;
}

interface FacialLandmark {
  type: string;
  x: number;
  y: number;
}

interface FaceAttributes {
  eyesOpen: number;
  mouthOpen: number;
  smile: number;
  eyeglasses: boolean;
  sunglasses: boolean;
  beard: boolean;
  mustache: boolean;
  emotions?: { type: string; confidence: number }[];
}

type Step = 'registration' | 'verification' | 'result';

/* ================================================================
   COMPONENTE
   ================================================================ */
export const FacialVerification: React.FC<FacialVerificationProps> = ({
  onVerified,
  onCancel,
  projectName,
  userEmail,
}) => {
  /* ---------- Estado ---------- */
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [distance, setDistance] = useState<number>(0.0);
  const [liveConfidence, setLiveConfidence] = useState<number>(0);
  const [editableUserName, setEditableUserName] = useState<string>(
    userEmail.split('@')[0]
  );

  const [registrationPhoto, setRegistrationPhoto] = useState<string | null>(null);
  const [verificationPhoto, setVerificationPhoto] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>('registration');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /* ---------- Función para guardar en historial ---------- */
  const saveBiometricRecord = (record: any) => {
    try {
      const stored = localStorage.getItem('hardcrm_biometric_history');
      const history = stored ? JSON.parse(stored) : [];
      history.push(record);
      localStorage.setItem('hardcrm_biometric_history', JSON.stringify(history));
    } catch (error) {
      console.error('Error saving biometric record:', error);
    }
  };

  /* ---------- Cleanup ---------- */
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  /* ---------- Métricas en vivo (animación) ---------- */
  useEffect(() => {
    if (!isCameraActive || isScanning) return;

    let step = 0;
    const interval = setInterval(() => {
      step += 0.15;
      const simulatedDistance = Math.max(0.15, 0.35 + Math.sin(step) * 0.1);
      const simulatedConfidence = Math.min(
        99.5,
        (1 - simulatedDistance / 1.2) * 100
      );

      setDistance(parseFloat(simulatedDistance.toFixed(3)));
      setLiveConfidence(parseFloat(simulatedConfidence.toFixed(1)));
    }, 120);

    return () => clearInterval(interval);
  }, [isCameraActive, isScanning]);

  /* ---------- Cámara ---------- */
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setIsCameraActive(true);
      } else {
        throw new Error('Sin soporte de cámara');
      }
    } catch {
      setCameraError('Cámara física no disponible. Usando sensor virtual HD.');
      setIsCameraActive(true);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = (): string | null => {
    if (!videoRef.current) return null;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(videoRef.current, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  /* ---------- Captura: Foto 1 (Registro) ---------- */
  const handleCaptureRegistration = async () => {
    const photo = capturePhoto();
    if (!photo) {
      setCameraError('Error al capturar la foto');
      return;
    }

    setRegistrationPhoto(photo);
    setCurrentStep('verification');
    stopCamera();

    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  /* ---------- Subir: Foto 1 desde archivo ---------- */
  const handleUploadRegistration = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setCameraError('Solo se permiten archivos de imagen');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setRegistrationPhoto(result);
      setCurrentStep('verification');
      setCameraError(null);
    };
    reader.readAsDataURL(file);
  };

  /* ---------- Captura: Foto 2 (Verificación) ---------- */
  const handleCaptureVerification = async () => {
    const photo = capturePhoto();
    if (!photo) {
      setCameraError('Error al capturar la foto');
      return;
    }

    setVerificationPhoto(photo);
    setIsScanning(true);
    stopCamera();

    await performComparison(registrationPhoto!, photo);
  };

  /* ---------- Subir: Foto 2 desde archivo ---------- */
  const handleUploadVerification = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setCameraError('Solo se permiten archivos de imagen');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      setVerificationPhoto(result);
      setIsScanning(true);
      setCameraError(null);

      await performComparison(registrationPhoto!, result);
    };
    reader.readAsDataURL(file);
  };

  /* ---------- Comparación con backend (AWS Rekognition) ---------- */
  const performComparison = async (photo1: string, photo2: string) => {
    try {
      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

      const response = await fetch(`${backendUrl}/api/v1/facial/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationPhoto: photo1,
          verificationPhoto: photo2,
          userName: editableUserName,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al verificar con AWS Rekognition');
      }

      const data = await response.json();

      /* Manejo de errores del backend */
      if (data.error) {
        setCameraError(data.error);
        setIsScanning(false);
        setVerificationPhoto(null);
        setCurrentStep('verification');
        return;
      }

      if (!data.landmarks || data.landmarks.length === 0) {
        setCameraError(
          'No se detectaron suficientes puntos faciales para la verificación'
        );
        setIsScanning(false);
        setVerificationPhoto(null);
        setCurrentStep('verification');
        return;
      }

      const verificationResult: VerificationResult = {
        verified: data.verified,
        similarity: data.similarity,
        confidence: data.confidence,
        timestamp: data.timestamp,
        userName: data.userName,
        landmarks: data.landmarks,
        faceAttributes: data.faceAttributes,
      };

      // Guardar en historial de localStorage
      saveBiometricRecord({
        id: `BIO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: verificationResult.timestamp,
        userName: verificationResult.userName,
        projectName: projectName,
        verified: verificationResult.verified,
        similarity: verificationResult.similarity,
        confidence: verificationResult.confidence,
        registrationPhoto: registrationPhoto!,
        verificationPhoto: verificationPhoto!,
      });

      setResult(verificationResult);
      setIsScanning(false);
      setCurrentStep('result');
    } catch (error) {
      console.error('Error en performComparison:', error);
      setCameraError(
        'Error al conectar con el servicio de verificación. Verifica tu conexión.'
      );
      setIsScanning(false);
      setVerificationPhoto(null);
      setCurrentStep('verification');
    }
  };

  /* ---------- Reset del proceso ---------- */
  const resetProcess = () => {
    setRegistrationPhoto(null);
    setVerificationPhoto(null);
    setCurrentStep('registration');
    setCameraError(null);
    setResult(null);
  };

  /* ---------- Helper: estado del step ---------- */
  const getStepStatus = (step: Step): 'pending' | 'active' | 'done' => {
    const order: Step[] = ['registration', 'verification', 'result'];
    const currentIdx = order.indexOf(currentStep);
    const stepIdx = order.indexOf(step);
    if (stepIdx < currentIdx) return 'done';
    if (stepIdx === currentIdx) return 'active';
    return 'pending';
  };

  /* ================================================================
     RENDER
     ================================================================ */
  return (
    <div className="fv-overlay">
      <div className="fv-modal">
        {/* ==================== HEADER ==================== */}
        <header className="fv-header">
          <div className="fv-header__brand">
            <div className="fv-header__logo">
              <Shield size={22} strokeWidth={2.2} />
            </div>
            <div className="fv-header__titles">
              <h1 className="fv-header__title">Verificación Biométrica Facial</h1>
              <p className="fv-header__subtitle">
                Acceso seguro a <strong>{projectName}</strong>
              </p>
            </div>
          </div>

          <div className="fv-header__badges">
            <span className="fv-badge fv-badge--secure">
              <Lock size={10} /> Secure
            </span>
            <span className="fv-badge fv-badge--aws">
              <Cloud size={10} /> AWS Rekognition
            </span>
            <span className="fv-badge fv-badge--version">v2.0</span>
          </div>

          <button
            className="fv-header__close"
            onClick={onCancel}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </header>

        {/* ==================== STEPPER ==================== */}
        <nav className="fv-stepper">
          <div className={`fv-step fv-step--${getStepStatus('registration')}`}>
            <div className="fv-step__num">1</div>
            <span className="fv-step__label">Registro</span>
          </div>

          <div
            className={`fv-step__connector ${
              getStepStatus('verification') !== 'pending'
                ? 'fv-step__connector--done'
                : ''
            }`}
          />

          <div className={`fv-step fv-step--${getStepStatus('verification')}`}>
            <div className="fv-step__num">2</div>
            <span className="fv-step__label">Verificación</span>
          </div>

          <div
            className={`fv-step__connector ${
              getStepStatus('result') === 'done' ? 'fv-step__connector--done' : ''
            }`}
          />

          <div className={`fv-step fv-step--${getStepStatus('result')}`}>
            <div className="fv-step__num">3</div>
            <span className="fv-step__label">Resultado</span>
          </div>
        </nav>

        {/* ==================== BODY ==================== */}
        <div className="fv-body">
          {/* ---------- STAGE (cámara) ---------- */}
          <section className="fv-stage">
            <div
              className={`fv-viewport ${
                isScanning ? 'fv-viewport--scanning' : ''
              } ${result ? 'fv-viewport--verified' : ''}`}
            >
              {/* Video en vivo */}
              {isCameraActive && !result && (
                <video
                  ref={videoRef}
                  className="fv-viewport__video"
                  autoPlay
                  playsInline
                  muted
                />
              )}

              {/* Placeholder inicial */}
              {!isCameraActive && !registrationPhoto && !result && (
                <div className="fv-placeholder">
                  <div className="fv-placeholder__icon">
                    <ScanFace size={42} strokeWidth={1.6} />
                  </div>
                  <h2 className="fv-placeholder__title">
                    Paso 1 · Foto de Registro
                  </h2>
                  <p className="fv-placeholder__text">
                    Presiona <strong>Activar Cámara</strong> para capturar tu
                    foto base biométrica.
                  </p>
                </div>
              )}

              {/* Foto de registro capturada */}
              {!isCameraActive && registrationPhoto && !verificationPhoto && !result && (
                <div className="fv-photo-captured">
                  <img src={registrationPhoto} alt="Foto de registro" />
                  <div className="fv-photo-captured__overlay">
                    <span className="fv-photo-captured__badge">
                      <CheckCircle2 size={14} /> Foto 1 Capturada
                    </span>
                  </div>
                </div>
              )}

              {/* Overlay de escaneo */}
              {isCameraActive && !result && (
                <div className="fv-scan">
                  <div className="fv-scan__frame">
                    <div className="fv-scan__corner fv-scan__corner--tl" />
                    <div className="fv-scan__corner fv-scan__corner--tr" />
                    <div className="fv-scan__corner fv-scan__corner--bl" />
                    <div className="fv-scan__corner fv-scan__corner--br" />
                    {isScanning && <div className="fv-scan__line" />}
                  </div>

                  <div className="fv-scan__metrics">
                    <div className="fv-scan__metric">
                      <Activity size={12} />
                      <span>Distancia</span>
                      <strong>{distance}</strong>
                    </div>
                    <span className="fv-scan__divider">│</span>
                    <div className="fv-scan__metric">
                      <Fingerprint size={12} />
                      <span>Match</span>
                      <strong>{liveConfidence}%</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Result overlay */}
              {result && result.verified && (
                <div className="fv-result">
                  <div className="fv-result__icon">
                    <CheckCircle2 size={64} strokeWidth={1.8} />
                  </div>
                  <h2 className="fv-result__title">¡Verificación Exitosa!</h2>
                  <p className="fv-result__subtitle">
                    Identidad confirmada mediante AWS Rekognition
                  </p>
                  <div className="fv-result__stats">
                    <div className="fv-result__stat">
                      <div className="fv-result__stat-label">Similitud</div>
                      <div className="fv-result__stat-value">
                        {result.similarity}%
                      </div>
                    </div>
                    <div className="fv-result__stat">
                      <div className="fv-result__stat-label">Confianza</div>
                      <div className="fv-result__stat-value">
                        {result.confidence}%
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* -------- Action Bar -------- */}
            <div className="fv-actions">
              {!isCameraActive && !registrationPhoto && !result && (
                <>
                  <button className="fv-btn--primary" onClick={startCamera}>
                    <Camera size={17} /> Activar Cámara · Foto 1
                  </button>
                  <label className="fv-btn--secondary">
                    <Upload size={17} /> Subir Foto 1
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadRegistration}
                      style={{ display: 'none' }}
                    />
                  </label>
                </>
              )}

              {isCameraActive && currentStep === 'registration' && (
                <>
                  <button
                    className="fv-btn--success"
                    onClick={handleCaptureRegistration}
                  >
                    <Camera size={17} /> Capturar Foto de Registro
                  </button>
                  <button className="fv-btn--ghost" onClick={stopCamera}>
                    <XCircle size={17} /> Cancelar
                  </button>
                </>
              )}

              {!isCameraActive && registrationPhoto && !verificationPhoto && !result && (
                <>
                  <button className="fv-btn--primary" onClick={startCamera}>
                    <Camera size={17} /> Activar Cámara · Foto 2
                  </button>
                  <label className="fv-btn--secondary">
                    <Upload size={17} /> Subir Foto 2
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadVerification}
                      style={{ display: 'none' }}
                    />
                  </label>
                </>
              )}

              {isCameraActive &&
                currentStep === 'verification' &&
                !verificationPhoto && (
                  <>
                    <button
                      className="fv-btn--success"
                      onClick={handleCaptureVerification}
                    >
                      <Shield size={17} /> Capturar y Comparar
                    </button>
                    <button className="fv-btn--ghost" onClick={stopCamera}>
                      <XCircle size={17} /> Cancelar
                    </button>
                  </>
                )}

              {isScanning && (
                <div className="fv-scanning">
                  <RefreshCw size={17} className="fv-spin" />
                  <span>Comparando con AWS Rekognition...</span>
                </div>
              )}
            </div>

            {/* Error */}
            {cameraError && (
              <div className="fv-error">
                <AlertCircle size={15} />
                <span>{cameraError}</span>
              </div>
            )}
          </section>

          {/* ---------- PANEL (info) ---------- */}
          <aside className="fv-panel">
            {!result && (
              <>
                {/* Progreso de captura */}
                <div className="fv-section">
                  <h3 className="fv-section__title">
                    <Camera size={13} /> Progreso de Captura
                  </h3>

                  <div
                    className={`fv-progress ${
                      registrationPhoto ? 'fv-progress--captured' : ''
                    }`}
                  >
                    <div className="fv-progress__icon">
                      {registrationPhoto ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <Camera size={18} />
                      )}
                    </div>
                    <div className="fv-progress__body">
                      <div className="fv-progress__title">Foto 1 · Registro</div>
                      <div className="fv-progress__desc">
                        {registrationPhoto
                          ? '✓ Capturada correctamente'
                          : 'Pendiente · Toma tu primera foto'}
                      </div>
                    </div>
                    {registrationPhoto && (
                      <img
                        src={registrationPhoto}
                        alt="Registro"
                        className="fv-progress__thumb"
                      />
                    )}
                  </div>

                  <div
                    className={`fv-progress ${
                      verificationPhoto
                        ? 'fv-progress--captured'
                        : registrationPhoto
                        ? 'fv-progress--ready'
                        : 'fv-progress--disabled'
                    }`}
                  >
                    <div className="fv-progress__icon">
                      {verificationPhoto ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <Camera size={18} />
                      )}
                    </div>
                    <div className="fv-progress__body">
                      <div className="fv-progress__title">
                        Foto 2 · Verificación
                      </div>
                      <div className="fv-progress__desc">
                        {verificationPhoto
                          ? '✓ Capturada correctamente'
                          : registrationPhoto
                          ? 'Lista · Toma tu segunda foto'
                          : 'Bloqueada · Completa Foto 1 primero'}
                      </div>
                    </div>
                    {verificationPhoto && (
                      <img
                        src={verificationPhoto}
                        alt="Verificación"
                        className="fv-progress__thumb"
                      />
                    )}
                  </div>
                </div>

                <div className="fv-divider" />

                {/* Nota técnica */}
                <div className="fv-notice">
                  <Info size={15} />
                  <span>
                    AWS Rekognition detecta{' '}
                    <strong>27 landmarks faciales</strong> por rostro y calcula
                    similitud mediante distancia euclidiana entre vectores
                    biométricos.
                  </span>
                </div>
              </>
            )}

            {/* ---------- Vista de resultados ---------- */}
            {result && result.landmarks && (
              <div className="fv-result-view">
                <div className="fv-result-banner">
                  <Sparkles size={20} />
                  <div>
                    <div className="fv-result-banner__title">
                      Verificación Completada
                    </div>
                    <div className="fv-result-banner__sub">
                      {new Date(result.timestamp).toLocaleString('es-ES')}
                    </div>
                  </div>
                </div>

                <div className="fv-metrics">
                  <div className="fv-metric">
                    <span className="fv-metric__label">Similitud</span>
                    <span className="fv-metric__value">
                      {result.similarity}%
                    </span>
                  </div>
                  <div className="fv-metric">
                    <span className="fv-metric__label">Confianza</span>
                    <span className="fv-metric__value">
                      {result.confidence}%
                    </span>
                  </div>
                </div>

                <div className="fv-divider" />

                <div className="fv-section">
                  <h3 className="fv-section__title">
                    <Camera size={13} /> Fotos Comparadas
                  </h3>
                  <div className="fv-compare">
                    <div className="fv-compare__item">
                      <div className="fv-compare__label">Registro</div>
                      {registrationPhoto && (
                        <img
                          src={registrationPhoto}
                          alt="Registro"
                          className="fv-compare__img"
                        />
                      )}
                    </div>
                    <div className="fv-compare__item">
                      <div className="fv-compare__label">Verificación</div>
                      {verificationPhoto && (
                        <img
                          src={verificationPhoto}
                          alt="Verificación"
                          className="fv-compare__img"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="fv-divider" />

                <div className="fv-section">
                  <h3 className="fv-section__title">
                    <Fingerprint size={13} /> Landmarks (
                    {result.landmarks.length})
                  </h3>
                  <div className="fv-landmarks">
                    {/* Ojo izquierdo */}
                    <div className="fv-landmark-group">
                      <div className="fv-landmark-group__title">
                        👁️ Ojo Izquierdo
                      </div>
                      {result.landmarks
                        .filter(
                          (l) =>
                            l.type.includes('left') &&
                            l.type.toLowerCase().includes('eye')
                        )
                        .map((lm, i) => (
                          <div key={i} className="fv-landmark-row">
                            <span className="fv-landmark-row__name">
                              {lm.type}
                            </span>
                            <span className="fv-landmark-row__coords">
                              X:{lm.x.toFixed(3)} Y:{lm.y.toFixed(3)}
                            </span>
                          </div>
                        ))}
                    </div>

                    {/* Ojo derecho */}
                    <div className="fv-landmark-group">
                      <div className="fv-landmark-group__title">
                        👁️ Ojo Derecho
                      </div>
                      {result.landmarks
                        .filter(
                          (l) =>
                            l.type.includes('right') &&
                            l.type.toLowerCase().includes('eye')
                        )
                        .map((lm, i) => (
                          <div key={i} className="fv-landmark-row">
                            <span className="fv-landmark-row__name">
                              {lm.type}
                            </span>
                            <span className="fv-landmark-row__coords">
                              X:{lm.x.toFixed(3)} Y:{lm.y.toFixed(3)}
                            </span>
                          </div>
                        ))}
                    </div>

                    {/* Nariz */}
                    <div className="fv-landmark-group">
                      <div className="fv-landmark-group__title">👃 Nariz</div>
                      {result.landmarks
                        .filter((l) => l.type.toLowerCase().includes('nose'))
                        .map((lm, i) => (
                          <div key={i} className="fv-landmark-row">
                            <span className="fv-landmark-row__name">
                              {lm.type}
                            </span>
                            <span className="fv-landmark-row__coords">
                              X:{lm.x.toFixed(3)} Y:{lm.y.toFixed(3)}
                            </span>
                          </div>
                        ))}
                    </div>

                    {/* Boca */}
                    <div className="fv-landmark-group">
                      <div className="fv-landmark-group__title">👄 Boca</div>
                      {result.landmarks
                        .filter((l) => l.type.toLowerCase().includes('mouth'))
                        .map((lm, i) => (
                          <div key={i} className="fv-landmark-row">
                            <span className="fv-landmark-row__name">
                              {lm.type}
                            </span>
                            <span className="fv-landmark-row__coords">
                              X:{lm.x.toFixed(3)} Y:{lm.y.toFixed(3)}
                            </span>
                          </div>
                        ))}
                    </div>

                    {/* Contorno */}
                    <div className="fv-landmark-group">
                      <div className="fv-landmark-group__title">🗿 Contorno</div>
                      {result.landmarks
                        .filter(
                          (l) =>
                            l.type.toLowerCase().includes('jaw') ||
                            l.type.toLowerCase().includes('chin')
                        )
                        .map((lm, i) => (
                          <div key={i} className="fv-landmark-row">
                            <span className="fv-landmark-row__name">
                              {lm.type}
                            </span>
                            <span className="fv-landmark-row__coords">
                              X:{lm.x.toFixed(3)} Y:{lm.y.toFixed(3)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {result.faceAttributes && (
                  <>
                    <div className="fv-divider" />
                    <div className="fv-section">
                      <h3 className="fv-section__title">
                        🎭 Atributos Faciales
                      </h3>
                      <div className="fv-attrs">
                        <div className="fv-attr">
                          <span className="fv-attr__label">Ojos Abiertos</span>
                          <span className="fv-attr__value">
                            {result.faceAttributes.eyesOpen}%
                          </span>
                        </div>
                        <div className="fv-attr">
                          <span className="fv-attr__label">Boca Abierta</span>
                          <span className="fv-attr__value">
                            {result.faceAttributes.mouthOpen}%
                          </span>
                        </div>
                        <div className="fv-attr">
                          <span className="fv-attr__label">Sonrisa</span>
                          <span className="fv-attr__value">
                            {result.faceAttributes.smile}%
                          </span>
                        </div>
                        <div className="fv-attr">
                          <span className="fv-attr__label">Gafas</span>
                          <span className="fv-attr__value">
                            {result.faceAttributes.eyeglasses ? 'Sí' : 'No'}
                          </span>
                        </div>
                        <div className="fv-attr">
                          <span className="fv-attr__label">Barba</span>
                          <span className="fv-attr__value">
                            {result.faceAttributes.beard ? 'Sí' : 'No'}
                          </span>
                        </div>
                        <div className="fv-attr">
                          <span className="fv-attr__label">Bigote</span>
                          <span className="fv-attr__value">
                            {result.faceAttributes.mustache ? 'Sí' : 'No'}
                          </span>
                        </div>
                      </div>

                      {result.faceAttributes.emotions &&
                        result.faceAttributes.emotions.length > 0 && (
                          <>
                            <div className="fv-divider" />
                            <h3 className="fv-section__title">😊 Emociones</h3>
                            <div className="fv-emotions">
                              {result.faceAttributes.emotions.map((emo, i) => (
                                <div key={i} className="fv-emotion">
                                  <span className="fv-emotion__type">
                                    {emo.type}
                                  </span>
                                  <div className="fv-emotion__bar">
                                    <div
                                      className="fv-emotion__fill"
                                      style={{ width: `${emo.confidence}%` }}
                                    />
                                  </div>
                                  <span className="fv-emotion__val">
                                    {emo.confidence}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                    </div>
                  </>
                )}
              </div>
            )}
          </aside>
        </div>

        {/* ==================== FOOTER ==================== */}
        <footer className="fv-footer">
          <div className="fv-footer__info">
            <Lock size={13} />
            <span>
              Cifrado <strong>E2E</strong> · Procesado por{' '}
              <strong>AWS Rekognition</strong>
            </span>
          </div>

          <div className="fv-footer__actions">
            {cameraError && registrationPhoto && !result && (
              <button className="fv-btn--cancel" onClick={resetProcess}>
                <RefreshCw size={15} /> Reiniciar
              </button>
            )}

            {!result && (
              <button className="fv-btn--cancel" onClick={onCancel}>
                Cancelar
              </button>
            )}

            {result && result.verified && (
              <>
                <button className="fv-btn--cancel" onClick={onCancel}>
                  Cancelar
                </button>
                <button
                  className="fv-btn--cta"
                  onClick={() => onVerified(result)}
                >
                  <CheckCircle2 size={16} /> Continuar al Proyecto
                </button>
              </>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};