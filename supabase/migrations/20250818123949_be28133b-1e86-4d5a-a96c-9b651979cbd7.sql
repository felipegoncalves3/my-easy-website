-- Habilitar RLS em todas as tabelas públicas
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Criar políticas básicas para permitir acesso aos dados
-- Para candidates - permitir acesso total para usuários autenticados
CREATE POLICY "candidates_access_policy" ON candidates
FOR ALL USING (true);

-- Para sync_logs - permitir acesso total para usuários autenticados
CREATE POLICY "sync_logs_access_policy" ON sync_logs
FOR ALL USING (true);

-- Para system_config - permitir acesso total para usuários autenticados
CREATE POLICY "system_config_access_policy" ON system_config
FOR ALL USING (true);

-- Para users - permitir acesso total para usuários autenticados
CREATE POLICY "users_access_policy" ON users
FOR ALL USING (true);