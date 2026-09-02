import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  getSupabaseClient,
  isSupabaseConfigured,
  DATASETS_BUCKET,
  DATASETS_TABLE,
} from './supabaseClient';
import type { DatasetMLInsert, DatasetMLRecord } from '../types/dataset';
import { formatFileSize } from '../utils/csvParser';

export { isSupabaseConfigured };

/** Lista todos los datasets desde Supabase */
export async function fetchDatasetsFromSupabase(): Promise<DatasetMLRecord[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(DATASETS_TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as DatasetMLRecord[];
}

/** Descarga el contenido de un archivo desde Storage o URL pública */
export async function fetchFileContent(archivoUrl: string): Promise<string> {
  const response = await fetch(archivoUrl);
  if (!response.ok) {
    throw new Error(`No se pudo descargar el archivo (${response.status})`);
  }
  return response.text();
}

/** Sube archivo a Storage e inserta metadata en datasets_ml */
export async function uploadDatasetToSupabase(
  file: File,
  meta: Omit<DatasetMLInsert, 'archivo_url' | 'tamanio_archivo'>
): Promise<DatasetMLRecord> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase no está configurado');

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${Date.now()}_${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(DATASETS_BUCKET)
    .upload(storagePath, file, { upsert: false, contentType: file.type || 'text/csv' });

  if (uploadError) throw new Error(`Error al subir archivo: ${uploadError.message}`);

  const { data: urlData } = supabase.storage.from(DATASETS_BUCKET).getPublicUrl(storagePath);

  const payload: DatasetMLInsert = {
    ...meta,
    archivo_url: urlData.publicUrl,
    tamanio_archivo: formatFileSize(file.size),
  };

  const { data, error } = await supabase
    .from(DATASETS_TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    await supabase.storage.from(DATASETS_BUCKET).remove([storagePath]);
    throw new Error(`Error al guardar metadata: ${error.message}`);
  }

  return data as DatasetMLRecord;
}

/** Elimina registro y archivo en Storage */
export async function deleteDatasetFromSupabase(
  id: string,
  archivoUrl?: string | null
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase.from(DATASETS_TABLE).delete().eq('id', id);
  if (error) throw new Error(error.message);

  if (archivoUrl) {
    const path = extractStoragePath(archivoUrl);
    if (path) {
      await supabase.storage.from(DATASETS_BUCKET).remove([path]);
    }
  }
}

function extractStoragePath(publicUrl: string): string | null {
  try {
    const marker = `/storage/v1/object/public/${DATASETS_BUCKET}/`;
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(publicUrl.slice(idx + marker.length));
  } catch {
    return null;
  }
}

/** Suscripción realtime a cambios en datasets_ml */
export function subscribeToDatasets(
  onChange: () => void
): RealtimeChannel | null {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  return supabase
    .channel('datasets_ml_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: DATASETS_TABLE },
      () => onChange()
    )
    .subscribe();
}

export function unsubscribeFromDatasets(channel: RealtimeChannel | null): void {
  if (!channel) return;
  const supabase = getSupabaseClient();
  supabase?.removeChannel(channel);
}
