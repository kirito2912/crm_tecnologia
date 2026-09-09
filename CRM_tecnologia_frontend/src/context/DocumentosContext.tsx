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

const DocumentosContext = createContext<DocumentosContextType | undefined>(undefined);

export const DocumentosProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Solo actualiza el estado en memoria — sin localStorage
  const setDocs = (updated: Documento[]) => {
    setDocumentos(updated);
  };

  const fetchDocumentos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const remote = await fetchDocumentosApi();
      setDocs(Array.isArray(remote) ? remote : []);
    } catch (err: any) {
      setError('No se pudo conectar al servidor. Verifica que el backend esté activo.');
      setDocs([]);
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
    const currentUserName = user?.name || 'Usuario';
    const currentUserId = user?.id || '';

    try {
      const destinatarios = meta.destinatarios_roles && meta.destinatarios_roles.length > 0
        ? meta.destinatarios_roles
        : ['todos'];

      const createdDoc = await uploadDocumentoFileApi(file, {
        categoria: meta.categoria || 'General',
        descripcion: meta.descripcion,
        subido_por: currentUserName,
        usuario_id: currentUserId,
        usuario_rol: currentUserRole.includes('admin') ? 'administrador' : 'analista',
        tags: meta.tags,
        destinatarios_roles: destinatarios,
      });

      setDocs([createdDoc, ...documentos]);
      return { success: true, documento: createdDoc };
    } catch (err: any) {
      const msg = err?.message || 'Error al subir el archivo al servidor';
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
      const created = await createDocumentoApi(payload);
      setDocs([created, ...documentos]);
      return { success: true, documento: created };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error al crear documento en el servidor' };
    }
  };

  const updateDocumento = async (
    id: string,
    payload: DocumentoUpdatePayload
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await updateDocumentoApi(id, payload);
      // Refrescar desde backend para tener datos reales
      await fetchDocumentos();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error al actualizar documento' };
    }
  };

  const deleteDocumento = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await deleteDocumentoApi(id);
      // Remover del estado local solo si el backend confirmó la eliminación
      setDocs(documentos.filter((d) => d.id !== id));
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Error al eliminar el documento del servidor';
      return { success: false, error: msg };
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

  // Mantiene la firma para no romper componentes que la usen
  const generateSampleDocuments = async () => {
    await fetchDocumentos();
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