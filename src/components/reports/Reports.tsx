import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Download, FileText, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Candidate, SyncLog } from '@/types';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface BpoValidationStats {
  bpo_name: string;
  total_validations: number;
}

interface BpoValidationAverages {
  bpo_name: string;
  daily_average: number;
  monthly_average: number;
  total_validations: number;
}

interface TimeBetweenValidations {
  bpo_name: string;
  average_time_minutes: number;
}

interface BpoValidationExtract {
  bpo_name: string;
  candidate_cpf: string;
  candidate_name: string;
  processed_at: string;
  status_after: string;
}

export const Reports = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [bpoStats, setBpoStats] = useState<BpoValidationStats[]>([]);
  const [bpoValidationExtract, setBpoValidationExtract] = useState<BpoValidationExtract[]>([]);
  const [bpoValidationAverages, setBpoValidationAverages] = useState<BpoValidationAverages[]>([]);
  const [timeBetweenValidations, setTimeBetweenValidations] = useState<TimeBetweenValidations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeTab, setActiveTab] = useState('relatorios');

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

      // Carregar dados dos novos relatórios
      await loadActivityReports();
    } catch (error) {
      console.error('Erro ao carregar dados dos relatórios:', error);
      toast.error('Erro ao carregar dados dos relatórios');
    } finally {
      setIsLoading(false);
    }
  };

  const loadActivityReports = async () => {
    try {
      let query = supabase
        .from('candidate_activity_logs' as any)
        .select('candidate_id,candidate_name,candidate_cpf,bpo_name,bpo_user_id,processed_at,status_after');

      if (dateFrom) {
        query = query.gte('processed_at', dateFrom + 'T00:00:00');
      }
      if (dateTo) {
        query = query.lte('processed_at', dateTo + 'T23:59:59');
      }
      // Filtrar registros sem filtro inicial para pegar todos os tipos de status
      
      const { data: activityData, error } = await query;
      if (error) throw error;

      const typedActivityData = (activityData || []) as any[];

      // Preparar extrato de validações para a aba 2
      const extractData = typedActivityData.map(log => ({
        bpo_name: log.bpo_name || 'Sem BPO',
        candidate_cpf: log.candidate_cpf || 'N/A',
        candidate_name: log.candidate_name || 'N/A',
        processed_at: log.processed_at,
        status_after: log.status_after || 'N/A'
      }));
      setBpoValidationExtract(extractData);

      // Filtrar apenas registros validados para os outros relatórios
      const validatedData = typedActivityData.filter(log => 
        ['APPROVED', 'Validado', 'validado', 'VALIDADO'].includes(log.status_after)
      );

      // Relatório 1: Quantidade de validados por BPO (considera repetições como +1)
      const bpoValidations = validatedData.reduce((acc, log) => {
        const bpo = log.bpo_name || 'Sem BPO';
        acc[bpo] = (acc[bpo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setBpoStats(Object.entries(bpoValidations || {}).map(([bpo_name, total_validations]) => ({
        bpo_name,
        total_validations: total_validations as number
      })));

      // Relatório 2: Média de validações por dia e mês por cada BPO
      const bpoAverages = Object.entries(
        validatedData.reduce((acc, log) => {
          const bpo = log.bpo_name || 'Sem BPO';
          if (!acc[bpo]) acc[bpo] = [];
          acc[bpo].push(log);
          return acc;
        }, {} as Record<string, any[]>)
      ).map(([bpo_name, logs]) => {
        const validLogs = Array.isArray(logs) ? logs : [];
        if (validLogs.length === 0) return null;

        // Agrupar por dia
        const dayGroups = validLogs.reduce((acc, log) => {
          const date = new Date(log.processed_at).toDateString();
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        const dailyAverage = Object.keys(dayGroups).length > 0 ? 
          (Object.values(dayGroups) as number[]).reduce((a, b) => a + b, 0) / Object.keys(dayGroups).length : 0;

        // Agrupar por mês
        const monthGroups = validLogs.reduce((acc, log) => {
          const date = new Date(log.processed_at);
          const month = `${date.getFullYear()}-${date.getMonth() + 1}`;
          acc[month] = (acc[month] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        const monthlyAverage = Object.keys(monthGroups).length > 0 ? 
          (Object.values(monthGroups) as number[]).reduce((a, b) => a + b, 0) / Object.keys(monthGroups).length : 0;

        return {
          bpo_name,
          daily_average: dailyAverage,
          monthly_average: monthlyAverage,
          total_validations: validLogs.length
        };
      }).filter(Boolean) as BpoValidationAverages[];

      setBpoValidationAverages(bpoAverages);

      // Relatório 3: Tempo médio entre validações por BPO
      const bpoGroups = validatedData.reduce((acc, log) => {
        const bpoId = log.bpo_user_id || 'unknown';
        if (!acc[bpoId]) acc[bpoId] = [];
        acc[bpoId].push({
          processed_at: new Date(log.processed_at),
          bpo_name: log.bpo_name || 'Sem BPO'
        });
        return acc;
      }, {} as Record<string, Array<{processed_at: Date, bpo_name: string}>>);

      const timeBetween = Object.entries(bpoGroups).map(([bpoId, logs]) => {
        const typedLogs = logs as Array<{processed_at: Date, bpo_name: string}>;
        if (!typedLogs || typedLogs.length < 2) return null;
        
        typedLogs.sort((a, b) => a.processed_at.getTime() - b.processed_at.getTime());
        let totalTime = 0;
        let intervals = 0;

        for (let i = 1; i < typedLogs.length; i++) {
          const diff = typedLogs[i].processed_at.getTime() - typedLogs[i-1].processed_at.getTime();
          totalTime += diff;
          intervals++;
        }

        return {
          bpo_name: typedLogs[0].bpo_name,
          average_time_minutes: intervals > 0 ? totalTime / intervals / (1000 * 60) : 0
        };
      }).filter(Boolean) as TimeBetweenValidations[];

      setTimeBetweenValidations(timeBetween);

    } catch (error) {
      console.error('Erro ao carregar relatórios de atividade:', error);
      toast.error('Erro ao carregar relatórios de atividade');
    }
  };

  const exportToCsv = () => {
    // Só permite exportação nas abas 1 e 2
    if (activeTab !== 'relatorios' && activeTab !== 'validacoes-bpo') {
      toast.error('Exportação disponível apenas para as abas Relatórios e Validações por BPO');
      return;
    }

    let data: any[] = [];
    let filename = '';
    let headers: string[] = [];

    if (activeTab === 'relatorios') {
      headers = [
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
      data = candidates.map(candidate => [
        candidate.id_contratacao || '',
        candidate.nome,
        candidate.cpf || '',
        candidate.status_contratacao || '',
        candidate.progresso_documentos || '',
        candidate.bpo_responsavel || '',
        candidate.status,
        candidate.bpo_validou ? 'SIM' : 'NÃO',
        new Date(candidate.created_at).toLocaleDateString('pt-BR')
      ]);
      filename = 'candidatos';
    } else if (activeTab === 'validacoes-bpo') {
      headers = ['BPO', 'Código', 'Nome', 'Data', 'Status'];
      data = bpoValidationExtract.map(extract => [
        extract.bpo_name,
        extract.candidate_cpf,
        extract.candidate_name,
        new Date(extract.processed_at).toLocaleDateString('pt-BR'),
        extract.status_after
      ]);
      filename = 'extrato_validacoes_bpo';
    }

    try {
      const csvContent = [
        headers.join(','),
        ...data.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Relatório CSV exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast.error('Erro ao exportar relatório CSV');
    }
  };

  const exportToXlsx = () => {
    // Só permite exportação nas abas 1 e 2
    if (activeTab !== 'relatorios' && activeTab !== 'validacoes-bpo') {
      toast.error('Exportação disponível apenas para as abas Relatórios e Validações por BPO');
      return;
    }

    let data: any[] = [];
    let filename = '';
    let headers: string[] = [];

    if (activeTab === 'relatorios') {
      headers = [
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
      data = candidates.map(candidate => [
        candidate.id_contratacao || '',
        candidate.nome,
        candidate.cpf || '',
        candidate.status_contratacao || '',
        candidate.progresso_documentos || '',
        candidate.bpo_responsavel || '',
        candidate.status,
        candidate.bpo_validou ? 'SIM' : 'NÃO',
        new Date(candidate.created_at).toLocaleDateString('pt-BR')
      ]);
      filename = 'candidatos';
    } else if (activeTab === 'validacoes-bpo') {
      headers = ['BPO', 'Código', 'Nome', 'Data', 'Status'];
      data = bpoValidationExtract.map(extract => [
        extract.bpo_name,
        extract.candidate_cpf,
        extract.candidate_name,
        new Date(extract.processed_at).toLocaleDateString('pt-BR'),
        extract.status_after
      ]);
      filename = 'extrato_validacoes_bpo';
    }

    try {
      const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
      XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast.success('Relatório XLSX exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar XLSX:', error);
      toast.error('Erro ao exportar relatório XLSX');
    }
  };

  const applyDateFilter = () => {
    loadActivityReports();
  };

  useEffect(() => {
    loadReportsData();
  }, []);

  useEffect(() => {
    if (dateFrom || dateTo) {
      loadActivityReports();
    }
  }, [dateFrom, dateTo]);

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

  const canExport = activeTab === 'relatorios' || activeTab === 'validacoes-bpo';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <div className="flex gap-2">
          <Button 
            onClick={exportToCsv} 
            variant="outline"
            disabled={!canExport}
          >
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button 
            onClick={exportToXlsx}
            disabled={!canExport}
          >
            <Download className="mr-2 h-4 w-4" />
            XLSX
          </Button>
        </div>
      </div>

      {/* Filtros de Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtros por Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="dateFrom">Data Inicial</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dateTo">Data Final</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <Button onClick={applyDateFilter} variant="outline">
              Aplicar Filtro
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          <TabsTrigger value="validacoes-bpo">Validações por BPO</TabsTrigger>
          <TabsTrigger value="media-validacoes">Média de Validações por BPO</TabsTrigger>
          <TabsTrigger value="tempo-validacoes">Tempo Médio entre Validações</TabsTrigger>
        </TabsList>

        {/* Aba 1: Relatórios - Dados dos candidatos */}
        <TabsContent value="relatorios" className="space-y-6">
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
        </TabsContent>

        {/* Aba 2: Validações por BPO */}
        <TabsContent value="validacoes-bpo">
          <Card>
            <CardHeader>
              <CardTitle>Extrato de Validações dos BPO</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>BPO</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bpoValidationExtract.map((extract, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{extract.bpo_name}</TableCell>
                        <TableCell>{extract.candidate_cpf}</TableCell>
                        <TableCell>{extract.candidate_name}</TableCell>
                        <TableCell>
                          {new Date(extract.processed_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            ['APPROVED', 'Validado', 'validado', 'VALIDADO'].includes(extract.status_after) 
                              ? "default" 
                              : "secondary"
                          }>
                            {extract.status_after}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {bpoValidationExtract.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                          Nenhum dado encontrado para o período selecionado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {bpoValidationExtract.length > 0 && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="font-medium">
                    Total de Registros: {bpoValidationExtract.length}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba 3: Média de Validações por BPO */}
        <TabsContent value="media-validacoes">
          <Card>
            <CardHeader>
              <CardTitle>Média de Validações por Dia e Mês por BPO</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>BPO</TableHead>
                      <TableHead>Média Diária</TableHead>
                      <TableHead>Média Mensal</TableHead>
                      <TableHead>Total Validações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bpoValidationAverages.map((stat, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{stat.bpo_name}</TableCell>
                        <TableCell>{stat.daily_average.toFixed(2)}</TableCell>
                        <TableCell>{stat.monthly_average.toFixed(2)}</TableCell>
                        <TableCell>{stat.total_validations}</TableCell>
                      </TableRow>
                    ))}
                    {bpoValidationAverages.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                          Nenhum dado encontrado para o período selecionado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba 4: Tempo médio entre validações */}
        <TabsContent value="tempo-validacoes">
          <Card>
            <CardHeader>
              <CardTitle>Tempo Médio entre Validações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>BPO</TableHead>
                      <TableHead>Tempo Médio (minutos)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeBetweenValidations.map((stat, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{stat.bpo_name}</TableCell>
                        <TableCell>{stat.average_time_minutes.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    {timeBetweenValidations.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground py-4">
                          Nenhum dado encontrado para o período selecionado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};