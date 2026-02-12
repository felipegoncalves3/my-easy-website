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
      // Carregar estatísticas do bpo_producao
      const { data: candidates, error: candidatesError } = await supabase
        .from('bpo_producao')
        .select('*');

      if (candidatesError) throw candidatesError;

      // Filter candidates based on status exclusion rules
      const validCandidates = (candidates || []).filter(c => {
        const status = (c.status_contratacao || '').toLowerCase().trim();
        const INVALID_STATUSES = ['finalizado', 'cancelado', 'arquivado', 'concluído', 'concluido', 'validado', 'iniciado'];
        return !INVALID_STATUSES.includes(status);
      });

      const total = validCandidates.length;
      const validados = validCandidates.filter(c => c.bpo_validou === 'SIM').length;
      const pendentes = validCandidates.filter(c => c.bpo_validou === null || c.bpo_validou === 'NÃO').length;
      const percentualValidacao = total > 0 ? Math.round((validados / total) * 100) : 0;

      setStats({ total, validados, pendentes, percentualValidacao });

      // Candidatos recentes (usando data_criacao se disponível, ou fallback para id)
      const recent = validCandidates
        .sort((a, b) => {
          const dateA = a.data_criacao ? new Date(a.data_criacao).getTime() : 0;
          const dateB = b.data_criacao ? new Date(b.data_criacao).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 5);

      setRecentCandidates(recent as Candidate[]);

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

    // Polling Strategy: Update every 1 hour (3600000 ms)
    const intervalId = setInterval(() => {
      loadDashboardData();
    }, 3600000);

    return () => clearInterval(intervalId);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-foreground animate-slide-up">
          Dashboard
        </h1>
        <div className="text-sm text-muted-foreground bg-primary/10 px-4 py-2 rounded-full border border-primary/20 backdrop-blur-sm animate-scale-in">
          ⚡ Atualização: 1h
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-modern rounded-2xl border-sidebar-border/50 bg-sidebar-accent/10 hover-glow animate-slide-up" style={{ animationDelay: '100ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total de Candidatos</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary mb-1">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Candidatos cadastrados</p>
          </CardContent>
        </Card>

        <Card className="card-modern hover-glow animate-slide-up" style={{ animationDelay: '200ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Validados</CardTitle>
            <div className="p-2 rounded-lg bg-success/10">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success mb-1">{stats.validados}</div>
            <p className="text-xs text-muted-foreground">Candidatos aprovados</p>
          </CardContent>
        </Card>

        <Card className="card-modern hover-glow animate-slide-up" style={{ animationDelay: '300ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Pendentes</CardTitle>
            <div className="p-2 rounded-lg bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning mb-1">{stats.pendentes}</div>
            <p className="text-xs text-muted-foreground">Aguardando validação</p>
          </CardContent>
        </Card>

        <Card className="card-modern rounded-2xl border-sidebar-border/50 bg-sidebar-accent/10 hover-glow animate-slide-up" style={{ animationDelay: '400ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">% Validação</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <AlertCircle className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary mb-2">{stats.percentualValidacao}%</div>
            <Progress value={stats.percentualValidacao} className="h-2 bg-muted/20" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Candidatos Recentes */}
        <Card className="card-modern rounded-2xl border-sidebar-border/50 bg-sidebar-accent/5 animate-slide-up" style={{ animationDelay: '500ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              Candidatos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCandidates.map((candidate, index) => (
                <div key={candidate.id} className="flex items-center justify-between p-3 rounded-lg bg-sidebar-accent/20 hover:bg-sidebar-accent/50 transition-colors duration-200">
                  <div>
                    <p className="font-semibold text-foreground">{candidate.nome}</p>
                    <p className="text-sm text-muted-foreground">ID: {candidate.codigo || 'N/A'}</p>
                  </div>
                  <Badge
                    className={candidate.bpo_validou === 'SIM' ? "inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/20 text-primary hover:bg-primary/30 text-xs" : "inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent text-secondary-foreground bg-orange-500/20 text-orange-500 hover:bg-orange-500/30 text-xs"}
                  >
                    {candidate.bpo_validou === 'SIM' ? "Validado" : "Pendente"}
                  </Badge>
                </div>
              ))}
              {recentCandidates.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">Nenhum candidato encontrado</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status da Sincronização */}
        <Card className="card-modern rounded-2xl border-sidebar-border/50 bg-sidebar-accent/5 animate-slide-up" style={{ animationDelay: '600ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              Status da Sincronização
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastSync ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-lg bg-accent/30">
                  <span className="text-sm font-medium">Última sincronização:</span>
                  <Badge className={lastSync.status === 'success' ? "badge-success" : "bg-destructive/10 text-destructive border-destructive/20"}>
                    {lastSync.status === 'success' ? 'Sucesso' : 'Erro'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-accent/20">
                    <p className="text-xs text-muted-foreground">Data/Hora</p>
                    <p className="text-sm font-medium">
                      {new Date(lastSync.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-accent/20">
                    <p className="text-xs text-muted-foreground">Registros</p>
                    <p className="text-sm font-medium">{lastSync.records_processed}</p>
                  </div>
                </div>
                {lastSync.message && (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-sm text-primary">{lastSync.message}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">Nenhuma sincronização realizada ainda</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};