export type DocumentoTipo = 'pdf' | 'word' | 'docx' | 'doc' | 'rtf' | 'odt' | 'otro';

export type DocumentoCategoria =
  | 'Contratos'
  | 'Reportes Ejecutivos'
  | 'Propuestas Comerciales'
  | 'Especificaciones Técnicas'
  | 'Financiero'
  | 'Auditoría'
  | 'General';

export interface Documento {
  id: string;
  nombre: string;
  tipo: DocumentoTipo | string;
  tamanio: string;
  tamanio_bytes: number;
  categoria: DocumentoCategoria | string;
  descripcion?: string | null;
  archivo_url?: string | null;
  archivo_base64?: string | null;
  subido_por: string;
  usuario_id?: string | null;
  usuario_rol: 'analista' | 'administrador' | string;
  tags_json?: string[] | null;
  /** Roles que pueden ver este documento. ["todos"] o subconjunto de los roles del sistema. */
  destinatarios_roles?: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentoCreatePayload {
  nombre: string;
  tipo: DocumentoTipo | string;
  tamanio: string;
  tamanio_bytes?: number;
  categoria?: DocumentoCategoria | string;
  descripcion?: string;
  archivo_url?: string;
  archivo_base64?: string;
  subido_por: string;
  usuario_id?: string;
  usuario_rol?: 'analista' | 'administrador' | string;
  tags_json?: string[];
  destinatarios_roles?: string[];
}

export interface DocumentoUpdatePayload {
  nombre?: string;
  categoria?: DocumentoCategoria | string;
  descripcion?: string;
  tags_json?: string[];
}

export interface DocumentosContextType {
  documentos: Documento[];
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  fetchDocumentos: () => Promise<void>;
  uploadDocumentoFile: (
    file: File,
    meta: {
      categoria?: DocumentoCategoria | string;
      descripcion?: string;
      tags?: string[];
      destinatarios_roles?: string[];
    }
  ) => Promise<{ success: boolean; documento?: Documento; error?: string }>;
  createDocumentoDirect: (
    payload: DocumentoCreatePayload
  ) => Promise<{ success: boolean; documento?: Documento; error?: string }>;
  updateDocumento: (
    id: string,
    payload: DocumentoUpdatePayload
  ) => Promise<{ success: boolean; error?: string }>;
  deleteDocumento: (id: string) => Promise<{ success: boolean; error?: string }>;
  downloadDocumento: (doc: Documento) => void;
  generateSampleDocuments: () => void;
}
