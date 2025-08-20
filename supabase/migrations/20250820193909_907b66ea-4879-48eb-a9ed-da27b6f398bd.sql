-- Adicionar coluna data_admissao à tabela candidate_activity_logs
ALTER TABLE public.candidate_activity_logs 
ADD COLUMN data_admissao date;