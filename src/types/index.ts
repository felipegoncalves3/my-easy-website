export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  department?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Candidate {
  id: string;
  nome: string;
  cpf?: string;
  status_contratacao?: string;
  progresso_documentos?: number;
  criado_em?: string;
  data_admissao?: string;
  data_expiracao?: string;
  evolucao?: string;
  motivo?: string;
  bpo_responsavel?: string;
  priorizar_status?: string;
  priorizar_data_admissao?: string;
  em_progresso_ge_60?: string;
  status: string;
  bpo_validou: boolean;
  bpo_que_validou?: string;
  validado_por?: string;
  validado_em?: string;
  id_contratacao?: number;
  created_at: string;
  updated_at: string;
}

export interface SyncLog {
  id: string;
  sync_type: string;
  status: string;
  message?: string;
  records_processed: number;
  created_at: string;
}

export interface SystemConfig {
  id: string;
  config_key: string;
  config_value?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
}