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

      <Tabs defaultValue="google-sheets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="google-sheets">Google Sheets</TabsTrigger>
          <TabsTrigger value="sync">Sincronização</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
        </TabsList>

        <TabsContent value="google-sheets">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Configurações do Google Sheets</CardTitle>
              <Button 
                onClick={handleManualSync} 
                disabled={isSyncing}
                className="transition-all duration-200 hover:scale-105"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Sincronizar Agora
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sheet-id">ID da Planilha</Label>
                <Input
                  id="sheet-id"
                  value={configs.google_sheet_id || ''}
                  onChange={(e) => handleConfigChange('google_sheet_id', e.target.value)}
                  placeholder="Insira o ID da planilha do Google Sheets"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Encontre o ID na URL da planilha: docs.google.com/spreadsheets/d/[ID]/edit
                </p>
              </div>

              <div>
                <Label htmlFor="google-client-id">Client ID do Google</Label>
                <Input
                  id="google-client-id"
                  value={configs.google_client_id || ''}
                  onChange={(e) => handleConfigChange('google_client_id', e.target.value)}
                  placeholder="Insira o Client ID da conta Google"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Client ID obtido no Google Cloud Console
                </p>
              </div>

              <div>
                <Label htmlFor="google-client-secret">Client Secret do Google</Label>
                <Input
                  id="google-client-secret"
                  type="password"
                  value={configs.google_client_secret || ''}
                  onChange={(e) => handleConfigChange('google_client_secret', e.target.value)}
                  placeholder="Insira o Client Secret da conta Google"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Client Secret obtido no Google Cloud Console
                </p>
              </div>

              <div>
                <Label htmlFor="credentials">Observações sobre Integração Google</Label>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <p className="text-sm text-blue-700 mb-2">
                    ℹ️ <strong>Configuração necessária:</strong>
                  </p>
                  <ul className="text-sm text-blue-600 space-y-1">
                    <li>• Configure as credenciais no Google Cloud Console</li>
                    <li>• O sistema precisa das credenciais para atualizar a planilha</li>
                    <li>• Após configurar, as validações serão gravadas automaticamente na coluna O</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Sincronização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sync-interval">Intervalo de Sincronização (minutos)</Label>
                <Input
                  id="sync-interval"
                  type="number"
                  value={configs.sync_interval_minutes || '10'}
                  onChange={(e) => handleConfigChange('sync_interval_minutes', e.target.value)}
                  min="1"
                  max="60"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Frequência de sincronização automática com a planilha (1-60 minutos)
                </p>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">Como funciona a sincronização:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• A cada {configs.sync_interval_minutes || 10} minutos, o sistema busca novos candidatos na planilha</li>
                  <li>• Candidatos novos são automaticamente adicionados ao banco de dados</li>
                  <li>• Quando um candidato é validado no sistema, a coluna "bpo_validou" é atualizada para "SIM" na planilha</li>
                  <li>• Logs de sincronização são mantidos para auditoria</li>
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