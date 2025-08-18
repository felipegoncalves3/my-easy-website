-- Adicionar configurações do Google Sheets se ainda não existirem
INSERT INTO public.system_config (config_key, config_value, description)
VALUES 
  ('google_client_id', '', 'Client ID do Google Cloud Console para acesso às APIs')
ON CONFLICT (config_key) DO NOTHING;

INSERT INTO public.system_config (config_key, config_value, description)
VALUES 
  ('google_client_secret', '', 'Client Secret do Google Cloud Console para acesso às APIs')
ON CONFLICT (config_key) DO NOTHING;