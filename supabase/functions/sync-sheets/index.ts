import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SheetRow {
  codigo?: string;
  nome: string;
  cpf?: string;
  status_contratacao?: string;
  progressao_documentos?: string;
  data_criacao?: string;
  data_admissao?: string;
  data_expiracao?: string;
  evolucao?: string;
  motivo?: string;
  bpo_responsavel?: string;
  priorizar_status?: string;
  priorizar_data_admissao?: string;
  em_progresso?: string;
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

    if (!sheetId) {
      await supabaseClient
        .from('sync_logs')
        .insert({
          sync_type: 'sheet_to_db',
          status: 'error',
          message: 'ID da planilha não configurado',
          records_processed: 0
        });

      return new Response(
        JSON.stringify({ error: 'ID da planilha não configurado' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Buscar dados da planilha pública
    let sheetData: SheetRow[] = [];
    
    try {
      // URL para acessar planilha pública em formato CSV
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;
      
      console.log(`Buscando dados da planilha: ${csvUrl}`);
      
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error(`Erro ao acessar planilha: ${response.status} ${response.statusText}`);
      }
      
      const csvText = await response.text();
      const lines = csvText.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length < 2) {
        throw new Error('Planilha vazia ou sem dados');
      }
      
      // Pular a primeira linha (cabeçalho) e processar os dados
      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(',').map(col => col.replace(/"/g, '').trim());
        
        if (columns.length >= 15 && columns[1]) { // Verificar se tem dados suficientes e nome não vazio
          const row: SheetRow = {
            codigo: columns[0] || '',
            nome: columns[1] || '',
            cpf: columns[2] || '',
            status_contratacao: columns[3] || '',
            progressao_documentos: columns[4] || '',
            data_criacao: columns[5] || '',
            data_admissao: columns[6] || '',
            data_expiracao: columns[7] || '',
            evolucao: columns[8] || '',
            motivo: columns[9] || '',
            bpo_responsavel: columns[10] || '',
            priorizar_status: columns[11] || '',
            priorizar_data_admissao: columns[12] || '',
            em_progresso: columns[13] || '',
            bpo_validou: columns[14] || 'NAO'
          };
          
          sheetData.push(row);
        }
      }
      
      console.log(`Dados processados da planilha: ${sheetData.length} registros`);
      
    } catch (error) {
      console.error('Erro ao buscar dados da planilha:', error);
      
      await supabaseClient
        .from('sync_logs')
        .insert({
          sync_type: 'sheet_to_db',
          status: 'error',
          message: `Erro ao acessar planilha: ${error.message}`,
          records_processed: 0
        });

      return new Response(
        JSON.stringify({ error: `Erro ao acessar planilha: ${error.message}` }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    let processedRecords = 0;

    // Processar cada linha da planilha
    for (const row of sheetData) {
      try {
        // Verificar se candidato já existe (por CPF)
        const { data: existingCandidate } = await supabaseClient
          .from('candidates')
          .select('id, bpo_validou')
          .eq('cpf', row.cpf)
          .maybeSingle();

        if (!existingCandidate && row.nome && row.cpf) {
          // Inserir novo candidato
          const candidateData = {
            nome: row.nome,
            cpf: row.cpf,
            status: row.status_contratacao || 'pendente',
            bpo_validou: row.bpo_validou === 'SIM',
            observacoes: `Código: ${row.codigo} | BPO Responsável: ${row.bpo_responsavel} | Motivo: ${row.motivo}`,
            sheet_row_id: parseInt(row.codigo || '0')
          };

          const { error } = await supabaseClient
            .from('candidates')
            .insert(candidateData);

          if (!error) {
            processedRecords++;
          }
        } else if (existingCandidate) {
          // Atualizar status de validação se mudou na planilha
          const newValidationStatus = row.bpo_validou === 'SIM';
          if (existingCandidate.bpo_validou !== newValidationStatus) {
            await supabaseClient
              .from('candidates')
              .update({ bpo_validou: newValidationStatus })
              .eq('id', existingCandidate.id);
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