-- Migration: Add Matrix Identification to BPO Queue (Fixed)
-- Date: 2026-02-04
-- Fixes: Handling of orphaned id_matriz (FK Violation 23503)

-- 1. Enable Unaccent Extension (if not enabled)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. Add 'id_empresa_matriz' column to 'bpo_producao'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bpo_producao' AND column_name='id_empresa_matriz') THEN
        ALTER TABLE public.bpo_producao ADD COLUMN id_empresa_matriz bigint REFERENCES public.empresas(id);
    END IF;
END $$;

-- 3. Create Function: identify_bpo_matrix
CREATE OR REPLACE FUNCTION public.identify_bpo_matrix()
RETURNS TRIGGER AS $$
DECLARE
    v_empresa_id bigint;
    v_matriz_id bigint;
    v_parent_exists boolean;
BEGIN
    -- Only run logic if nome_empresa is present
    IF NEW.nome_empresa IS NOT NULL THEN
        -- Find the company
        SELECT id, id_matriz
        INTO v_empresa_id, v_matriz_id
        FROM public.empresas
        WHERE unaccent(lower(trim(nome))) = unaccent(lower(trim(NEW.nome_empresa)))
        ORDER BY id ASC
        LIMIT 1;

        IF FOUND THEN
            -- Logic: Validate if the Parent (Matrix) actually exists
            IF v_matriz_id IS NOT NULL THEN
                SELECT EXISTS(SELECT 1 FROM public.empresas WHERE id = v_matriz_id) INTO v_parent_exists;
                
                IF v_parent_exists THEN
                    NEW.id_empresa_matriz := v_matriz_id;
                ELSE
                    -- Orphaned branch: Parent ID exists in column but not in table keys.
                    -- Fallback to self (treat as independent) to avoid FK error.
                    NEW.id_empresa_matriz := v_empresa_id;
                END IF;
            ELSE
                -- It's already the matrix (or independent)
                NEW.id_empresa_matriz := v_empresa_id;
            END IF;
        ELSE
            -- No match found
            NEW.id_empresa_matriz := NULL;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create Trigger: trg_identify_bpo_matrix
DROP TRIGGER IF EXISTS trg_identify_bpo_matrix ON public.bpo_producao;

CREATE TRIGGER trg_identify_bpo_matrix
BEFORE INSERT OR UPDATE OF nome_empresa ON public.bpo_producao
FOR EACH ROW
EXECUTE FUNCTION public.identify_bpo_matrix();

-- 5. Backfill Existing Data (With Safe Logic)
UPDATE public.bpo_producao b
SET id_empresa_matriz = (
    SELECT 
        CASE 
            -- Check if parent exists before using it
            WHEN e.id_matriz IS NOT NULL AND EXISTS(SELECT 1 FROM public.empresas p WHERE p.id = e.id_matriz) THEN e.id_matriz 
            -- Else use self
            ELSE e.id 
        END
    FROM public.empresas e
    WHERE unaccent(lower(trim(e.nome))) = unaccent(lower(trim(b.nome_empresa)))
    ORDER BY e.id ASC
    LIMIT 1
)
WHERE b.id_empresa_matriz IS NULL AND b.nome_empresa IS NOT NULL;
