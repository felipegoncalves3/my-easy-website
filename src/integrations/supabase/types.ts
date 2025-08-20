export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      candidate_activity_logs: {
        Row: {
          action_type: string
          bpo_name: string | null
          bpo_user_id: string | null
          candidate_cpf: string | null
          candidate_id: string
          candidate_name: string
          created_at: string
          id: string
          notes: string | null
          processed_at: string
          status_after: string | null
          status_before: string | null
          updated_at: string
        }
        Insert: {
          action_type: string
          bpo_name?: string | null
          bpo_user_id?: string | null
          candidate_cpf?: string | null
          candidate_id: string
          candidate_name: string
          created_at?: string
          id?: string
          notes?: string | null
          processed_at?: string
          status_after?: string | null
          status_before?: string | null
          updated_at?: string
        }
        Update: {
          action_type?: string
          bpo_name?: string | null
          bpo_user_id?: string | null
          candidate_cpf?: string | null
          candidate_id?: string
          candidate_name?: string
          created_at?: string
          id?: string
          notes?: string | null
          processed_at?: string
          status_after?: string | null
          status_before?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      candidates: {
        Row: {
          bpo_que_validou: string | null
          bpo_responsavel: string | null
          bpo_validou: boolean | null
          cpf: string | null
          created_at: string | null
          criado_em: string | null
          data_admissao: string | null
          data_expiracao: string | null
          em_progresso_ge_60: string | null
          evolucao: string | null
          id: string
          id_contratacao: number | null
          motivo: string | null
          nome: string
          priorizar_data_admissao: string | null
          priorizar_status: string | null
          progresso_documentos: number | null
          status: string | null
          status_contratacao: string | null
          updated_at: string | null
          validado_em: string | null
          validado_por: string | null
        }
        Insert: {
          bpo_que_validou?: string | null
          bpo_responsavel?: string | null
          bpo_validou?: boolean | null
          cpf?: string | null
          created_at?: string | null
          criado_em?: string | null
          data_admissao?: string | null
          data_expiracao?: string | null
          em_progresso_ge_60?: string | null
          evolucao?: string | null
          id?: string
          id_contratacao?: number | null
          motivo?: string | null
          nome: string
          priorizar_data_admissao?: string | null
          priorizar_status?: string | null
          progresso_documentos?: number | null
          status?: string | null
          status_contratacao?: string | null
          updated_at?: string | null
          validado_em?: string | null
          validado_por?: string | null
        }
        Update: {
          bpo_que_validou?: string | null
          bpo_responsavel?: string | null
          bpo_validou?: boolean | null
          cpf?: string | null
          created_at?: string | null
          criado_em?: string | null
          data_admissao?: string | null
          data_expiracao?: string | null
          em_progresso_ge_60?: string | null
          evolucao?: string | null
          id?: string
          id_contratacao?: number | null
          motivo?: string | null
          nome?: string
          priorizar_data_admissao?: string | null
          priorizar_status?: string | null
          progresso_documentos?: number | null
          status?: string | null
          status_contratacao?: string | null
          updated_at?: string | null
          validado_em?: string | null
          validado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidates_validado_por_fkey"
            columns: ["validado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_logs: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          records_processed: number | null
          status: string
          sync_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          records_processed?: number | null
          status: string
          sync_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          records_processed?: number | null
          status?: string
          sync_type?: string
        }
        Relationships: []
      }
      system_config: {
        Row: {
          config_key: string
          config_value: string | null
          created_at: string | null
          description: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          config_key: string
          config_value?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          config_key?: string
          config_value?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          department: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          password: string
          role: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          password: string
          role?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          password?: string
          role?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
