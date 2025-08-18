import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Candidate, SyncLog } from '@/types';
import { toast } from 'sonner';

export const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    validados: 0,
    pendentes: 0,
    percentualValidacao: 0
  });
  const [recentCandidates, setRecentCandidates] = useState<Candidate[]>([]);
  const [lastSync, setLastSync] = useState<SyncLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      // Carregar estatísticas
      const { data: candidates, error: candidatesError } = await supabase
        .from('candidates')
        .select('*');

      if (candidatesError) throw candidatesError;

      const total = candidates?.length || 0;
      const validados = candidates?.filter(c => c.bpo_validou).length || 0;
      const pendentes = total - validados;
      const percentualValidacao = total > 0 ? Math.round((validados / total) * 100) : 0;

      setStats({ total, validados, pendentes, percentualValidacao });

      // Candidatos recentes
      const recent = candidates
        ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        ?.slice(0, 5) || [];
      
      setRecentCandidates(recent);

      // Último log de sincronização
      const { data: syncLogs } = await supabase
        .from('sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (syncLogs?.length) {
        setLastSync(syncLogs[0]);
      }

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Configurar tempo real
    const channel = supabase
      .channel('dashboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'candidates'
        },
        () => {
          loadDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
        <h1 className="text-3xl font-bold text-black">
          Dashboard
        </h1>
        <div className="text-sm text-muted-foreground bg-primary/10 px-3 py-1 rounded-full">
          ⚡ Atualização em tempo real
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Candidatos</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validados</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.validados}</div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{stats.pendentes}</div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">% Validação</CardTitle>
            <AlertCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.percentualValidacao}%</div>
            <Progress value={stats.percentualValidacao} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Candidatos Recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Candidatos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCandidates.map((candidate) => (
                <div key={candidate.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{candidate.nome}</p>
                    <p className="text-sm text-muted-foreground">ID: {candidate.id_contratacao || 'N/A'}</p>
                  </div>
                  <Badge variant={candidate.bpo_validou ? "default" : "secondary"}>
                    {candidate.bpo_validou ? "Validado" : "Pendente"}
                  </Badge>
                </div>
              ))}
              {recentCandidates.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum candidato encontrado
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status da Sincronização */}
        <Card>
          <CardHeader>
            <CardTitle>Status da Sincronização</CardTitle>
          </CardHeader>
          <CardContent>
            {lastSync ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Última sincronização:</span>
                  <Badge variant={lastSync.status === 'success' ? "default" : "destructive"}>
                    {lastSync.status === 'success' ? 'Sucesso' : 'Erro'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(lastSync.created_at).toLocaleString('pt-BR')}
                </p>
                {lastSync.message && (
                  <p className="text-sm">{lastSync.message}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Registros processados: {lastSync.records_processed}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhuma sincronização realizada ainda</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};