-- Migration: Add tipo_normalizado to mantenimiento.prerrequisitos_clientes
-- Usage: run on Postgres as a DBA (adjust schema if needed)

-- 1) Ensure unaccent extension (optional but recommended for accents removal)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2) Create a normalization helper function
CREATE OR REPLACE FUNCTION mantenimiento.normalize_tipo(text) RETURNS text AS $$
  SELECT lower(regexp_replace(unaccent(coalesce($1, '')), '[^a-z0-9]+', '_', 'g'))::text;
$$ LANGUAGE SQL IMMUTABLE;

-- 3) Add the column (if not exists)
ALTER TABLE mantenimiento.prerrequisitos_clientes
ADD COLUMN IF NOT EXISTS tipo_normalizado text;

-- 4) Populate existing rows
UPDATE mantenimiento.prerrequisitos_clientes
SET tipo_normalizado = mantenimiento.normalize_tipo(tipo_documento)
WHERE tipo_normalizado IS NULL;

-- 5) Create an index to speed lookups
CREATE INDEX IF NOT EXISTS idx_prerrequisitos_tipo_normalizado ON mantenimiento.prerrequisitos_clientes(tipo_normalizado);

-- 6) Trigger to keep column updated on INSERT/UPDATE
CREATE OR REPLACE FUNCTION mantenimiento.set_tipo_normalizado_trigger() RETURNS trigger AS $$
BEGIN
  NEW.tipo_normalizado := mantenimiento.normalize_tipo(NEW.tipo_documento);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tipo_normalizado ON mantenimiento.prerrequisitos_clientes;
CREATE TRIGGER trg_tipo_normalizado
BEFORE INSERT OR UPDATE ON mantenimiento.prerrequisitos_clientes
FOR EACH ROW EXECUTE FUNCTION mantenimiento.set_tipo_normalizado_trigger();

-- Rollback (manual):
-- DROP TRIGGER IF EXISTS trg_tipo_normalizado ON mantenimiento.prerrequisitos_clientes;
-- DROP FUNCTION IF EXISTS mantenimiento.set_tipo_normalizado_trigger();
-- DROP INDEX IF EXISTS idx_prerrequisitos_tipo_normalizado;
-- ALTER TABLE mantenimiento.prerrequisitos_clientes DROP COLUMN IF EXISTS tipo_normalizado;
-- DROP FUNCTION IF EXISTS mantenimiento.normalize_tipo(text);
