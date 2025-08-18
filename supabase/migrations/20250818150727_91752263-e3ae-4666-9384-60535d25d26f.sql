INSERT INTO system_config (config_key, config_value, description) 
VALUES ('webhook_validar_url', '', 'URL do webhook que será chamado quando um candidato for validado')
ON CONFLICT (config_key) DO NOTHING;