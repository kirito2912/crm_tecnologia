import React, { useState, useRef, useMemo } from 'react';
import {
  UploadCloud,
  FileText,
  FileCode,
  Search,
  Filter,
  RefreshCw,
  Plus,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  List,
  FolderPlus,
  Sparkles,
  Download,
  Eye,
  Trash2,
  Tag,
  User,
  Shield,
  Layers,
  X,
} from 'lucide-react';
import { useDocumentos } from '../../context/DocumentosContext';
import { useAuth } from '../../context/AuthContext';
import { DocumentCard } from './DocumentCard';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import type { Documento, DocumentoCategoria } from '../../types/documento';

interface DocumentosViewProps {
  searchQuery?: string;
}

export const DocumentosView: React.FC<DocumentosViewProps> = ({ searchQuery = '' }) => {
  const {
    documentos,
    isLoading,
    isUploading,
    uploadDocumentoFile,
    deleteDocumento,
    downloadDocumento,
    fetchDocumentos,
    generateSampleDocuments,
  } = useDocumentos();

  const { user } = useAuth();
  const role = (user?.role || 'analista').toLowerCase();
  const isAdmin = role.includes('admin');

  // Filtros locales
  const [localSearch, setLocalSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'todos' | 'pdf' | 'word'>('todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');
  const [roleFilter, setRoleFilter] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Estado del Drag & Drop
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Formulario de Carga
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formCategory, setFormCategory] = useState<DocumentoCategoria>('General');
  const [formDescription, setFormDescription] = useState('');
  const [formTags, setFormTags] = useState('');

  // Modal de Vista Previa
  const [previewDoc, setPreviewDoc] = useState<Documento | null>(null);

  // Modal de Confirmación de Borrado
  const [docToDelete, setDocToDelete] = useState<Documento | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // ── Estadísticas y KPIs ───────────────────────────────────────────────
  const kpiTotal = documentos.length;
  const kpiPdf = documentos.filter((d) => d.tipo.toLowerCase().includes('pdf')).length;
  const kpiWord = documentos.filter(
    (d) =>
      d.tipo.toLowerCase().includes('doc') ||
      d.tipo.toLowerCase().includes('word') ||
      d.tipo.toLowerCase().includes('docx')
  ).length;

  const totalBytes = documentos.reduce((acc, curr) => acc + (curr.tamanio_bytes || 0), 0);
  const formatTotalStorage = (bytes: number): string => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const kpiAdminDocs = documentos.filter((d) =>
    d.usuario_rol.toLowerCase().includes('admin')
  ).length;
  const kpiAnalistaDocs = documentos.filter((d) =>
    d.usuario_rol.toLowerCase().includes('analista')
  ).length;

  // ── Categorías Únicas ────────────────────────────────────────────────
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    documentos.forEach((d) => {
      if (d.categoria) set.add(d.categoria);
    });
    return Array.from(set);
  }, [documentos]);

  // ── Filtrado ─────────────────────────────────────────────────────────
  const filteredDocs = useMemo(() => {
    let list = documentos;

    // Filtro por tipo
    if (typeFilter === 'pdf') {
      list = list.filter((d) => d.tipo.toLowerCase().includes('pdf'));
    } else if (typeFilter === 'word') {
      list = list.filter(
        (d) =>
          d.tipo.toLowerCase().includes('doc') ||
          d.tipo.toLowerCase().includes('word') ||
          d.tipo.toLowerCase().includes('docx')
      );
    }

    // Filtro por categoría
    if (categoryFilter !== 'todos') {
      list = list.filter((d) => d.categoria === categoryFilter);
    }

    // Filtro por rol
    if (roleFilter !== 'todos') {
      list = list.filter((d) => d.usuario_rol.toLowerCase().includes(roleFilter));
    }

    // Buscador general (prop searchQuery o input local)
    const q = (searchQuery || localSearch).toLowerCase().trim();
    if (q) {
      list = list.filter(
        (d) =>
          d.nombre.toLowerCase().includes(q) ||
          (d.descripcion && d.descripcion.toLowerCase().includes(q)) ||
          d.categoria.toLowerCase().includes(q) ||
          d.subido_por.toLowerCase().includes(q) ||
          (d.tags_json && d.tags_json.some((t) => t.toLowerCase().includes(q)))
      );
    }

    return list;
  }, [documentos, typeFilter, categoryFilter, roleFilter, searchQuery, localSearch]);

  // ── Procesar archivo para subida ─────────────────────────────────────
  const validateAndPrepareFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExts = ['pdf', 'docx', 'doc', 'rtf', 'odt'];
    if (!ext || !validExts.includes(ext)) {
      setUploadError(
        'Formato no permitido. Solo se aceptan archivos PDF (.pdf) y documentos Word (.docx, .doc, .rtf).'
      );
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setUploadError('El archivo supera el tamaño máximo permitido de 50 MB.');
      return;
    }

    setUploadError(null);
    setSelectedFile(file);
    setShowUploadModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndPrepareFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndPrepareFile(file);
  };

  const handleConfirmUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    const tagsArray = formTags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const res = await uploadDocumentoFile(selectedFile, {
      categoria: formCategory,
      descripcion: formDescription,
      tags: tagsArray,
    });

    if (res.success) {
      setUploadSuccess(`¡Documento "${selectedFile.name}" subido y compartido exitosamente!`);
      setTimeout(() => setUploadSuccess(null), 4000);
      setShowUploadModal(false);
      setSelectedFile(null);
      setFormDescription('');
      setFormTags('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      setUploadError(res.error || 'Error al subir documento');
    }
  };

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    await deleteDocumento(docToDelete.id);
    setDocToDelete(null);
  };

  return (
    <div className="documentos-view">
      {/* ── Encabezado Principal ── */}
      <div className="documentos-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2>Documentos Word y PDF</h2>
            <span className="doc-sync-pill">
              <CheckCircle2 size={12} /> Repositorio Compartido
            </span>
          </div>
          <p>
            Almacena, gestiona y comparte contratos, especificaciones y reportes en formato Word y PDF
            accesibles para todas las vistas y roles.
          </p>
        </div>

        <div className="documentos-header-actions">
          <button
            type="button"
            className="doc-btn-upload-trigger"
            onClick={() => {
              setSelectedFile(null);
              setShowUploadModal(true);
            }}
          >
            <Plus size={16} />
            <span>Subir Documento</span>
          </button>

          <button
            type="button"
            className="admin-refresh-btn"
            onClick={() => fetchDocumentos()}
            title="Sincronizar repositorio"
          >
            <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
            Sincronizar
          </button>
        </div>
      </div>

      {/* ── Tarjetas de Métricas y KPIs ── */}
      <div className="doc-kpis-grid">
        <div className="doc-kpi-card">
          <div className="doc-kpi-icon-box" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Layers size={22} />
          </div>
          <div className="doc-kpi-details">
            <span className="doc-kpi-label">Total Documentos</span>
            <span className="doc-kpi-value">{kpiTotal}</span>
            <span className="doc-kpi-sub">Archivos en el repositorio</span>
          </div>
        </div>

        <div className="doc-kpi-card">
          <div className="doc-kpi-icon-box" style={{ background: '#fef2f2', color: '#dc2626' }}>
            <FileText size={22} />
          </div>
          <div className="doc-kpi-details">
            <span className="doc-kpi-label">Documentos PDF</span>
            <span className="doc-kpi-value" style={{ color: '#dc2626' }}>
              {kpiPdf}
            </span>
            <span className="doc-kpi-sub">Informes y contratos .pdf</span>
          </div>
        </div>

        <div className="doc-kpi-card">
          <div className="doc-kpi-icon-box" style={{ background: '#eef2ff', color: '#4f46e5' }}>
            <FileCode size={22} />
          </div>
          <div className="doc-kpi-details">
            <span className="doc-kpi-label">Documentos Word</span>
            <span className="doc-kpi-value" style={{ color: '#4f46e5' }}>
              {kpiWord}
            </span>
            <span className="doc-kpi-sub">Archivos .docx y .doc</span>
          </div>
        </div>

        <div className="doc-kpi-card">
          <div className="doc-kpi-icon-box" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <HardDrive size={22} />
          </div>
          <div className="doc-kpi-details">
            <span className="doc-kpi-label">Almacenamiento Total</span>
            <span className="doc-kpi-value">{formatTotalStorage(totalBytes)}</span>
            <span className="doc-kpi-sub">
              Admin: {kpiAdminDocs} · Analistas: {kpiAnalistaDocs}
            </span>
          </div>
        </div>
      </div>

      {/* ── Avisos de éxito / error ── */}
      {uploadSuccess && (
        <div className="doc-alert doc-alert--success">
          <CheckCircle2 size={16} />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {uploadError && (
        <div className="doc-alert doc-alert--error">
          <AlertCircle size={16} />
          <span>{uploadError}</span>
        </div>
      )}

      {/* ── Zona de Carga Rápida (Drag and Drop) ── */}
      <div
        className={`doc-dropzone ${isDragging ? 'doc-dropzone--active' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.rtf,.odt"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <div className="doc-dropzone-icon-row">
          <div className="doc-drop-badge doc-drop-badge--pdf">
            <FileText size={20} />
            <span>PDF</span>
          </div>
          <UploadCloud size={38} className="doc-dropzone-center-icon" />
          <div className="doc-drop-badge doc-drop-badge--word">
            <FileCode size={20} />
            <span>WORD (.DOCX)</span>
          </div>
        </div>

        <p className="doc-dropzone-title">
          {isDragging
            ? 'Suelta el documento PDF o Word aquí'
            : 'Arrastra y suelta documentos PDF o Word (.docx, .doc) aquí'}
        </p>
        <p className="doc-dropzone-subtitle">
          o haz clic para explorar tus archivos · Soporta archivos de hasta 50 MB
        </p>
      </div>

      {/* ── Barra de Filtros, Búsqueda y Modos de Vista ── */}
      <div className="doc-filters-bar">
        {/* Selector de Tipo de Archivo */}
        <div className="doc-type-filter-group">
          <button
            type="button"
            className={`doc-filter-btn ${typeFilter === 'todos' ? 'active' : ''}`}
            onClick={() => setTypeFilter('todos')}
          >
            Todos ({kpiTotal})
          </button>
          <button
            type="button"
            className={`doc-filter-btn ${typeFilter === 'pdf' ? 'active' : ''}`}
            onClick={() => setTypeFilter('pdf')}
          >
            <FileText size={13} color="#ef4444" />
            PDFs ({kpiPdf})
          </button>
          <button
            type="button"
            className={`doc-filter-btn ${typeFilter === 'word' ? 'active' : ''}`}
            onClick={() => setTypeFilter('word')}
          >
            <FileCode size={13} color="#2563eb" />
            Word ({kpiWord})
          </button>
        </div>

        {/* Categoría */}
        <div className="doc-select-wrapper">
          <Filter size={14} color="#94a3b8" />
          <select
            className="doc-filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="todos">Todas las categorías</option>
            <option value="Contratos">Contratos</option>
            <option value="Reportes Ejecutivos">Reportes Ejecutivos</option>
            <option value="Propuestas Comerciales">Propuestas Comerciales</option>
            <option value="Especificaciones Técnicas">Especificaciones Técnicas</option>
            <option value="Financiero">Financiero</option>
            <option value="Auditoría">Auditoría</option>
            <option value="General">General</option>
            {uniqueCategories
              .filter(
                (c) =>
                  ![
                    'Contratos',
                    'Reportes Ejecutivos',
                    'Propuestas Comerciales',
                    'Especificaciones Técnicas',
                    'Financiero',
                    'Auditoría',
                    'General',
                  ].includes(c)
              )
              .map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
          </select>
        </div>

        {/* Rol del autor */}
        <div className="doc-select-wrapper">
          <User size={14} color="#94a3b8" />
          <select
            className="doc-filter-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="todos">Todos los autores</option>
            <option value="admin">Subidos por Administrador</option>
            <option value="analista">Subidos por Analistas</option>
          </select>
        </div>

        {/* Buscador Local */}
        <div className="doc-search-box">
          <Search size={15} color="#94a3b8" />
          <input
            type="text"
            className="doc-search-input"
            placeholder="Buscar por nombre, autor, categoría o etiqueta..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>

        {/* Alternador de Vista (Cuadrícula / Tabla) */}
        <div className="doc-view-toggle">
          <button
            type="button"
            className={`doc-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Vista en Cuadrícula"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            className={`doc-view-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            title="Vista en Tabla"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* ── Contenedor de Documentos ── */}
      {filteredDocs.length === 0 ? (
        <div className="doc-empty-state">
          <FolderPlus size={52} color="#cbd5e1" />
          <h3>No se encontraron documentos</h3>
          <p>
            No hay archivos que coincidan con los filtros seleccionados o el repositorio está vacío.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <button
              type="button"
              className="doc-btn-upload-trigger"
              onClick={() => {
                setSelectedFile(null);
                setShowUploadModal(true);
              }}
            >
              <Plus size={15} />
              Subir un archivo
            </button>
            {documentos.length === 0 && (
              <button
                type="button"
                className="admin-refresh-btn"
                onClick={generateSampleDocuments}
              >
                <Sparkles size={15} color="#eab308" />
                Cargar Documentos de Muestra
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* Vista en Cuadrícula */
        <div className="documentos-grid">
          {filteredDocs.map((doc) => (
            <DocumentCard
              key={doc.id}
              documento={doc}
              onPreview={(d) => setPreviewDoc(d)}
              onDownload={(d) => downloadDocumento(d)}
              onDelete={() => setDocToDelete(doc)}
            />
          ))}
        </div>
      ) : (
        /* Vista en Tabla Detallada */
        <div className="doc-table-wrapper">
          <table className="doc-table">
            <thead>
              <tr>
                <th>Documento</th>
                <th>Categoría</th>
                <th>Subido Por</th>
                <th>Rol</th>
                <th>Tamaño</th>
                <th>Fecha</th>
                <th>Etiquetas</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map((doc) => {
                const isPdf = doc.tipo.toLowerCase().includes('pdf');
                const isAdminUpload = doc.usuario_rol.toLowerCase().includes('admin');
                return (
                  <tr key={doc.id}>
                    <td>
                      <div className="doc-table-name-cell">
                        <div
                          className={`doc-table-icon ${
                            isPdf ? 'doc-table-icon--pdf' : 'doc-table-icon--word'
                          }`}
                        >
                          {isPdf ? <FileText size={18} /> : <FileCode size={18} />}
                        </div>
                        <div>
                          <strong className="doc-table-doc-title">{doc.nombre}</strong>
                          <span className="doc-table-doc-id">{doc.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="doc-category-badge">{doc.categoria}</span>
                    </td>
                    <td>
                      <span className="doc-table-uploader">{doc.subido_por}</span>
                    </td>
                    <td>
                      <span
                        className={`doc-role-badge ${
                          isAdminUpload ? 'doc-role-badge--admin' : 'doc-role-badge--analista'
                        }`}
                      >
                        {isAdminUpload ? 'Administrador' : 'Analista'}
                      </span>
                    </td>
                    <td>
                      <span className="doc-size-badge">{doc.tamanio}</span>
                    </td>
                    <td>
                      <span className="doc-table-date">
                        {new Date(doc.created_at).toLocaleDateString('es-PE')}
                      </span>
                    </td>
                    <td>
                      <div className="doc-table-tags">
                        {doc.tags_json?.slice(0, 2).map((t, idx) => (
                          <span key={idx} className="doc-tag-pill">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="doc-table-actions">
                        <button
                          type="button"
                          className="doc-table-btn doc-table-btn--preview"
                          onClick={() => setPreviewDoc(doc)}
                          title="Previsualizar"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          className="doc-table-btn doc-table-btn--download"
                          onClick={() => downloadDocumento(doc)}
                          title="Descargar"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          type="button"
                          className="doc-table-btn doc-table-btn--delete"
                          onClick={() => setDocToDelete(doc)}
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal de Subida de Documento ── */}
      {showUploadModal && (
        <div className="doc-modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div
            className="doc-upload-modal-container"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <div className="doc-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  className="doc-modal-icon-badge"
                  style={{ background: '#eff6ff', color: '#2563eb' }}
                >
                  <UploadCloud size={20} />
                </div>
                <div>
                  <h3 className="doc-modal-title">Subir Documento Word o PDF</h3>
                  <span className="doc-modal-subtitle-row">
                    Se compartirá con Administradores y Analistas en tiempo real
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="doc-modal-close-btn"
                onClick={() => setShowUploadModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmUpload} className="doc-upload-form">
              {/* Selector de Archivo */}
              <div className="doc-form-group">
                <label className="doc-form-label">
                  Archivo a subir (.pdf, .docx, .doc) *
                </label>
                <div
                  className="doc-form-file-picker"
                  onClick={() => modalFileInputRef.current?.click()}
                >
                  <input
                    ref={modalFileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.rtf,.odt"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setSelectedFile(f);
                    }}
                  />
                  {selectedFile ? (
                    <div className="doc-form-file-chosen">
                      {selectedFile.name.endsWith('.pdf') ? (
                        <FileText size={24} color="#ef4444" />
                      ) : (
                        <FileCode size={24} color="#2563eb" />
                      )}
                      <div>
                        <strong>{selectedFile.name}</strong>
                        <span>
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Listo para cargar
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="doc-form-file-placeholder">
                      <UploadCloud size={28} color="#6366f1" />
                      <span>Haz clic aquí para seleccionar un archivo PDF o Word</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Categoría */}
              <div className="doc-form-group">
                <label className="doc-form-label">Categoría Empresarial *</label>
                <select
                  className="doc-form-select"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as DocumentoCategoria)}
                  required
                >
                  <option value="Contratos">Contratos</option>
                  <option value="Reportes Ejecutivos">Reportes Ejecutivos</option>
                  <option value="Propuestas Comerciales">Propuestas Comerciales</option>
                  <option value="Especificaciones Técnicas">Especificaciones Técnicas</option>
                  <option value="Financiero">Financiero</option>
                  <option value="Auditoría">Auditoría</option>
                  <option value="General">General</option>
                </select>
              </div>

              {/* Descripción */}
              <div className="doc-form-group">
                <label className="doc-form-label">Descripción o Notas del Documento</label>
                <textarea
                  className="doc-form-textarea"
                  rows={3}
                  placeholder="Detalles sobre el contenido, alcance, acuerdos o cláusulas relevantes..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              {/* Tags */}
              <div className="doc-form-group">
                <label className="doc-form-label">Etiquetas (separadas por coma)</label>
                <input
                  type="text"
                  className="doc-form-input"
                  placeholder="ej: hardware, contrato, alfa corp, licitacion"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                />
              </div>

              {/* Metadata del Autor */}
              <div className="doc-form-author-note">
                <Shield size={14} color="#4f46e5" />
                <span>
                  Se registrará a nombre de <strong>{user?.name || (isAdmin ? 'Jane Doe (Admin)' : 'Carlos Mendoza (Analista)')}</strong> con rol <strong>{isAdmin ? 'Administrador' : 'Analista'}</strong>.
                </span>
              </div>

              {/* Botones de acción */}
              <div className="doc-form-actions">
                <button
                  type="button"
                  className="doc-modal-btn-close"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="doc-modal-btn-download"
                  disabled={!selectedFile || isUploading}
                >
                  {isUploading ? (
                    <RefreshCw size={16} className="spin" />
                  ) : (
                    <UploadCloud size={16} />
                  )}
                  <span>{isUploading ? 'Subiendo archivo...' : 'Subir y Compartir'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal de Vista Previa ── */}
      {previewDoc && (
        <DocumentPreviewModal
          documento={previewDoc}
          onClose={() => setPreviewDoc(null)}
          onDownload={(d) => downloadDocumento(d)}
        />
      )}

      {/* ── Modal de Confirmación de Borrado ── */}
      {docToDelete && (
        <div className="doc-modal-overlay" onClick={() => setDocToDelete(null)}>
          <div
            className="doc-delete-modal-container"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
          >
            <div className="doc-delete-icon-box">
              <Trash2 size={26} color="#dc2626" />
            </div>
            <h3>¿Eliminar documento?</h3>
            <p>
              Estás a punto de eliminar <strong>"{docToDelete.nombre}"</strong>. Esta acción
              eliminará el archivo del repositorio compartido para todos los usuarios.
            </p>
            <div className="doc-delete-actions">
              <button
                type="button"
                className="doc-modal-btn-close"
                onClick={() => setDocToDelete(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="doc-delete-confirm-btn"
                onClick={handleConfirmDelete}
              >
                Sí, eliminar documento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentosView;
