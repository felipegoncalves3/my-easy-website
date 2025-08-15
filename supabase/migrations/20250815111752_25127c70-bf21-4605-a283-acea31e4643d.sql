-- Inserir usuários de exemplo com diferentes perfis
INSERT INTO public.users (username, password, email, full_name, role) VALUES
('bpo_user', 'bpo123', 'bpo@validacao.com', 'Operador BPO', 'bpo'),
('supervisor', 'super123', 'supervisor@validacao.com', 'Supervisor BPO', 'supervisor')
ON CONFLICT (username) DO NOTHING;