import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Eye, CheckCircle, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Candidate } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const OperationalPanel = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [paginatedCandidates, setPaginatedCandidates] = useState<Candidate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pendentes');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { user } = useAuth();

  const loadCandidates = async () => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCandidates(data || []);
      setFilteredCandidates(data || []);
    } catch (error) {
      console.error('Erro ao carregar candidatos:', error);
      toast.error('Erro ao carregar candidatos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateCandidate = async (candidateId: string) => {
    try {
      // Atualizar no banco de dados
      const { error } = await supabase
        .from('candidates')
        .update({
          bpo_validou: true,
          validado_por: user?.id,
          validado_em: new Date().toISOString(),
          bpo_que_validou: user?.full_name || user?.username,
          status: 'validado'
        })
        .eq('id', candidateId);

      if (error) throw error;

      // Atualizar na planilha do Google Sheets
      try {
        const { error: sheetError } = await supabase.functions.invoke('update-sheet', {
          body: { candidateId }
        });

        if (sheetError) {
          console.error('Erro ao atualizar planilha:', sheetError);
          toast.warning('Candidato validado no sistema, mas erro ao atualizar planilha');
        } else {
          toast.success('Candidato validado com sucesso no sistema e planilha!');
        }
      } catch (sheetError) {
        console.error('Erro ao chamar função de atualização da planilha:', sheetError);
        toast.warning('Candidato validado no sistema, mas erro ao atualizar planilha');
      }

      await loadCandidates();
      
    } catch (error) {
      console.error('Erro ao validar candidato:', error);
      toast.error('Erro ao validar candidato');
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    applyFilters(value, priorityFilter, activeTab);
  };

  const handlePriorityFilter = (filter: string) => {
    setPriorityFilter(filter);
    applyFilters(searchTerm, filter, activeTab);
  };

  const applyFilters = (search: string, priority: string, tab: string) => {
    let filtered = candidates;

    // Filter by tab
    if (tab === 'pendentes') {
      filtered = filtered.filter(candidate => !candidate.bpo_validou);
    } else if (tab === 'todos') {
      filtered = filtered.filter(candidate => candidate.bpo_validou);
    }

    // Apply search filter
    if (search) {
      filtered = filtered.filter(candidate =>
        candidate.nome.toLowerCase().includes(search.toLowerCase()) ||
        candidate.cpf?.includes(search) ||
        candidate.id_contratacao?.toString().includes(search)
      );
    }

    // Apply priority filter
    if (priority && priority !== 'todos') {
      switch (priority) {
        case 'status':
          filtered = filtered.filter(candidate => candidate.priorizar_status);
          break;
        case 'progresso':
          filtered = filtered.filter(candidate => candidate.em_progresso_ge_60);
          break;
        case 'admissao':
          filtered = filtered.filter(candidate => candidate.priorizar_data_admissao);
          break;
      }
    }

    setFilteredCandidates(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const paginateResults = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedCandidates(filteredCandidates.slice(startIndex, endIndex));
  };

  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    applyFilters(searchTerm, priorityFilter, tab);
  };

  useEffect(() => {
    loadCandidates();

    // Configurar tempo real para candidatos
    const channel = supabase
      .channel('operational-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'candidates'
        },
        () => {
          loadCandidates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    applyFilters(searchTerm, priorityFilter, activeTab);
  }, [candidates, activeTab]);

  useEffect(() => {
    paginateResults();
  }, [filteredCandidates, currentPage]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderCandidateTable = (showPriorityColumns = false) => (
    <div className="overflow-x-auto">
      <Table className="w-auto text-sm table-modern"> {/* Reduce font size by 30% */}
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border/30">
            <TableHead className="text-xs w-auto whitespace-nowrap font-semibold text-muted-foreground">ID Contratação</TableHead>
            <TableHead className="text-xs w-auto whitespace-nowrap font-semibold text-muted-foreground">Nome</TableHead>
            <TableHead className="text-xs w-auto whitespace-nowrap font-semibold text-muted-foreground">CPF</TableHead>
            <TableHead className="text-xs w-auto whitespace-nowrap font-semibold text-muted-foreground">Status Contratação</TableHead>
            <TableHead className="text-xs w-auto whitespace-nowrap font-semibold text-muted-foreground">Motivo</TableHead>
            <TableHead className="text-xs w-auto whitespace-nowrap font-semibold text-muted-foreground">Progresso Docs</TableHead>
            <TableHead className="text-xs w-auto whitespace-nowrap font-semibold text-muted-foreground">BPO Responsável</TableHead>
            {showPriorityColumns && (
              <>
                <TableHead className="text-xs w-auto whitespace-nowrap font-semibold text-muted-foreground">Progresso ≥60</TableHead>
                <TableHead className="text-xs w-auto whitespace-nowrap font-semibold text-muted-foreground">Priorizar Data</TableHead>
                <TableHead className="text-xs w-auto whitespace-nowrap font-semibold text-muted-foreground">Priorizar Status</TableHead>
              </>
            )}
            <TableHead className="text-xs w-auto whitespace-nowrap font-semibold text-muted-foreground">Status</TableHead>
            <TableHead className="text-xs w-auto whitespace-nowrap font-semibold text-muted-foreground text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedCandidates.map((candidate) => (
            <TableRow key={candidate.id} className="table-row-modern">
              <TableCell className="font-medium text-xs whitespace-nowrap">{candidate.id_contratacao || 'N/A'}</TableCell>
              <TableCell className="font-medium text-xs whitespace-nowrap">{candidate.nome}</TableCell>
              <TableCell className="text-xs whitespace-nowrap font-mono">{candidate.cpf || 'N/A'}</TableCell>
              <TableCell className="text-xs whitespace-nowrap">{candidate.status_contratacao || 'N/A'}</TableCell>
              <TableCell className="text-xs whitespace-nowrap">{candidate.motivo || 'N/A'}</TableCell>
              <TableCell className="text-xs whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        (candidate.progresso_documentos || 0) < 60 ? 'bg-warning' : 'bg-primary'
                      }`}
                      style={{ width: `${candidate.progresso_documentos || 0}%` }}
                    />
                  </div>
                  <span className="text-xs">{candidate.progresso_documentos ? `${candidate.progresso_documentos}%` : 'N/A'}</span>
                </div>
              </TableCell>
              <TableCell className="text-xs whitespace-nowrap">{candidate.bpo_responsavel || 'N/A'}</TableCell>
              {showPriorityColumns && (
                <>
                  <TableCell className="text-xs whitespace-nowrap">{candidate.em_progresso_ge_60 || 'N/A'}</TableCell>
                  <TableCell className="text-xs whitespace-nowrap">{candidate.priorizar_data_admissao || 'N/A'}</TableCell>
                  <TableCell className="text-xs whitespace-nowrap">{candidate.priorizar_status || 'N/A'}</TableCell>
                </>
              )}
              <TableCell className="whitespace-nowrap">
                <Badge 
                  className={candidate.bpo_validou ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"}
                >
                  {candidate.bpo_validou ? "Validado" : "Pendente"}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <div className="flex space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCandidate(candidate)}
                        className="text-xs"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Detalhes do Candidato</DialogTitle>
                      </DialogHeader>
                      {selectedCandidate && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="font-semibold">ID Contratação:</label>
                            <p>{selectedCandidate.id_contratacao || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="font-semibold">Nome:</label>
                            <p>{selectedCandidate.nome}</p>
                          </div>
                          <div>
                            <label className="font-semibold">CPF:</label>
                            <p>{selectedCandidate.cpf || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="font-semibold">Status Contratação:</label>
                            <p>{selectedCandidate.status_contratacao || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="font-semibold">Motivo:</label>
                            <p>{selectedCandidate.motivo || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="font-semibold">Progresso Documentos:</label>
                            <p>{selectedCandidate.progresso_documentos ? `${selectedCandidate.progresso_documentos}%` : 'N/A'}</p>
                          </div>
                          <div>
                            <label className="font-semibold">Criado em:</label>
                            <p>{selectedCandidate.criado_em || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="font-semibold">Data Admissão:</label>
                            <p>{selectedCandidate.data_admissao || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="font-semibold">Data Expiração:</label>
                            <p>{selectedCandidate.data_expiracao || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="font-semibold">Evolução:</label>
                            <p>{selectedCandidate.evolucao || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="font-semibold">BPO Responsável:</label>
                            <p>{selectedCandidate.bpo_responsavel || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="font-semibold">Priorizar Status:</label>
                            <p>{selectedCandidate.priorizar_status || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="font-semibold">Priorizar Data Admissão:</label>
                            <p>{selectedCandidate.priorizar_data_admissao || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="font-semibold">Em Progresso ≥60:</label>
                            <p>{selectedCandidate.em_progresso_ge_60 || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="font-semibold">BPO que Validou:</label>
                            <p>{selectedCandidate.bpo_que_validou || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="font-semibold">Status:</label>
                            <Badge variant={selectedCandidate.bpo_validou ? "default" : "secondary"} className="ml-2">
                              {selectedCandidate.bpo_validou ? 'Validado' : 'Pendente'}
                            </Badge>
                          </div>
                          <div>
                            <label className="font-semibold">Criado em:</label>
                            <p>{new Date(selectedCandidate.created_at).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  
                  {!candidate.bpo_validou && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleValidateCandidate(candidate.id)}
                      className="transition-all duration-200 hover:scale-105 bg-primary hover:bg-primary/90 text-xs"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Validar
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {paginatedCandidates.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm ? 'Nenhum candidato encontrado' : 'Nenhum candidato cadastrado'}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="text-xs"
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="text-xs w-8 h-8"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="text-xs"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="text-center mt-4 text-xs text-muted-foreground">
        Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, filteredCandidates.length)} - {Math.min(currentPage * itemsPerPage, filteredCandidates.length)} de {filteredCandidates.length} itens
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Painel Operacional</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Candidatos para Validação</CardTitle>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF ou ID contratação..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
            {activeTab === 'pendentes' && (
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={priorityFilter} onValueChange={handlePriorityFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filtrar prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="status">Priorizar Status</SelectItem>
                    <SelectItem value="progresso">Priorizar Progresso ≥60</SelectItem>
                    <SelectItem value="admissao">Priorizar Data Admissão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pendentes">PENDENTES</TabsTrigger>
              <TabsTrigger value="todos">TODOS</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pendentes" className="mt-6">
              {renderCandidateTable(true)}
            </TabsContent>
            
            <TabsContent value="todos" className="mt-6">
              {renderCandidateTable(false)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};