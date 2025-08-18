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

    // Use the specific sheet ID from the provided URL
    const sheetId = '1xSqq_vOQfxlbsLHbzX3bHimRNq_IeDxCsdAW5R-AowI';
    const apiKey = Deno.env.get('GOOGLE_SHEETS_API_KEY');

    if (!apiKey) {
      console.error('Google Sheets API key not configured');
      throw new Error('Google Sheets API key not configured');
    }

    try {
      // Get all data from the sheet to find the row with matching id_contratacao
      const getResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:O?key=${apiKey}`
      );

      if (!getResponse.ok) {
        throw new Error(`Failed to read sheet: ${getResponse.statusText}`);
      }

      const data = await getResponse.json();
      const rows = data.values || [];

      // Find the row where column A (index 0) matches id_contratacao
      let targetRowIndex = -1;
      for (let i = 0; i < rows.length; i++) {
        if (rows[i][0] && rows[i][0].toString() === candidate.id_contratacao?.toString()) {
          targetRowIndex = i + 1; // Sheet rows are 1-indexed
          break;
        }
      }

      if (targetRowIndex === -1) {
        throw new Error(`Candidato com ID ${candidate.id_contratacao} não encontrado na planilha`);
      }

      // Update column O (index 14) in the found row
      const updateResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/O${targetRowIndex}?valueInputOption=RAW&key=${apiKey}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: [['SIM']]
          })
        }
      );

      if (!updateResponse.ok) {
        throw new Error(`Failed to update sheet: ${updateResponse.statusText}`);
      }

      console.log(`Planilha atualizada com sucesso para candidato: ${candidate.nome}`);
      console.log(`Linha ${targetRowIndex}, Coluna O atualizada com "SIM"`);

    } catch (sheetError) {
      console.error('Erro ao atualizar planilha:', sheetError);
      throw new Error(`Erro ao atualizar planilha: ${sheetError.message}`);
    }

    // Registrar log de atualização
    await supabaseClient
      .from('sync_logs')
      .insert({
        sync_type: 'db_to_sheet',
        status: 'success',
        message: `Validação registrada no sistema para ${candidate.nome} (ID: ${candidate.id_contratacao})`,
        records_processed: 1
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Validação registrada no sistema para ${candidate.nome}`,
        candidate: candidate.nome,
        id_contratacao: candidate.id_contratacao,
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