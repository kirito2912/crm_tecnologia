import type {
  Documento,
  DocumentoCreatePayload,
  DocumentoUpdatePayload,
} from '../types/documento';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export async function fetchDocumentosApi(params?: {
  tipo?: string;
  categoria?: string;
  usuario_rol?: string;
  search?: string;
}): Promise<Documento[]> {
  try {
    const url = new URL(`${API_BASE_URL}/documentos/`);
    if (params?.tipo) url.searchParams.append('tipo', params.tipo);
    if (params?.categoria) url.searchParams.append('categoria', params.categoria);
    if (params?.usuario_rol) url.searchParams.append('usuario_rol', params.usuario_rol);
    if (params?.search) url.searchParams.append('search', params.search);

    const res = await fetch(url.toString(), {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Fallback a almacenamiento local para documentos:', err);
    return [];
  }
}

export async function createDocumentoApi(
  payload: DocumentoCreatePayload
): Promise<Documento> {
  const res = await fetch(`${API_BASE_URL}/documentos/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Error al registrar el documento en el backend');
  }
  return await res.json();
}

export async function uploadDocumentoFileApi(
  file: File,
  meta: {
    categoria?: string;
    descripcion?: string;
    subido_por?: string;
    usuario_id?: string;
    usuario_rol?: string;
    tags?: string[];
    destinatarios_roles?: string[];
  }
): Promise<Documento> {
  const formData = new FormData();
  formData.append('file', file);
  if (meta.categoria) formData.append('categoria', meta.categoria);
  if (meta.descripcion) formData.append('descripcion', meta.descripcion);
  if (meta.subido_por) formData.append('subido_por', meta.subido_por);
  if (meta.usuario_id) formData.append('usuario_id', meta.usuario_id);
  if (meta.usuario_rol) formData.append('usuario_rol', meta.usuario_rol);
  if (meta.tags && meta.tags.length > 0) formData.append('tags', JSON.stringify(meta.tags));
  if (meta.destinatarios_roles && meta.destinatarios_roles.length > 0)
    formData.append('destinatarios_roles', JSON.stringify(meta.destinatarios_roles));

  const res = await fetch(`${API_BASE_URL}/documentos/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Error al subir el archivo al servidor');
  }
  return await res.json();
}

export async function updateDocumentoApi(
  id: string,
  payload: DocumentoUpdatePayload
): Promise<Documento> {
  const res = await fetch(`${API_BASE_URL}/documentos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Error al actualizar datos del documento');
  }
  return await res.json();
}

export async function deleteDocumentoApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/documentos/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Error al eliminar el documento');
  }
}
