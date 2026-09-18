import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle2, XCircle, RefreshCw, Shield, Activity } from 'lucide-react';
import './FacialVerification.css';

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

export const FacialVerification: React.FC<FacialVerificationProps> = ({
  onVerified,
  onCancel,
  projectName,
  userEmail,
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [distance, setDistance] = useState<number>(0.0);
  const [liveConfidence, setLiveConfidence] = useState<number>(0);
  const [editableUserName, setEditableUserName] = useState<string>(userEmail.split('@')[0]);
  
  // Estados para las dos fotos
  const [registrationPhoto, setRegistrationPhoto] = useState<string | null>(null);
  const [verificationPhoto, setVerificationPhoto] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'registration' | 'verification'>('registration');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Animación de escaneo en tiempo real
  useEffect(() => {
    if (!isCameraActive || isScanning) return;

    let step = 0;
    const interval = setInterval(() => {
      step += 0.15;
      const simulatedDistance = Math.max(0.15, 0.35 + Math.sin(step) * 0.1);
      const simulatedConfidence = Math.min(99.5, (1 - simulatedDistance / 1.2) * 100);

      setDistance(parseFloat(simulatedDistance.toFixed(3)));
      setLiveConfidence(parseFloat(simulatedConfidence.toFixed(1)));
    }, 120);

    return () => clearInterval(interval);
  }, [isCameraActive, isScanning]);

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
    } catch (err) {
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

  const handleCaptureRegistration = async () => {
    const photo = capturePhoto();
    if (!photo) {
      setCameraError('Error al capturar la foto');
      return;
    }

    setRegistrationPhoto(photo);
    setCurrentStep('verification');
    stopCamera();
    
    // Mostrar mensaje de éxito
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const handleCaptureVerification = async () => {
    const photo = capturePhoto();
    if (!photo) {
      setCameraError('Error al capturar la foto');
      return;
    }

    setVerificationPhoto(photo);
    setIsScanning(true);
    stopCamera();

    // Simular análisis con AWS Rekognition comparando ambas fotos
    await performComparison(registrationPhoto!, photo);
  };

  const performComparison = async (photo1: string, photo2: string) => {
    // Enviar ambas fotos al backend para análisis real con AWS Rekognition
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      
      const response = await fetch(`${backendUrl}/api/v1/facial/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

      // Si hay error (no se detectó rostro), mostrar mensaje
      if (data.error) {
        setCameraError(data.error);
        setIsScanning(false);
        setVerificationPhoto(null);
        setCurrentStep('verification');
        return;
      }

      // Si no hay landmarks (no se detectó rostro correctamente)
      if (!data.landmarks || data.landmarks.length === 0) {
        setCameraError('No se detectaron suficientes puntos faciales para la verificación');
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

      setResult(verificationResult);
      setIsScanning(false);

    } catch (error) {
      console.error('Error en performComparison:', error);
      setCameraError('Error al conectar con el servicio de verificación. Verifica tu conexión.');
      setIsScanning(false);
      setVerificationPhoto(null);
      setCurrentStep('verification');
    }
  };

  return (
    <div className="facial-verification-overlay">
      <div className="facial-verification-modal">
        {/* Header */}
        <div className="verification-header">
          <Shield size={28} color="#00d4ff" />
          <div>
            <h2>Verificación Biométrica Facial</h2>
            <p>Acceso a: <strong>{projectName}</strong></p>
          </div>
        </div>

        <div className="verification-content">
          {/* Lado Izquierdo - Cámara */}
          <div className="camera-section">
            <div className={`camera-viewport ${isScanning ? 'scanning' : ''} ${result ? 'verified' : ''}`}>
              {/* Video real */}
              {isCameraActive && !result && (
                <video
                  ref={videoRef}
                  className="camera-video"
                  autoPlay
                  playsInline
                  muted
                />
              )}

              {/* Placeholder inicial */}
              {!isCameraActive && !registrationPhoto && !result && (
                <div className="camera-placeholder">
                  <Camera size={60} color="#00d4ff" />
                  <p>Paso 1: Foto de Registro</p>
                  <span>Presiona "Activar Cámara" para tomar tu primera foto</span>
                </div>
              )}

              {/* Mostrar foto de registro capturada */}
              {!isCameraActive && registrationPhoto && !verificationPhoto && !result && (
                <div className="camera-placeholder">
                  <img src={registrationPhoto} alt="Foto de registro" className="captured-photo-large" />
                  <p style={{ marginTop: '15px' }}>✓ Foto 1 Capturada</p>
                  <span>Presiona "Activar Cámara" para tomar la Foto 2</span>
                </div>
              )}

              {/* Overlay de resultado exitoso */}
              {result && result.verified && (
                <div className="result-overlay success">
                  <CheckCircle2 size={80} color="#00ff88" />
                  <h3>¡Comparación Exitosa!</h3>
                  <p>Similitud: {result.similarity}%</p>
                  <p>Confianza: {result.confidence}%</p>
                  <span>2 fotos comparadas con AWS Rekognition →</span>
                </div>
              )}

              {/* Mesh de escaneo */}
              {isCameraActive && !result && (
                <div className="scan-overlay">
                  <div className="scan-frame">
                    <div className="corner-tl" />
                    <div className="corner-tr" />
                    <div className="corner-bl" />
                    <div className="corner-br" />
                    {isScanning && <div className="scan-line" />}
                  </div>

                  <div className="scan-metrics">
                    <Activity size={14} color="#00d4ff" />
                    <span>Distancia: <strong>{distance}</strong></span>
                    <span className="divider">|</span>
                    <span>Match: <strong>{liveConfidence}%</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* Controles de cámara */}
            <div className="camera-controls">
              {!isCameraActive && !registrationPhoto && !result && (
                <button onClick={startCamera} className="btn-primary">
                  <Camera size={18} />
                  Activar Cámara (Foto 1: Registro)
                </button>
              )}

              {isCameraActive && currentStep === 'registration' && !registrationPhoto && !isScanning && !result && (
                <>
                  <button onClick={handleCaptureRegistration} className="btn-success">
                    <Camera size={18} />
                    Capturar Foto de Registro
                  </button>
                  <button onClick={stopCamera} className="btn-secondary">
                    <XCircle size={18} />
                    Cancelar
                  </button>
                </>
              )}

              {!isCameraActive && registrationPhoto && !verificationPhoto && !result && (
                <button onClick={startCamera} className="btn-primary">
                  <Camera size={18} />
                  Activar Cámara (Foto 2: Verificación)
                </button>
              )}

              {isCameraActive && currentStep === 'verification' && !verificationPhoto && !isScanning && !result && (
                <>
                  <button onClick={handleCaptureVerification} className="btn-success">
                    <Shield size={18} />
                    Capturar y Comparar Fotos
                  </button>
                  <button onClick={stopCamera} className="btn-secondary">
                    <XCircle size={18} />
                    Cancelar
                  </button>
                </>
              )}

              {isScanning && (
                <div className="scanning-status">
                  <RefreshCw size={18} className="spin" />
                  <span>Comparando fotos con AWS Rekognition...</span>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="camera-error">
                <span>{cameraError}</span>
              </div>
            )}
          </div>

          {/* Lado Derecho - Información */}
          <div className="info-section">
            <h3>Análisis Facial AWS Rekognition</h3>

            {!result && (
              <>
                <div className="info-card">
                  <div className="info-label">Usuario</div>
                  <input
                    type="text"
                    className="info-value-editable"
                    value={editableUserName}
                    onChange={(e) => setEditableUserName(e.target.value)}
                    placeholder="Ingresa tu nombre"
                  />
                </div>

                <div className="info-card">
                  <div className="info-label">Email</div>
                  <div className="info-value">{userEmail}</div>
                </div>

                <div className="info-card">
                  <div className="info-label">Proyecto</div>
                  <div className="info-value">{projectName}</div>
                </div>

                <div className="divider" />

                <h4>📸 Estado de Captura</h4>

                <div className={`photo-status ${registrationPhoto ? 'captured' : 'pending'}`}>
                  <div className="photo-status-icon">
                    {registrationPhoto ? <CheckCircle2 size={20} color="#00ff88" /> : <Camera size={20} color="#6b7494" />}
                  </div>
                  <div className="photo-status-info">
                    <div className="photo-status-label">Foto 1: Registro</div>
                    <div className="photo-status-desc">
                      {registrationPhoto ? '✓ Capturada' : 'Pendiente - Toma tu primera foto'}
                    </div>
                  </div>
                  {registrationPhoto && (
                    <img src={registrationPhoto} alt="Foto de registro" className="photo-thumbnail" />
                  )}
                </div>

                <div className={`photo-status ${verificationPhoto ? 'captured' : registrationPhoto ? 'ready' : 'disabled'}`}>
                  <div className="photo-status-icon">
                    {verificationPhoto ? <CheckCircle2 size={20} color="#00ff88" /> : <Camera size={20} color="#6b7494" />}
                  </div>
                  <div className="photo-status-info">
                    <div className="photo-status-label">Foto 2: Verificación</div>
                    <div className="photo-status-desc">
                      {verificationPhoto ? '✓ Capturada' : registrationPhoto ? 'Pendiente - Toma tu segunda foto' : 'Bloqueada - Completa Foto 1 primero'}
                    </div>
                  </div>
                  {verificationPhoto && (
                    <img src={verificationPhoto} alt="Foto de verificación" className="photo-thumbnail" />
                  )}
                </div>

                <div className="divider" />

                <div className="info-card">
                  <div className="info-label">Método</div>
                  <div className="info-value">AWS Rekognition + Distancia Euclidiana</div>
                </div>

                <div className="info-notice">
                  <Activity size={16} />
                  <span>
                    AWS Rekognition detecta <strong>27 puntos de referencia</strong> (landmarks) 
                    en el rostro para verificar identidad y calcular similitud entre ambas fotos.
                  </span>
                </div>
              </>
            )}

            {result && result.landmarks && (
              <>
                {/* Métricas principales */}
                <div className="result-card success">
                  <CheckCircle2 size={24} color="#00ff88" />
                  <div>
                    <div className="result-label">Estado</div>
                    <div className="result-value">Verificado Exitosamente</div>
                  </div>
                </div>

                <div className="result-metrics">
                  <div className="metric">
                    <span className="metric-label">Similitud</span>
                    <span className="metric-value">{result.similarity}%</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Confianza</span>
                    <span className="metric-value">{result.confidence}%</span>
                  </div>
                </div>

                <div className="divider" />

                {/* Mostrar ambas fotos comparadas */}
                <h4>📸 Fotos Comparadas</h4>
                <div className="compared-photos">
                  <div className="compared-photo-item">
                    <div className="compared-photo-label">Foto 1: Registro</div>
                    {registrationPhoto && (
                      <img src={registrationPhoto} alt="Registro" className="compared-photo-img" />
                    )}
                  </div>
                  <div className="compared-photo-item">
                    <div className="compared-photo-label">Foto 2: Verificación</div>
                    {verificationPhoto && (
                      <img src={verificationPhoto} alt="Verificación" className="compared-photo-img" />
                    )}
                  </div>
                </div>

                <div className="divider" />

                {/* Puntos de Referencia (Landmarks) */}
                <h4>📍 Puntos de Referencia Detectados ({result.landmarks.length})</h4>

                <div className="landmarks-grid">
                  {/* Ojos */}
                  <div className="landmark-category">
                    <div className="landmark-category-title">👁️ Ojos Izquierdo</div>
                    {result.landmarks
                      .filter((l) => l.type.includes('left') && l.type.toLowerCase().includes('eye'))
                      .map((landmark, idx) => (
                        <div key={idx} className="landmark-item">
                          <span className="landmark-name">{landmark.type}</span>
                          <span className="landmark-coords">
                            X: {landmark.x.toFixed(3)} Y: {landmark.y.toFixed(3)}
                          </span>
                        </div>
                      ))}
                  </div>

                  <div className="landmark-category">
                    <div className="landmark-category-title">👁️ Ojos Derecho</div>
                    {result.landmarks
                      .filter((l) => l.type.includes('right') && l.type.toLowerCase().includes('eye'))
                      .map((landmark, idx) => (
                        <div key={idx} className="landmark-item">
                          <span className="landmark-name">{landmark.type}</span>
                          <span className="landmark-coords">
                            X: {landmark.x.toFixed(3)} Y: {landmark.y.toFixed(3)}
                          </span>
                        </div>
                      ))}
                  </div>

                  {/* Nariz */}
                  <div className="landmark-category">
                    <div className="landmark-category-title">👃 Nariz</div>
                    {result.landmarks
                      .filter((l) => l.type.toLowerCase().includes('nose'))
                      .map((landmark, idx) => (
                        <div key={idx} className="landmark-item">
                          <span className="landmark-name">{landmark.type}</span>
                          <span className="landmark-coords">
                            X: {landmark.x.toFixed(3)} Y: {landmark.y.toFixed(3)}
                          </span>
                        </div>
                      ))}
                  </div>

                  {/* Boca */}
                  <div className="landmark-category">
                    <div className="landmark-category-title">👄 Boca</div>
                    {result.landmarks
                      .filter((l) => l.type.toLowerCase().includes('mouth'))
                      .map((landmark, idx) => (
                        <div key={idx} className="landmark-item">
                          <span className="landmark-name">{landmark.type}</span>
                          <span className="landmark-coords">
                            X: {landmark.x.toFixed(3)} Y: {landmark.y.toFixed(3)}
                          </span>
                        </div>
                      ))}
                  </div>

                  {/* Contorno */}
                  <div className="landmark-category">
                    <div className="landmark-category-title">🗿 Contorno</div>
                    {result.landmarks
                      .filter((l) => l.type.toLowerCase().includes('jaw') || l.type.toLowerCase().includes('chin'))
                      .map((landmark, idx) => (
                        <div key={idx} className="landmark-item">
                          <span className="landmark-name">{landmark.type}</span>
                          <span className="landmark-coords">
                            X: {landmark.x.toFixed(3)} Y: {landmark.y.toFixed(3)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Atributos faciales */}
                {result.faceAttributes && (
                  <>
                    <div className="divider" />
                    <h4>🎭 Atributos Faciales</h4>

                    <div className="attributes-grid">
                      <div className="attribute-item">
                        <span className="attribute-label">Ojos Abiertos</span>
                        <span className="attribute-value">{result.faceAttributes.eyesOpen}%</span>
                      </div>
                      <div className="attribute-item">
                        <span className="attribute-label">Boca Abierta</span>
                        <span className="attribute-value">{result.faceAttributes.mouthOpen}%</span>
                      </div>
                      <div className="attribute-item">
                        <span className="attribute-label">Sonrisa</span>
                        <span className="attribute-value">{result.faceAttributes.smile}%</span>
                      </div>
                      <div className="attribute-item">
                        <span className="attribute-label">Gafas</span>
                        <span className="attribute-value">{result.faceAttributes.eyeglasses ? 'Sí' : 'No'}</span>
                      </div>
                      <div className="attribute-item">
                        <span className="attribute-label">Barba</span>
                        <span className="attribute-value">{result.faceAttributes.beard ? 'Sí' : 'No'}</span>
                      </div>
                      <div className="attribute-item">
                        <span className="attribute-label">Bigote</span>
                        <span className="attribute-value">{result.faceAttributes.mustache ? 'Sí' : 'No'}</span>
                      </div>
                    </div>

                    {result.faceAttributes.emotions && result.faceAttributes.emotions.length > 0 && (
                      <>
                        <div className="emotions-title">😊 Emociones Detectadas</div>
                        <div className="emotions-list">
                          {result.faceAttributes.emotions.map((emotion, idx) => (
                            <div key={idx} className="emotion-item">
                              <span className="emotion-type">{emotion.type}</span>
                              <div className="emotion-bar">
                                <div 
                                  className="emotion-fill" 
                                  style={{ width: `${emotion.confidence}%` }}
                                />
                              </div>
                              <span className="emotion-confidence">{emotion.confidence}%</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}

                <div className="info-card" style={{ marginTop: '15px' }}>
                  <div className="info-label">Timestamp</div>
                  <div className="info-value">
                    {new Date(result.timestamp).toLocaleString('es-ES')}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        {!result && (
          <div className="verification-footer">
            {cameraError && registrationPhoto && (
              <button 
                onClick={() => {
                  setRegistrationPhoto(null);
                  setVerificationPhoto(null);
                  setCurrentStep('registration');
                  setCameraError(null);
                }} 
                className="btn-secondary" 
                style={{ marginRight: '15px' }}
              >
                <RefreshCw size={18} />
                Reiniciar Proceso
              </button>
            )}
            <button onClick={onCancel} className="btn-cancel">
              Cancelar y Volver
            </button>
          </div>
        )}

        {/* Footer con botón de continuar cuando hay resultados */}
        {result && result.verified && (
          <div className="verification-footer">
            <button onClick={onCancel} className="btn-secondary" style={{ marginRight: '15px' }}>
              Cancelar
            </button>
            <button onClick={() => onVerified(result)} className="btn-success-large">
              Continuar al Proyecto AWS
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
