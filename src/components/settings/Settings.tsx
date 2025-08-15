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
                <Label htmlFor="credentials">Credenciais do Google (JSON)</Label>
                <Textarea
                  id="credentials"
                  value={configs.google_credentials || ''}
                  onChange={(e) => handleConfigChange('google_credentials', e.target.value)}
                  placeholder="Cole aqui o JSON das credenciais do Google Cloud"
                  rows={8}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Credenciais obtidas no Google Cloud Console para acesso à API do Sheets
                </p>
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
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Para adicionar novos usuários, insira diretamente na tabela 'users' do banco de dados.
                </p>
                
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Usuário Padrão:</h4>
                  <ul className="text-sm space-y-1">
                    <li><strong>Usuário:</strong> admin</li>
                    <li><strong>Senha:</strong> admin123</li>
                    <li><strong>Perfil:</strong> Administrador</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">⚠️ Importante:</h4>
                  <p className="text-sm text-yellow-700">
                    Altere a senha padrão após o primeiro acesso e implemente hash de senhas para ambiente de produção.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};