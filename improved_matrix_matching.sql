-- Optimized Matrix Identification Logic (High Performance)
-- Date: 2026-02-04
-- Performance Fix: Uses Temp Table + Indices to avoid O(N*M) timeouts.

-- 1. Create Helper Function (Immutable for Indexing)
CREATE OR REPLACE FUNCTION public.cleanup_company_name(p_name text)
RETURNS text AS $$
DECLARE
    v_clean text;
BEGIN
    -- Lowercase and unaccent
    v_clean := unaccent(lower(coalesce(p_name, '')));
    
    -- Remove punctuation (keep spaces)
    v_clean := regexp_replace(v_clean, '[.,\-\/]', ' ', 'g');
    
    -- Remove common suffixes (padded with spaces to ensure whole words)
    v_clean := regexp_replace(v_clean, '\s+(ltda|sa|s\/a|s\.a\.|me|epp)\s*$', '', 'g');
    
    -- Trim extra whitespace
    v_clean := trim(regexp_replace(v_clean, '\s+', ' ', 'g'));
    
    RETURN v_clean;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Performance Block
DO $$
BEGIN
    -- A. Create a Lookup Table for valid Companies
    -- This pre-calculates the "Clean Name" for every company ONCE.
    CREATE TEMP TABLE IF NOT EXISTS temp_company_lookup AS
    SELECT 
        id,
        CASE 
            WHEN id_matriz IS NOT NULL AND EXISTS(SELECT 1 FROM public.empresas p WHERE p.id = empresas.id_matriz) THEN id_matriz 
            ELSE id 
        END as resolved_matrix_id,
        unaccent(lower(trim(nome))) as exact_key,
        public.cleanup_company_name(nome) as clean_key
    FROM public.empresas;

    -- B. Add Indices for lightning-fast matching
    CREATE INDEX IF NOT EXISTS idx_temp_lookup_exact ON temp_company_lookup(exact_key);
    CREATE INDEX IF NOT EXISTS idx_temp_lookup_clean ON temp_company_lookup(clean_key);
    
    -- C. Perform the Update using JOINs (Set-based operation) directly from the properties
    -- Phase 1: Exact Matches (Fastest & most accurate)
    UPDATE public.bpo_producao b
    SET id_empresa_matriz = lut.resolved_matrix_id
    FROM temp_company_lookup lut
    WHERE 
        b.id_empresa_matriz IS NULL 
        AND b.nome_empresa IS NOT NULL 
        AND unaccent(lower(trim(b.nome_empresa))) = lut.exact_key;

    -- Phase 2: Loose Matches (For remaining NULLs)
    UPDATE public.bpo_producao b
    SET id_empresa_matriz = lut.resolved_matrix_id
    FROM temp_company_lookup lut
    WHERE 
        b.id_empresa_matriz IS NULL 
        AND b.nome_empresa IS NOT NULL 
        AND public.cleanup_company_name(b.nome_empresa) = lut.clean_key;
        
    -- Drop Temp Table
    DROP TABLE temp_company_lookup;
END $$;
