import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CandidateRow {
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
  salario_pretendido?: string;
  observacoes?: string;
  status?: string;
  bpo_validou?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscar configurações do sistema
    const { data: configs } = await supabaseClient
      .from('system_config')
      .select('*');

    const configMap: Record<string, string> = {};
    configs?.forEach(config => {
      configMap[config.config_key] = config.config_value || '';
    });

    const sheetId = configMap.google_sheet_id;
    const credentials = configMap.google_credentials;

    if (!sheetId || !credentials) {
      await supabaseClient
        .from('sync_logs')
        .insert({
          sync_type: 'sheet_to_db',
          status: 'error',
          message: 'Configurações do Google Sheets não encontradas',
          records_processed: 0
        });

      return new Response(
        JSON.stringify({ error: 'Configurações do Google Sheets não encontradas' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse das credenciais
    let parsedCredentials;
    try {
      parsedCredentials = JSON.parse(credentials);
    } catch (error) {
      await supabaseClient
        .from('sync_logs')
        .insert({
          sync_type: 'sheet_to_db',
          status: 'error',
          message: 'Credenciais do Google inválidas',
          records_processed: 0
        });

      return new Response(
        JSON.stringify({ error: 'Credenciais do Google inválidas' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Implementar autenticação e leitura do Google Sheets
    // Por enquanto, vamos simular dados de exemplo para teste
    const mockSheetData: CandidateRow[] = [
      {
        nome: "João Silva",
        cpf: "12345678900",
        email: "joao@email.com",
        telefone: "(11) 99999-9999",
        data_nascimento: "1990-01-01",
        cidade: "São Paulo",
        estado: "SP",
        escolaridade: "Ensino Médio",
        disponibilidade: "Integral",
        status: "pendente",
        bpo_validou: "NAO"
      }
    ];

    let processedRecords = 0;

    // Processar cada linha da planilha
    for (const row of mockSheetData) {
      try {
        // Verificar se candidato já existe (por CPF ou email)
        const { data: existingCandidate } = await supabaseClient
          .from('candidates')
          .select('id')
          .or(`cpf.eq.${row.cpf},email.eq.${row.email}`)
          .maybeSingle();

        if (!existingCandidate && row.nome) {
          // Inserir novo candidato
          const candidateData = {
            nome: row.nome,
            cpf: row.cpf,
            email: row.email,
            telefone: row.telefone,
            data_nascimento: row.data_nascimento,
            endereco: row.endereco,
            cidade: row.cidade,
            estado: row.estado,
            cep: row.cep,
            escolaridade: row.escolaridade,
            experiencia_anterior: row.experiencia_anterior,
            disponibilidade: row.disponibilidade,
            salario_pretendido: row.salario_pretendido ? parseFloat(row.salario_pretendido) : null,
            observacoes: row.observacoes,
            status: row.status || 'pendente',
            bpo_validou: row.bpo_validou === 'SIM'
          };

          const { error } = await supabaseClient
            .from('candidates')
            .insert(candidateData);

          if (!error) {
            processedRecords++;
          }
        }
      } catch (error) {
        console.error('Erro ao processar candidato:', error);
      }
    }

    // Registrar log de sincronização
    await supabaseClient
      .from('sync_logs')
      .insert({
        sync_type: 'sheet_to_db',
        status: 'success',
        message: `Sincronização concluída. ${processedRecords} novos candidatos adicionados.`,
        records_processed: processedRecords
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sincronização concluída. ${processedRecords} novos candidatos processados.`,
        processed: processedRecords
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Erro na sincronização:', error);

    // Tentar registrar erro no log
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      await supabaseClient
        .from('sync_logs')
        .insert({
          sync_type: 'sheet_to_db',
          status: 'error',
          message: error.message || 'Erro desconhecido na sincronização',
          records_processed: 0
        });
    } catch (logError) {
      console.error('Erro ao registrar log:', logError);
    }

    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno na sincronização' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})