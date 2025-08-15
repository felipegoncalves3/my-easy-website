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
  email?: string;
  telefone?: string;
  data_nascimento?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  escolaridade?: string;
  experiencia_anterior?: string;
  disponibilidade?: string;
  salario_pretendido?: number;
  observacoes?: string;
  status: string;
  bpo_validou: boolean;
  validado_por?: string;
  validado_em?: string;
  sheet_row_id?: number;
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