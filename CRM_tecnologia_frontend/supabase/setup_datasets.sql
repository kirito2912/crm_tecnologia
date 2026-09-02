-- =============================================================================
-- HardCRM Pro — Setup Supabase para módulo de Datasets
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =============================================================================

-- 1. Tabla datasets_ml (metadata + URL del archivo en Storage)
CREATE TABLE IF NOT EXISTS public.datasets_ml (
  id VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  categoria VARCHAR(100) NOT NULL DEFAULT 'general',
  archivo_url TEXT,
  registros_totales INT NOT NULL DEFAULT 0,
  features_count INT NOT NULL DEFAULT 0,
  columna_objetivo VARCHAR(100) NOT NULL DEFAULT 'unknown',
  tamanio_archivo VARCHAR(30),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Si la tabla ya existía sin archivo_url / created_at:
ALTER TABLE public.datasets_ml ADD COLUMN IF NOT EXISTS archivo_url TEXT;
ALTER TABLE public.datasets_ml ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_datasets_ml_categoria ON public.datasets_ml(categoria);
CREATE INDEX IF NOT EXISTS idx_datasets_ml_created_at ON public.datasets_ml(created_at DESC);

-- 2. Row Level Security (RLS)
ALTER TABLE public.datasets_ml ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "datasets_ml_select_anon" ON public.datasets_ml;
CREATE POLICY "datasets_ml_select_anon"
  ON public.datasets_ml FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "datasets_ml_insert_anon" ON public.datasets_ml;
CREATE POLICY "datasets_ml_insert_anon"
  ON public.datasets_ml FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "datasets_ml_delete_anon" ON public.datasets_ml;
CREATE POLICY "datasets_ml_delete_anon"
  ON public.datasets_ml FOR DELETE
  TO anon, authenticated
  USING (true);

-- 3. Bucket de Storage para archivos CSV/JSON
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'datasets',
  'datasets',
  true,
  52428800,  -- 50 MB
  ARRAY['text/csv', 'application/json', 'text/plain', 'application/vnd.ms-excel']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

-- 4. Políticas de Storage
DROP POLICY IF EXISTS "datasets_storage_select" ON storage.objects;
CREATE POLICY "datasets_storage_select"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'datasets');

DROP POLICY IF EXISTS "datasets_storage_insert" ON storage.objects;
CREATE POLICY "datasets_storage_insert"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'datasets');

DROP POLICY IF EXISTS "datasets_storage_delete" ON storage.objects;
CREATE POLICY "datasets_storage_delete"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'datasets');

-- 5. Habilitar Realtime (opcional — para actualizar lista automáticamente)
ALTER PUBLICATION supabase_realtime ADD TABLE public.datasets_ml;
