import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Calendar, Clock, User, Shield, TrendingUp, Camera } from 'lucide-react';
import './BiometricHistory.css';

interface BiometricRecord {
  id: string;
  timestamp: string;
  userName: string;
  projectName: string;
  verified: boolean;
  similarity: number;
  confidence: number;
  registrationPhoto: string;
  verificationPhoto: string;
}

export const BiometricHistory: React.FC = () => {
  const [records, setRecords] = useState<BiometricRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<BiometricRecord | null>(null);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = () => {
    const stored = localStorage.getItem('hardcrm_biometric_history');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecords(parsed.sort((a: BiometricRecord, b: BiometricRecord) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
      } catch (error) {
        console.error('Error loading biometric history:', error);
      }
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const clearHistory = () => {
    if (confirm('¿Estás seguro de que deseas eliminar todo el historial de verificaciones?')) {
      localStorage.removeItem('hardcrm_biometric_history');
      setRecords([]);
      setSelectedRecord(null);
    }
  };

  return (
    <div className="biometric-history">
      {/* Header */}
      <div className="bh-header">
        <div className="bh-header-content">
          <div className="bh-header-icon">
            <Shield size={28} strokeWidth={2} />
          </div>
          <div>
            <h1 className="bh-title">Historial de Verificaciones Biométricas</h1>
            <p className="bh-subtitle">
              Registro completo de todas las verificaciones faciales realizadas con AWS Rekognition
            </p>
          </div>
        </div>
        
        {records.length > 0 && (
          <button onClick={clearHistory} className="bh-clear-btn">
            Limpiar Historial
          </button>
        )}
      </div>

      {/* Content */}
      <div className="bh-content">
        {/* Records List */}
        <div className="bh-list">
          <h2 className="bh-section-title">Registros de Verificación</h2>
          
          {records.length === 0 ? (
            <div className="bh-empty">
              <Shield size={48} strokeWidth={1.5} color="#6b7494" />
              <h3>Sin verificaciones aún</h3>
              <p>Las verificaciones faciales aparecerán aquí una vez que completes el proceso.</p>
            </div>
          ) : (
            <div className="bh-records">
              {records.map((record) => (
                <div
                  key={record.id}
                  className={`bh-record ${selectedRecord?.id === record.id ? 'bh-record--selected' : ''}`}
                  onClick={() => setSelectedRecord(record)}
                >
                  <div className="bh-record-photos">
                    <img src={record.registrationPhoto} alt="Foto 1" className="bh-record-photo" />
                    <img src={record.verificationPhoto} alt="Foto 2" className="bh-record-photo" />
                  </div>

                  <div className="bh-record-info">
                    <div className="bh-record-header">
                      <div className={`bh-record-status ${record.verified ? 'bh-record-status--verified' : 'bh-record-status--failed'}`}>
                        {record.verified ? (
                          <>
                            <CheckCircle2 size={14} />
                            <span>Verificado</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={14} />
                            <span>Rechazado</span>
                          </>
                        )}
                      </div>
                      <div className="bh-record-similarity">{record.similarity}%</div>
                    </div>

                    <div className="bh-record-meta">
                      <div className="bh-record-meta-item">
                        <TrendingUp size={12} />
                        <span>Similitud: {record.similarity}%</span>
                      </div>
                      <div className="bh-record-meta-item">
                        <Shield size={12} />
                        <span>Confianza: {record.confidence}%</span>
                      </div>
                      <div className="bh-record-meta-item">
                        <Calendar size={12} />
                        <span>{formatDate(record.timestamp)}</span>
                      </div>
                      <div className="bh-record-meta-item">
                        <Clock size={12} />
                        <span>{formatTime(record.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedRecord && (
          <div className="bh-detail">
            <h2 className="bh-section-title">Detalles de Verificación</h2>

            <div className="bh-detail-status">
              <div className={`bh-detail-badge ${selectedRecord.verified ? 'bh-detail-badge--verified' : 'bh-detail-badge--failed'}`}>
                {selectedRecord.verified ? (
                  <>
                    <CheckCircle2 size={24} />
                    <span>Verificación Exitosa</span>
                  </>
                ) : (
                  <>
                    <XCircle size={24} />
                    <span>Verificación Fallida</span>
                  </>
                )}
              </div>
            </div>

            <div className="bh-detail-photos">
              <div className="bh-detail-photo-card">
                <div className="bh-detail-photo-label">Foto 1: Registro</div>
                <img src={selectedRecord.registrationPhoto} alt="Registro" className="bh-detail-photo" />
              </div>
              <div className="bh-detail-photo-card">
                <div className="bh-detail-photo-label">Foto 2: Verificación</div>
                <img src={selectedRecord.verificationPhoto} alt="Verificación" className="bh-detail-photo" />
              </div>
            </div>

            <div className="bh-detail-metrics">
              <div className="bh-detail-metric">
                <div className="bh-detail-metric-label">Similitud</div>
                <div className="bh-detail-metric-value" style={{ color: selectedRecord.similarity >= 85 ? '#00ff88' : '#ef4444' }}>
                  {selectedRecord.similarity}%
                </div>
                <div className="bh-detail-metric-bar">
                  <div 
                    className="bh-detail-metric-fill"
                    style={{ 
                      width: `${selectedRecord.similarity}%`,
                      background: selectedRecord.similarity >= 85 ? '#00ff88' : '#ef4444'
                    }}
                  />
                </div>
              </div>

              <div className="bh-detail-metric">
                <div className="bh-detail-metric-label">Confianza</div>
                <div className="bh-detail-metric-value" style={{ color: '#00d4ff' }}>
                  {selectedRecord.confidence}%
                </div>
                <div className="bh-detail-metric-bar">
                  <div 
                    className="bh-detail-metric-fill"
                    style={{ 
                      width: `${selectedRecord.confidence}%`,
                      background: '#00d4ff'
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="bh-detail-info">
              <div className="bh-detail-info-item">
                <div className="bh-detail-info-label">
                  <User size={14} />
                  Usuario
                </div>
                <div className="bh-detail-info-value">{selectedRecord.userName}</div>
              </div>

              <div className="bh-detail-info-item">
                <div className="bh-detail-info-label">
                  <Shield size={14} />
                  Proyecto
                </div>
                <div className="bh-detail-info-value">{selectedRecord.projectName}</div>
              </div>

              <div className="bh-detail-info-item">
                <div className="bh-detail-info-label">
                  <Calendar size={14} />
                  Fecha
                </div>
                <div className="bh-detail-info-value">{formatDate(selectedRecord.timestamp)}</div>
              </div>

              <div className="bh-detail-info-item">
                <div className="bh-detail-info-label">
                  <Clock size={14} />
                  Hora
                </div>
                <div className="bh-detail-info-value">{formatTime(selectedRecord.timestamp)}</div>
              </div>
            </div>

            <div className="bh-detail-footer">
              <div className="bh-detail-footer-label">ID de Verificación</div>
              <div className="bh-detail-footer-value">{selectedRecord.id}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
