-- ==============================================================================
-- TECHUB BPO - REPORTS & KPIs VIEWS
-- ==============================================================================

-- 1. OVERVIEW KPIs (vw_rpt_overview_kpis)
-- Aggregates high-level metrics from current production data.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vw_rpt_overview_kpis AS
SELECT
    count(*) AS total_candidates,
    count(*) FILTER (WHERE bpo_validou = 'SIM') AS total_validated,
    
    -- Total Pending (Strict Operational Logic)
    count(*) FILTER (
        WHERE 
            -- 1. Exclude Invalid Statuses (Case insensitive, trimmed)
            TRIM(LOWER(COALESCE(status_contratacao, ''))) NOT IN ('finalizado', 'cancelado', 'arquivado', 'concluído', 'concluido', 'validado', 'iniciado')
            AND 
            -- 2. Pending Logic: (Not Validated OR Has Evolution)
            (
                (bpo_validou IS DISTINCT FROM 'SIM') -- Covers NULL, 'NÃO', etc.
                OR 
                (evolucao = 'SIM')
            )
    ) AS total_pending,
    
    -- Validation Rate (%)
    CASE 
        WHEN count(*) > 0 THEN 
            ROUND((count(*) FILTER (WHERE bpo_validou = 'SIM')::numeric / count(*)::numeric) * 100, 2)
        ELSE 0 
    END AS validation_rate_pct,
    
    -- Rejection Rate (%) (Based on 'Documentos Recusados')
    CASE 
        WHEN count(*) > 0 THEN 
            ROUND((count(*) FILTER (WHERE status_contratacao ILIKE '%recusado%')::numeric / count(*)::numeric) * 100, 2)
        ELSE 0 
    END AS rejection_rate_pct

FROM public.bpo_producao;


-- 2. BPO PRODUCTIVITY (vw_rpt_bpo_productivity)
-- Aggregates performance metrics per BPO from the validations table.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vw_rpt_bpo_productivity AS
SELECT
    v.bpo_nome AS bpo_name,
    v.bpo_usuario_id AS bpo_id,
    
    -- Total Validations
    count(*) AS total_validations,
    
    -- Validations Today
    count(*) FILTER (WHERE v.data_validacao::date = CURRENT_DATE) AS validations_today,
    
    -- Average Time (in seconds)
    ROUND(avg(v.tempo_validacao_segundos), 2) AS avg_time_seconds,
    
    -- Last Activity
    max(v.data_validacao) AS last_active_at,
    
    -- Rollbacks Performed
    count(*) FILTER (WHERE v.rollback = true) AS total_rollbacks

FROM public.bpo_validacoes v
GROUP BY v.bpo_nome, v.bpo_usuario_id;


-- 3. HIRING FUNNEL (vw_rpt_hiring_funnel)
-- Counts candidates by current status.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vw_rpt_hiring_funnel AS
SELECT
    status_contratacao AS status,
    count(*) AS count,
    ROUND((count(*) * 100.0 / sum(count(*)) OVER ()), 2) AS percentage
FROM public.bpo_producao
GROUP BY status_contratacao
ORDER BY count DESC;


-- 4. DOCUMENTATION STATS (vw_rpt_documentation_stats)
-- Buckets candidates into documentation completeness ranges.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vw_rpt_documentation_stats AS
SELECT
    ranges.range_label,
    count(p.id) AS count,
    CASE 
        WHEN (SELECT count(*) FROM public.bpo_producao) > 0 THEN
            ROUND((count(p.id) * 100.0 / (SELECT count(*) FROM public.bpo_producao)), 2)
        ELSE 0
    END AS percentage
FROM (
    SELECT '0%' as range_label, 0 as min_val, 0 as max_val
    UNION ALL SELECT '1-50%', 1, 50
    UNION ALL SELECT '51-99%', 51, 99
    UNION ALL SELECT '100%', 100, 100
) ranges
LEFT JOIN public.bpo_producao p ON 
    COALESCE(p.progressao_documentos, 0) >= ranges.min_val 
    AND COALESCE(p.progressao_documentos, 0) <= ranges.max_val
GROUP BY ranges.range_label, ranges.min_val
ORDER BY ranges.min_val;


-- 5. MATRIX PERFORMANCE (vw_rpt_matrix_performance)
-- Aggregates metrics by Parent Company (Matrix).
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vw_rpt_matrix_performance AS
SELECT 
    COALESCE(e.nome, 'Sem Matriz Identificada') AS matrix_name,
    e.id AS matrix_id,
    count(b.id) AS total_candidates,
    count(b.id) FILTER (WHERE b.bpo_validou = 'SIM') AS validated_count,
    
    -- Pending Logic (Same as Overview)
    count(b.id) FILTER (
        WHERE 
            TRIM(LOWER(COALESCE(b.status_contratacao, ''))) NOT IN ('finalizado', 'cancelado', 'arquivado', 'concluído', 'concluido', 'validado', 'iniciado')
            AND 
            (
                (b.bpo_validou IS DISTINCT FROM 'SIM')
                OR 
                (b.evolucao = 'SIM')
            )
    ) AS pending_count,
    
    -- Average Documentation %
    ROUND(avg(COALESCE(b.progressao_documentos, 0)), 2) AS avg_documentation_progress

FROM public.bpo_producao b
LEFT JOIN public.empresas e ON b.id_empresa_matriz = e.id
GROUP BY e.id, e.nome
ORDER BY total_candidates DESC;

-- Grant permissions (Adjust 'authenticated' and 'service_role' as needed)
GRANT SELECT ON public.vw_rpt_overview_kpis TO authenticated, service_role;
GRANT SELECT ON public.vw_rpt_bpo_productivity TO authenticated, service_role;
GRANT SELECT ON public.vw_rpt_hiring_funnel TO authenticated, service_role;
GRANT SELECT ON public.vw_rpt_documentation_stats TO authenticated, service_role;
GRANT SELECT ON public.vw_rpt_matrix_performance TO authenticated, service_role;
