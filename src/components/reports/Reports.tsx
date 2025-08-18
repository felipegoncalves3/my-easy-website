import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Download, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Candidate, SyncLog } from '@/types';
import { toast } from 'sonner';

export const Reports = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadReportsData = async () => {
    try {
      // Carregar candidatos
      const { data: candidatesData, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (candidatesError) throw candidatesError;

      // Carregar logs de sincronização
      const { data: logsData, error: logsError } = await supabase
        .from('sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (logsError) throw logsError;

      setCandidates(candidatesData || []);
      setSyncLogs(logsData || []);
    } catch (error) {
      console.error('Erro ao carregar dados dos relatórios:', error);
      toast.error('Erro ao carregar dados dos relatórios');
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCsv = () => {
    try {
      const headers = [
        'ID Contratação',
        'Nome',
        'CPF',
        'Status Contratação',
        'Progresso Documentos',
        'BPO Responsável',
        'Status',
        'BPO Validou',
        'Data Criação'
      ];

      const csvContent = [
        headers.join(','),
        ...candidates.map(candidate => [
          candidate.id_contratacao || '',
          candidate.nome,
          candidate.cpf || '',
          candidate.status_contratacao || '',
          candidate.progresso_documentos || '',
          candidate.bpo_responsavel || '',
          candidate.status,
          candidate.bpo_validou ? 'SIM' : 'NÃO',
          new Date(candidate.created_at).toLocaleDateString('pt-BR')
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `candidatos_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast.error('Erro ao exportar relatório');
    }
  };

  useEffect(() => {
    loadReportsData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stats = {
    total: candidates.length,
    validados: candidates.filter(c => c.bpo_validou).length,
    pendentes: candidates.filter(c => !c.bpo_validou).length,
    percentualValidacao: candidates.length > 0 ? 
      Math.round((candidates.filter(c => c.bpo_validou).length / candidates.length) * 100) : 0
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <Button onClick={exportToCsv}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Resumo Estatístico */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Validados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.validados}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendentes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">% Validação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.percentualValidacao}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabela de Candidatos */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Candidatos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.slice(0, 20).map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell className="font-medium">
                        {candidate.nome}
                      </TableCell>
                      <TableCell>
                        <Badge variant={candidate.bpo_validou ? "default" : "secondary"}>
                          {candidate.bpo_validou ? "Validado" : "Pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(candidate.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Logs de Sincronização */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Sincronização</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {syncLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium capitalize">{log.sync_type}</span>
                      <Badge variant={log.status === 'success' ? "default" : "destructive"}>
                        {log.status === 'success' ? 'Sucesso' : 'Erro'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </p>
                    {log.message && (
                      <p className="text-sm text-muted-foreground">{log.message}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{log.records_processed}</p>
                    <p className="text-xs text-muted-foreground">registros</p>
                  </div>
                </div>
              ))}
              {syncLogs.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum log de sincronização encontrado
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};