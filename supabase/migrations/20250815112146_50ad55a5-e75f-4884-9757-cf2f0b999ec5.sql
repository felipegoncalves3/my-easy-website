-- Habilitar realtime para a tabela candidates
ALTER TABLE public.candidates REPLICA IDENTITY FULL;

-- Adicionar a tabela à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.candidates;