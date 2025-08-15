-- Criar tabela de usuários (sem RLS conforme solicitado)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password TEXT NOT NULL, -- Hash da senha
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'operator',
  department VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de candidatos (sem RLS)
CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(11) UNIQUE,
  email VARCHAR(255),
  telefone VARCHAR(20),
  data_nascimento DATE,
  endereco TEXT,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(8),
  escolaridade VARCHAR(100),
  experiencia_anterior TEXT,
  disponibilidade VARCHAR(50),
  salario_pretendido DECIMAL(10,2),
  observacoes TEXT,
  status VARCHAR(50) DEFAULT 'pendente',
  bpo_validou BOOLEAN DEFAULT false,
  validado_por UUID REFERENCES public.users(id),
  validado_em TIMESTAMP WITH TIME ZONE,
  sheet_row_id INTEGER, -- Para mapear com a linha da planilha
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de logs de sincronização
CREATE TABLE public.sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type VARCHAR(50) NOT NULL, -- 'sheet_to_db', 'db_to_sheet'
  status VARCHAR(20) NOT NULL, -- 'success', 'error'
  message TEXT,
  records_processed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de configurações do sistema
CREATE TABLE public.system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configurações padrão
INSERT INTO public.system_config (config_key, config_value, description) VALUES
('google_sheet_id', '', 'ID da planilha Google Sheets'),
('sync_interval_minutes', '10', 'Intervalo de sincronização em minutos'),
('google_credentials', '', 'Credenciais do Google Sheets API (JSON)');

-- Inserir usuário administrador padrão (senha: admin123)
INSERT INTO public.users (username, password, email, full_name, role) VALUES
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@bpo.com', 'Administrador', 'admin');

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON public.candidates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON public.system_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();