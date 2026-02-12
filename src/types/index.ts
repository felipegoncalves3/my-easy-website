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
  codigo: string;
  nome: string;
  cpf?: string;
  status_contratacao?: string;
  progressao_documentos?: number;
  data_criacao?: string;
  data_de_admissao_10040?: string;
  data_de_expiracao?: string;
  evolucao?: string;
  motivo?: string;
  bpo_responsavel?: string;
  bpo_validou: string | null;
  data_extracao?: string;
  // New flags for dynamic priority
  flag_prioridade_status?: boolean;
  flag_prioridade_progresso?: boolean;
  flag_prioridade_data?: boolean;
  // Metadata
  id_empresa_matriz?: number | null;
  matrix_name?: string; // For UI display
}

export interface BPOValidation {
  id: string;
  codigo: string;
  bpo_usuario_id: string;
  bpo_nome: string;
  status_contratacao_anterior?: string;
  progressao_documentos_anterior?: number;
  bpo_validou_anterior?: string;
  status_contratacao_novo?: string;
  progressao_documentos_novo?: number;
  bpo_validou_novo?: string;
  data_primeira_visualizacao: string;
  data_validacao: string;
  tempo_validacao_segundos: number;
  motivo_validacao?: string;
  rollback: boolean;
  data_rollback?: string;
  rollback_por?: string;
  motivo_rollback?: string;
  created_at: string;
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