import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      candidate_id, 
      candidate_name, 
      candidate_cpf, 
      action_type, 
      status_before, 
      status_after, 
      bpo_user_id, 
      bpo_name, 
      notes,
      data_admissao 
    } = await req.json()

    console.log('Edge function recebeu data_admissao:', data_admissao);

    const { error } = await supabaseClient
      .from('candidate_activity_logs')
      .insert({
        candidate_id,
        candidate_name,
        candidate_cpf,
        action_type,
        status_before,
        status_after,
        bpo_user_id,
        bpo_name,
        notes,
        data_admissao
      })

    if (error) {
      console.error('Erro ao inserir log:', error)
      throw error
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Erro:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})