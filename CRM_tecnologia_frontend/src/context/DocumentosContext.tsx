import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type {
  Documento,
  DocumentoCategoria,
  DocumentoCreatePayload,
  DocumentoUpdatePayload,
  DocumentosContextType,
} from '../types/documento';
import { useAuth } from './AuthContext';
import {
  fetchDocumentosApi,
  createDocumentoApi,
  uploadDocumentoFileApi,
  updateDocumentoApi,
  deleteDocumentoApi,
} from '../services/documentosApi';

const STORAGE_KEY = 'hardcrm_documentos_v1';

export const INITIAL_DEFAULT_DOCUMENTOS: Documento[] = [
  {
    id: 'DOC-2026-001',
    nombre: 'Contrato Marco de Suministro Tecnológico 2026 - Alfa Corp.pdf',
    tipo: 'pdf',
    tamanio: '2.84 MB',
    tamanio_bytes: 2977955,
    categoria: 'Contratos',
    descripcion:
      'Acuerdo legal de provisión mayorista de hardware Dell PowerEdge y switches Cisco con condiciones de pago a 60 días y penalidades por retraso.',
    subido_por: 'Jane Doe',
    usuario_id: 'USR-ADMIN',
    usuario_rol: 'administrador',
    tags_json: ['contrato', 'legal', 'alfa corp', 'hardware'],
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    id: 'DOC-2026-002',
    nombre: 'Especificaciones Técnicas y SLA de Servidores Enterprise.docx',
    tipo: 'docx',
    tamanio: '1.45 MB',
    tamanio_bytes: 1520435,
    categoria: 'Especificaciones Técnicas',
    descripcion:
      'Requisitos de arquitectura, memoria ECC, redundancia de fuentes de poder y tiempos de respuesta 24/7 para despliegue de infraestructura crítica.',
    subido_por: 'Carlos Mendoza',
    usuario_id: 'USR-ANALISTA',
    usuario_rol: 'analista',
    tags_json: ['hardware', 'sla', 'servidores', 'datacenter'],
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'DOC-2026-003',
    nombre: 'Informe Ejecutivo de Auditoría y Precios Competitivos Q3.pdf',
    tipo: 'pdf',
    tamanio: '3.12 MB',
    tamanio_bytes: 3271557,
    categoria: 'Reportes Ejecutivos',
    descripcion:
      'Dossier con gráficos de dispersión de precios de mercado, márgenes brutos por línea de producto y comparativa de volumen contra Empresa Beta.',
    subido_por: 'Carlos Mendoza',
    usuario_id: 'USR-ANALISTA',
    usuario_rol: 'analista',
    tags_json: ['auditoria', 'q3', 'precios', 'competencia'],
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: 'DOC-2026-004',
    nombre: 'Propuesta Comercial y Cotización Licitación Hardware.docx',
    tipo: 'docx',
    tamanio: '980 KB',
    tamanio_bytes: 1003520,
    categoria: 'Propuestas Comerciales',
    descripcion:
      'Pliego de cotización para licitación corporativa de 80 Workstations Lenovo ThinkPad P16 y 20 Monitores Dell 4K con descuento por volumen.',
    subido_por: 'Jane Doe',
    usuario_id: 'USR-ADMIN',
    usuario_rol: 'administrador',
    tags_json: ['licitacion', 'propuesta', 'ventas', 'b2b'],
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

const DocumentosContext = createContext<DocumentosContextType | undefined>(undefined);

export const DocumentosProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [documentos, setDocumentos] = useState<Documento[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_DEFAULT_DOCUMENTOS;
    } catch {
      return INITIAL_DEFAULT_DOCUMENTOS;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const persist = (updated: Documento[]) => {
    setDocumentos(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error al guardar documentos en localStorage:', e);
    }
  };

  const fetchDocumentos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const remote = await fetchDocumentosApi();
      if (remote && remote.length > 0) {
        persist(remote);
      }
    } catch (err) {
      console.warn('Usando documentos locales/localStorage:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocumentos();
  }, [fetchDocumentos]);

  // Subir archivo real (PDF, DOCX, DOC)
  const uploadDocumentoFile = async (
    file: File,
    meta: {
      categoria?: DocumentoCategoria | string;
      descripcion?: string;
      tags?: string[];
      destinatarios_roles?: string[];
    }
  ): Promise<{ success: boolean; documento?: Documento; error?: string }> => {
    setIsUploading(true);
    setError(null);

    const currentUserRole = (user?.role || 'analista').toLowerCase();
    const currentUserName = user?.name || (currentUserRole.includes('admin') ? 'Jane Doe' : 'Carlos Mendoza');
    const currentUserId = user?.id || (currentUserRole.includes('admin') ? 'USR-ADMIN' : 'USR-ANALISTA');

    try {
      // 1. Convertir a base64 para respaldo cliente
      const b64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'documento';
      let docTipo = 'documento';
      if (fileExtension === 'pdf') docTipo = 'pdf';
      else if (['doc', 'docx', 'rtf', 'odt'].includes(fileExtension)) docTipo = 'docx';

      const formatSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
      };

      const destinatarios = meta.destinatarios_roles && meta.destinatarios_roles.length > 0
        ? meta.destinatarios_roles
        : ['todos'];

      let createdDoc: Documento;

      try {
        createdDoc = await uploadDocumentoFileApi(file, {
          categoria: meta.categoria || 'General',
          descripcion: meta.descripcion,
          subido_por: currentUserName,
          usuario_id: currentUserId,
          usuario_rol: currentUserRole.includes('admin') ? 'administrador' : 'analista',
          tags: meta.tags,
          destinatarios_roles: destinatarios,
        });
      } catch (remoteErr) {
        console.warn('Backend upload no disponible, guardando localmente con base64:', remoteErr);
        createdDoc = {
          id: `DOC-${Date.now().toString(36).toUpperCase()}`,
          nombre: file.name,
          tipo: docTipo,
          tamanio: formatSize(file.size),
          tamanio_bytes: file.size,
          categoria: meta.categoria || 'General',
          descripcion: meta.descripcion || 'Documento cargado desde el panel de usuario.',
          archivo_base64: b64,
          subido_por: currentUserName,
          usuario_id: currentUserId,
          usuario_rol: currentUserRole.includes('admin') ? 'administrador' : 'analista',
          tags_json: meta.tags || ['documento', docTipo],
          destinatarios_roles: destinatarios,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      const updated = [createdDoc, ...documentos];
      persist(updated);
      return { success: true, documento: createdDoc };
    } catch (err: any) {
      const msg = err?.message || 'Error al procesar el archivo';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsUploading(false);
    }
  };

  const createDocumentoDirect = async (
    payload: DocumentoCreatePayload
  ): Promise<{ success: boolean; documento?: Documento; error?: string }> => {
    try {
      let created: Documento;
      try {
        created = await createDocumentoApi(payload);
      } catch {
        created = {
          id: `DOC-${Date.now().toString(36).toUpperCase()}`,
          nombre: payload.nombre,
          tipo: payload.tipo,
          tamanio: payload.tamanio,
          tamanio_bytes: payload.tamanio_bytes || 1024 * 500,
          categoria: payload.categoria || 'General',
          descripcion: payload.descripcion,
          archivo_url: payload.archivo_url,
          archivo_base64: payload.archivo_base64,
          subido_por: payload.subido_por,
          usuario_id: payload.usuario_id,
          usuario_rol: payload.usuario_rol || 'analista',
          tags_json: payload.tags_json || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      const updated = [created, ...documentos];
      persist(updated);
      return { success: true, documento: created };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error al crear documento' };
    }
  };

  const updateDocumento = async (
    id: string,
    payload: DocumentoUpdatePayload
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      try {
        await updateDocumentoApi(id, payload);
      } catch (e) {
        console.warn('Actualización remota falló, guardando localmente:', e);
      }

      const updated = documentos.map((d) =>
        d.id === id
          ? {
              ...d,
              nombre: payload.nombre ?? d.nombre,
              categoria: payload.categoria ?? d.categoria,
              descripcion: payload.descripcion ?? d.descripcion,
              tags_json: payload.tags_json ?? d.tags_json,
              updated_at: new Date().toISOString(),
            }
          : d
      );
      persist(updated);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error al actualizar documento' };
    }
  };

  const deleteDocumento = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      try {
        await deleteDocumentoApi(id);
      } catch (e) {
        console.warn('Eliminación remota falló, eliminando localmente:', e);
      }
      const updated = documentos.filter((d) => d.id !== id);
      persist(updated);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error al eliminar documento' };
    }
  };

  const downloadDocumento = (doc: Documento) => {
    if (doc.archivo_base64) {
      const a = document.createElement('a');
      a.href = doc.archivo_base64;
      a.download = doc.nombre;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    if (doc.archivo_url) {
      const a = document.createElement('a');
      a.href = doc.archivo_url;
      a.download = doc.nombre;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // Fallback: descargar archivo de texto/muestra estructurado
    const textContent = `=====================================================
DATATECH ANALYTICS - REPOSITORIO CORPORATIVO DE DOCUMENTOS
=====================================================

Documento: ${doc.nombre}
ID: ${doc.id}
Tipo: ${doc.tipo.toUpperCase()}
Categoría: ${doc.categoria}
Subido por: ${doc.subido_por} (${doc.usuario_rol.toUpperCase()})
Fecha de Carga: ${new Date(doc.created_at).toLocaleString()}
Tamaño: ${doc.tamanio}
Etiquetas: ${doc.tags_json?.join(', ') || 'Sin etiquetas'}

DESCRIPCIÓN Y CONTENIDO:
-----------------------------------------------------
${doc.descripcion || 'Sin descripción detallada disponible.'}

=====================================================
Documento seguro generado por DataTech Analytics CRM
=====================================================`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.nombre.endsWith('.txt') ? doc.nombre : `${doc.nombre}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateSampleDocuments = () => {
    persist(INITIAL_DEFAULT_DOCUMENTOS);
  };

  return (
    <DocumentosContext.Provider
      value={{
        documentos,
        isLoading,
        isUploading,
        error,
        fetchDocumentos,
        uploadDocumentoFile,
        createDocumentoDirect,
        updateDocumento,
        deleteDocumento,
        downloadDocumento,
        generateSampleDocuments,
      }}
    >
      {children}
    </DocumentosContext.Provider>
  );
};

export const useDocumentos = (): DocumentosContextType => {
  const ctx = useContext(DocumentosContext);
  if (!ctx) throw new Error('useDocumentos debe usarse dentro de DocumentosProvider');
  return ctx;
};
