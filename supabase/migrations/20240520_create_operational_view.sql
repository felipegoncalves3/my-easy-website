-- Create or replace the view for the operational queue with dynamic priorities
CREATE OR REPLACE VIEW vw_bpo_fila_operacional AS
SELECT
    *,
    (status_contratacao = 'VALIDAÇÃO') AS flag_prioridade_status,
    (status_contratacao = 'EM PROGRESSO' AND progressao_documentos >= 60) AS flag_prioridade_progresso,
    (
        data_de_admissao_10040 <= CURRENT_DATE + INTERVAL '5 days'
        AND status_contratacao NOT IN ('ADMITIDO','CANCELADO','REPROVADO')
    ) AS flag_prioridade_data
FROM bpo_producao;

-- Grant access to authenticated users if needed (standard policy for views)
GRANT SELECT ON vw_bpo_fila_operacional TO authenticated;
GRANT SELECT ON vw_bpo_fila_operacional TO service_role;
