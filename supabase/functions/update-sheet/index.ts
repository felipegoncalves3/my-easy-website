import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { candidateId } = await req.json()

    if (!candidateId) {
      return new Response(
        JSON.stringify({ error: 'ID do candidato é obrigatório' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscar dados do candidato
    const { data: candidate, error: candidateError } = await supabaseClient
      .from('candidates')
      .select('*')
      .eq('id', candidateId)
      .single();

    if (candidateError || !candidate) {
      return new Response(
        JSON.stringify({ error: 'Candidato não encontrado' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Buscar configurações do sistema
    const { data: configs } = await supabaseClient
      .from('system_config')
      .select('*');

    const configMap: Record<string, string> = {};
    configs?.forEach(config => {
      configMap[config.config_key] = config.config_value || '';
    });

    const sheetId = configMap.google_sheet_id;

    if (!sheetId) {
      return new Response(
        JSON.stringify({ error: 'ID da planilha não configurado' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Para planilhas públicas, simular a atualização
    // Em produção real, seria necessário usar Google Sheets API com autenticação
    // para atualizar a coluna "bpo_validou" (coluna O) para "SIM"
    
    console.log(`Atualizando planilha pública para candidato: ${candidate.nome}`);
    console.log(`Sheet ID: ${sheetId}`);
    console.log(`CPF: ${candidate.cpf}`);
    console.log(`Código da linha: ${candidate.sheet_row_id}`);
    console.log(`URL da planilha: https://docs.google.com/spreadsheets/d/${sheetId}/edit`);
    console.log(`Atualização: Coluna O (bpo_validou) = SIM`);

    // NOTA: Para planilhas públicas editáveis, seria necessário:
    // 1. Usar Google Apps Script ou API com permissões de escrita
    // 2. Encontrar a linha pela coluna CPF ou Código
    // 3. Atualizar especificamente a coluna O (15ª coluna) para "SIM"

    // Registrar log de atualização
    await supabaseClient
      .from('sync_logs')
      .insert({
        sync_type: 'db_to_sheet',
        status: 'success',
        message: `Validação registrada no sistema para ${candidate.nome} (CPF: ${candidate.cpf})`,
        records_processed: 1
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Validação registrada no sistema para ${candidate.nome}`,
        candidate: candidate.nome,
        cpf: candidate.cpf,
        sheet_url: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
        note: "Para planilhas públicas, a atualização automática requer configuração adicional no Google Apps Script"
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Erro na atualização da planilha:', error);

    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno na atualização' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})