import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, RefreshCw, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SystemConfig } from '@/types';
import { toast } from 'sonner';
import { UserManagement } from './UserManagement';

export const Settings = () => {
  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('*');

      if (error) throw error;

      const configMap: Record<string, string> = {};
      data?.forEach((config: SystemConfig) => {
        configMap[config.config_key] = config.config_value || '';
      });

      setConfigs(configMap);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfigs = async () => {
    try {
      setIsSaving(true);

      // Atualizar cada configuração
      for (const [key, value] of Object.entries(configs)) {
        const { error } = await supabase
          .from('system_config')
          .update({ config_value: value })
          .eq('config_key', key);

        if (error) throw error;
      }

      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfigChange = (key: string, value: string) => {
    setConfigs(prev => ({ ...prev, [key]: value }));
  };

  const handleManualSync = async () => {
    try {
      setIsSyncing(true);
      toast.info('Sincronização manual iniciada...');
      
      // Chamar edge function de sincronização
      const { error } = await supabase.functions.invoke('sync-sheets', {
        body: { type: 'manual' }
      });

      if (error) throw error;

      toast.success('Sincronização concluída com sucesso!');
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast.error('Erro na sincronização');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Configurações</h1>
        <Button onClick={saveConfigs} disabled={isSaving}>
          {isSaving ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar
        </Button>
      </div>

      <Tabs defaultValue="webhook" className="space-y-4">
        <TabsList>
          <TabsTrigger value="webhook">Webhook</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
        </TabsList>

        <TabsContent value="webhook">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Webhook</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="webhook-url">Webhook para Validar</Label>
                <Input
                  id="webhook-url"
                  value={configs.webhook_validar_url || ''}
                  onChange={(e) => handleConfigChange('webhook_validar_url', e.target.value)}
                  placeholder="https://seu-webhook.com/endpoint"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  URL do webhook que será chamado quando um candidato for validado
                </p>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">Como funciona o webhook:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Quando um candidato é validado, o sistema enviará uma requisição POST para a URL configurada</li>
                  <li>• O payload conterá todos os dados do candidato validado</li>
                  <li>• O webhook será chamado automaticamente após a validação no sistema</li>
                  <li>• Certifique-se de que a URL está acessível e aceita requisições POST</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};