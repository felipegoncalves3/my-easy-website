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
    const credentials = configMap.google_credentials;

    if (!sheetId || !credentials) {
      return new Response(
        JSON.stringify({ error: 'Configurações do Google Sheets não encontradas' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Por enquanto, simular atualização na planilha
    // Em implementação real, usaria Google Sheets API para:
    // 1. Encontrar a linha do candidato na planilha (por CPF ou email)
    // 2. Atualizar a coluna "bpo_validou" para "SIM"
    
    console.log(`Simulando atualização na planilha para candidato: ${candidate.nome}`);
    console.log(`Sheet ID: ${sheetId}`);
    console.log(`BPO Validou: ${candidate.bpo_validou ? 'SIM' : 'NAO'}`);

    // Registrar log de atualização
    await supabaseClient
      .from('sync_logs')
      .insert({
        sync_type: 'db_to_sheet',
        status: 'success',
        message: `Atualização simulada da planilha para candidato ${candidate.nome}`,
        records_processed: 1
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Planilha atualizada com sucesso (simulação)',
        candidate: candidate.nome
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