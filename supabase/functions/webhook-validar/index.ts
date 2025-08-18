import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { candidateData } = await req.json()

    console.log('Webhook validar chamado para candidato:', candidateData.id)

    // Buscar a URL do webhook nas configurações
    const { data: config, error: configError } = await supabase
      .from('system_config')
      .select('config_value')
      .eq('config_key', 'webhook_validar_url')
      .single()

    if (configError || !config?.config_value) {
      console.log('Webhook URL não configurada')
      return new Response(
        JSON.stringify({ success: true, message: 'Webhook URL não configurada' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    const webhookUrl = config.config_value

    // Fazer a chamada para o webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: 'candidate_validated',
        timestamp: new Date().toISOString(),
        data: candidateData
      })
    })

    if (webhookResponse.ok) {
      console.log('Webhook chamado com sucesso')
      return new Response(
        JSON.stringify({ success: true, message: 'Webhook enviado com sucesso' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    } else {
      console.error('Erro ao chamar webhook:', webhookResponse.status)
      return new Response(
        JSON.stringify({ success: false, message: 'Erro ao chamar webhook' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

  } catch (error) {
    console.error('Erro na edge function webhook-validar:', error)
    return new Response(
      JSON.stringify({ success: false, message: 'Erro interno' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})