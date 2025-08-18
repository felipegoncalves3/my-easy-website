-- Remove colunas desnecessárias
ALTER TABLE candidates 
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS telefone,
DROP COLUMN IF EXISTS data_nascimento,
DROP COLUMN IF EXISTS endereco,
DROP COLUMN IF EXISTS cidade,
DROP COLUMN IF EXISTS estado,
DROP COLUMN IF EXISTS cep,
DROP COLUMN IF EXISTS escolaridade,
DROP COLUMN IF EXISTS experiencia_anterior,
DROP COLUMN IF EXISTS salario_pretendido,
DROP COLUMN IF EXISTS observacoes;

-- Renomear colunas existentes
ALTER TABLE candidates 
RENAME COLUMN disponibilidade TO status_contratacao;

ALTER TABLE candidates 
RENAME COLUMN sheet_row_id TO id_contratacao;

-- Adicionar novas colunas
ALTER TABLE candidates 
ADD COLUMN bpo_responsavel TEXT,
ADD COLUMN progresso_documentos DECIMAL(5,2),
ADD COLUMN criado_em DATE,
ADD COLUMN data_admissao DATE,
ADD COLUMN data_expiracao DATE,
ADD COLUMN evolucao TEXT,
ADD COLUMN motivo TEXT DEFAULT 'Novo Candidato',
ADD COLUMN priorizar_status TEXT,
ADD COLUMN bpo_que_validou TEXT,
ADD COLUMN priorizar_data_admissao TEXT,
ADD COLUMN em_progresso_ge_60 TEXT;