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
      
      // Processar cabeçalho para mapear colunas
      const headerLine = lines[0].split(',').map(col => col.replace(/"/g, '').trim().toLowerCase());
      
      // Mapear índices das colunas
      const columnMap: Record<string, number> = {};
      headerLine.forEach((header, index) => {
        if (header.includes('código') || header.includes('codigo')) columnMap.codigo = index;
        if (header.includes('nome')) columnMap.nome = index;
        if (header.includes('cpf')) columnMap.cpf = index;
        if (header.includes('status') && header.includes('contratação')) columnMap.status_contratacao = index;
        if (header.includes('progressão') || header.includes('progressao')) columnMap.progressao_documentos = index;
        if (header.includes('data') && header.includes('criação')) columnMap.data_criacao = index;
        if (header.includes('data') && header.includes('admissão')) columnMap.data_admissao = index;
        if (header.includes('data') && header.includes('expiração')) columnMap.data_expiracao = index;
        if (header.includes('evolução') || header.includes('evolucao')) columnMap.evolucao = index;
        if (header.includes('motivo')) columnMap.motivo = index;
        if (header.includes('bpo') && header.includes('responsavel')) columnMap.bpo_responsavel = index;
        if (header.includes('priorizar') && header.includes('status')) columnMap.priorizar_status = index;
        if (header.includes('priorizar') && header.includes('data')) columnMap.priorizar_data_admissao = index;
        if (header.includes('em') && header.includes('progresso')) columnMap.em_progresso = index;
        if (header.includes('bpo_validou') || header.includes('bpo validou')) columnMap.bpo_validou = index;
      });

      console.log('Mapeamento de colunas encontradas:', columnMap);
      
      // Pular a primeira linha (cabeçalho) e processar os dados
      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(',').map(col => col.replace(/"/g, '').trim());
        
        if (columns.length >= Object.keys(columnMap).length && columns[columnMap.nome || 1]) {
          const row: SheetRow = {
            codigo: columns[columnMap.codigo || 0] || '',
            nome: columns[columnMap.nome || 1] || '',
            cpf: columns[columnMap.cpf || 2] || '',
            status_contratacao: columns[columnMap.status_contratacao || 3] || '',
            progressao_documentos: columns[columnMap.progressao_documentos || 4] || '',
            data_criacao: columns[columnMap.data_criacao || 5] || '',
            data_admissao: columns[columnMap.data_admissao || 6] || '',
            data_expiracao: columns[columnMap.data_expiracao || 7] || '',
            evolucao: columns[columnMap.evolucao || 8] || '',
            motivo: columns[columnMap.motivo || 9] || '',
            bpo_responsavel: columns[columnMap.bpo_responsavel || 10] || '',
            priorizar_status: columns[columnMap.priorizar_status || 11] || '',
            priorizar_data_admissao: columns[columnMap.priorizar_data_admissao || 12] || '',
            em_progresso: columns[columnMap.em_progresso || 13] || '',
            bpo_validou: columns[columnMap.bpo_validou || 14] || 'NAO'
          };
          
          console.log(`Processando linha ${i}: ${row.nome} - bpo_validou: ${row.bpo_validou}`);
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
        // Verificar se candidato já existe (por código da planilha)
        const { data: existingCandidate } = await supabaseClient
          .from('candidates')
          .select('*')
          .eq('id_contratacao', parseInt(row.codigo || '0'))
          .maybeSingle();

        const isValidated = row.bpo_validou === 'SIM';
        const candidateStatus = isValidated ? 'validado' : 'pendente';

        if (!existingCandidate && row.nome && row.codigo) {
          // Inserir novo candidato usando código como identificador único
          const candidateData = {
            nome: row.nome,
            cpf: row.cpf || '',
            status: candidateStatus,
            bpo_validou: isValidated,
            id_contratacao: parseInt(row.codigo),
            status_contratacao: row.status_contratacao || '',
            progresso_documentos: row.progressao_documentos ? parseFloat(row.progressao_documentos) : null,
            criado_em: row.data_criacao || null,
            data_admissao: row.data_admissao || null,
            data_expiracao: row.data_expiracao || null,
            evolucao: row.evolucao || '',
            motivo: row.motivo || 'Novo Candidato',
            bpo_responsavel: row.bpo_responsavel || '',
            priorizar_status: row.priorizar_status || null,
            priorizar_data_admissao: row.priorizar_data_admissao || null,
            em_progresso_ge_60: row.em_progresso || null
          };

          console.log(`Inserindo novo candidato: ${candidateData.nome} - Código: ${row.codigo} - Status: ${candidateStatus}`);

          const { error } = await supabaseClient
            .from('candidates')
            .insert(candidateData);

          if (!error) {
            processedRecords++;
          }
        } else if (existingCandidate) {
          // Atualizar candidato existente com todas as informações da planilha
          console.log(`Atualizando candidato ${row.nome} - Código: ${row.codigo} - Status: ${candidateStatus}`);
          
          const updateData = {
            nome: row.nome,
            cpf: row.cpf || existingCandidate.cpf,
            status: candidateStatus,
            bpo_validou: isValidated,
            status_contratacao: row.status_contratacao || existingCandidate.status_contratacao,
            progresso_documentos: row.progressao_documentos ? parseFloat(row.progressao_documentos) : existingCandidate.progresso_documentos,
            criado_em: row.data_criacao || existingCandidate.criado_em,
            data_admissao: row.data_admissao || existingCandidate.data_admissao,
            data_expiracao: row.data_expiracao || existingCandidate.data_expiracao,
            evolucao: row.evolucao || existingCandidate.evolucao,
            motivo: row.motivo || existingCandidate.motivo,
            bpo_responsavel: row.bpo_responsavel || existingCandidate.bpo_responsavel,
            priorizar_status: row.priorizar_status || existingCandidate.priorizar_status,
            priorizar_data_admissao: row.priorizar_data_admissao || existingCandidate.priorizar_data_admissao,
            em_progresso_ge_60: row.em_progresso || existingCandidate.em_progresso_ge_60,
            updated_at: new Date().toISOString()
          };

          await supabaseClient
            .from('candidates')
            .update(updateData)
            .eq('id_contratacao', parseInt(row.codigo));
          
          processedRecords++;
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