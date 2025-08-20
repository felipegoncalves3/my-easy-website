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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, Eye, CheckCircle, Filter, ChevronLeft, ChevronRight, X, RotateCcw, Copy, Zap, ScanLine, AlertTriangle, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
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
  const [selectedBPOs, setSelectedBPOs] = useState<string[]>([]);
  const [availableBPOs, setAvailableBPOs] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isCompactMode, setIsCompactMode] = useState(() => {
    const saved = localStorage.getItem('operationalPanel_compactMode');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [quickFilters, setQuickFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'id_contratacao' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const { user } = useAuth();

  // Load saved filters from localStorage
  useEffect(() => {
    const savedBPOs = localStorage.getItem('operationalPanel_selectedBPOs');
    if (savedBPOs) {
      try {
        setSelectedBPOs(JSON.parse(savedBPOs));
      } catch (error) {
        console.error('Error parsing saved BPO filters:', error);
      }
    }
  }, []);

  // Save compact mode preference
  useEffect(() => {
    localStorage.setItem('operationalPanel_compactMode', JSON.stringify(isCompactMode));
  }, [isCompactMode]);

  // Copy CPF function
  const copyCPF = (cpf: string) => {
    if (cpf && cpf !== 'N/A') {
      navigator.clipboard.writeText(cpf.replace(/\D/g, ''));
      toast.success('CPF copiado!');
    }
  };

  // Copy Name function
  const copyName = (name: string) => {
    if (name && name !== 'N/A') {
      navigator.clipboard.writeText(name);
      toast.success('Nome copiado!');
    }
  };

  // Copy ID Contratação function
  const copyIdContratacao = (id: number | null) => {
    if (id !== null && id !== undefined) {
      navigator.clipboard.writeText(id.toString());
      toast.success('ID copiado para a área de transferência');
    }
  };

  // Format CPF with mask
  const formatCPF = (cpf: string) => {
    if (!cpf || cpf === 'N/A') return 'N/A';
    const numbers = cpf.replace(/\D/g, '');
    if (numbers.length === 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
  };

  // Get priority level
  const getPriorityLevel = (candidate: Candidate) => {
    if (candidate.priorizar_status && candidate.priorizar_data_admissao) return 'Alta';
    if (candidate.priorizar_status || candidate.priorizar_data_admissao) return 'Média';
    return 'Baixa';
  };

  // Quick filter functions
  const getQuickFilterCounts = () => {
    const base = activeTab === 'pendentes' 
      ? candidates.filter(c => !c.bpo_validou)
      : candidates.filter(c => c.bpo_validou);
    
    return {
      prioridadeData: base.filter(c => c.priorizar_data_admissao && c.priorizar_data_admissao !== 'N/A').length,
      prioridadeStatus: base.filter(c => c.priorizar_status && c.priorizar_status !== 'N/A').length,
      progress60: base.filter(c => (c.progresso_documentos || 0) >= 60).length,
      total: base.length
    };
  };

  const handleQuickFilter = (filter: string) => {
    const isActive = quickFilters.includes(filter);
    if (isActive) {
      setQuickFilters(quickFilters.filter(f => f !== filter));
    } else {
      setQuickFilters([...quickFilters, filter]);
    }
  };

  // Handle sorting for ID Contratação
  const handleSort = (column: 'id_contratacao') => {
    if (sortBy === column) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        setSortBy(null);
        setSortOrder('asc');
      }
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const loadCandidates = async () => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCandidates(data || []);
      setFilteredCandidates(data || []);
      
      // Update available BPOs
      const bpos = [...new Set(
        (data || [])
          .map(candidate => candidate.bpo_responsavel)
          .filter(bpo => bpo && bpo.trim() !== '')
      )].sort();
      setAvailableBPOs(bpos);
    } catch (error) {
      console.error('Erro ao carregar candidatos:', error);
      toast.error('Erro ao carregar candidatos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateCandidate = async (candidateId: string) => {
    try {
      // Buscar dados completos do candidato antes da validação
      const { data: candidateData, error: fetchError } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar candidato:', fetchError);
        toast.error('Erro ao buscar dados do candidato');
        return;
      }

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

      // Registrar atividade no log usando edge function
      console.log('Tentando registrar log de atividade para candidato:', candidateId);
      console.log('Data de admissão do candidato:', candidateData.data_admissao);
      try {
        const { data: logData, error: logError } = await supabase.functions.invoke('log-activity', {
          body: {
            candidate_id: candidateId,
            candidate_name: candidateData.nome,
            candidate_cpf: candidateData.cpf,
            action_type: 'VALIDATION',
            status_before: candidateData.status || 'pendente',
            status_after: 'validado',
            bpo_user_id: user?.id,
            bpo_name: user?.full_name || user?.username,
            notes: `Candidato validado por ${user?.full_name || user?.username}`,
            data_admissao: candidateData.data_admissao
          }
        });

        if (logError) {
          console.error('Erro ao registrar log de atividade:', logError);
        } else {
          console.log('Log de atividade registrado com sucesso:', logData);
        }
      } catch (logError) {
        console.error('Erro ao registrar log de atividade:', logError);
      }

      // Buscar dados atualizados do candidato
      const { data: updatedCandidate, error: updatedError } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .single();

      if (updatedError) {
        console.error('Erro ao buscar candidato atualizado:', updatedError);
      }

      // Chamar webhook se configurado
      try {
        const { error: webhookError } = await supabase.functions.invoke('webhook-validar', {
          body: { candidateData: updatedCandidate || candidateData }
        });

        if (webhookError) {
          console.error('Erro ao chamar webhook:', webhookError);
        }
      } catch (webhookError) {
        console.error('Erro ao processar webhook:', webhookError);
      }

      // Atualizar na planilha do Google Sheets
      try {
        const { error: sheetError } = await supabase.functions.invoke('update-sheet', {
          body: { candidateId }
        });

        if (sheetError) {
          console.error('Erro ao atualizar planilha:', sheetError);
        }
      } catch (sheetError) {
        console.error('Erro ao chamar função de atualização da planilha:', sheetError);
      }

      // Sempre mostrar sucesso após validação
      toast.success('Candidato validado com sucesso!');

      await loadCandidates();
      
    } catch (error) {
      console.error('Erro ao validar candidato:', error);
      toast.error('Erro ao validar candidato');
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    applyFilters(value, priorityFilter, activeTab, selectedBPOs);
  };

  const handlePriorityFilter = (filter: string) => {
    setPriorityFilter(filter);
    applyFilters(searchTerm, filter, activeTab, selectedBPOs);
  };

  const handleBPOFilter = (bpos: string[]) => {
    setSelectedBPOs(bpos);
    localStorage.setItem('operationalPanel_selectedBPOs', JSON.stringify(bpos));
    applyFilters(searchTerm, priorityFilter, activeTab, bpos);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setPriorityFilter('');
    setSelectedBPOs([]);
    localStorage.removeItem('operationalPanel_selectedBPOs');
    applyFilters('', '', activeTab, []);
  };

  const applyFilters = (search: string, priority: string, tab: string, bpos: string[] = selectedBPOs) => {
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

    // Apply BPO filter
    if (bpos.length > 0) {
      filtered = filtered.filter(candidate => 
        candidate.bpo_responsavel && bpos.includes(candidate.bpo_responsavel)
      );
    }

    // Apply quick filters
    quickFilters.forEach(filter => {
      switch (filter) {
        case 'prioridadeData':
          filtered = filtered.filter(c => c.priorizar_data_admissao && c.priorizar_data_admissao !== 'N/A');
          break;
        case 'prioridadeStatus':
          filtered = filtered.filter(c => c.priorizar_status && c.priorizar_status !== 'N/A');
          break;
        case 'progress60':
          filtered = filtered.filter(c => (c.progresso_documentos || 0) >= 60);
          break;
      }
    });

    // Apply sorting
    if (sortBy === 'id_contratacao') {
      filtered.sort((a, b) => {
        const aValue = a.id_contratacao || 0;
        const bValue = b.id_contratacao || 0;
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      });
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
    applyFilters(searchTerm, priorityFilter, tab, selectedBPOs);
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
    applyFilters(searchTerm, priorityFilter, activeTab, selectedBPOs);
  }, [candidates, activeTab, selectedBPOs, quickFilters, sortBy, sortOrder]);

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
    <div className="rounded-2xl border shadow-sm overflow-hidden">
      <Table className="w-auto text-sm">
        <TableHeader className="bg-muted/50 sticky top-0 z-10">
          <TableRow className="hover:bg-transparent border-b h-10">
            <TableHead 
              className="text-xs uppercase tracking-wide text-muted-foreground font-semibold whitespace-nowrap sticky left-0 bg-muted/50 z-20 cursor-pointer hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
              onClick={() => handleSort('id_contratacao')}
              tabIndex={0}
            >
              <div className="flex items-center gap-1">
                ID Contratação
                {sortBy === 'id_contratacao' && (
                  sortOrder === 'asc' ? 
                    <ChevronUp className="h-3 w-3" /> : 
                    <ChevronDown className="h-3 w-3" />
                )}
              </div>
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground font-semibold whitespace-nowrap sticky left-[120px] bg-muted/50 z-20 min-w-[250px]">Nome</TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground font-semibold whitespace-nowrap">CPF</TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground font-semibold whitespace-nowrap">Status Contratação</TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground font-semibold whitespace-nowrap">Motivo</TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground font-semibold whitespace-nowrap">Progresso Docs</TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground font-semibold whitespace-nowrap">BPO Responsável</TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground font-semibold whitespace-nowrap">Prioridade</TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground font-semibold whitespace-nowrap">Status</TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground font-semibold whitespace-nowrap text-center">Acesso</TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground font-semibold whitespace-nowrap text-center sticky right-0 bg-muted/50 z-20">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedCandidates.map((candidate, index) => (
            <TableRow 
              key={candidate.id} 
              className={`${index % 2 === 0 ? 'table-row-zebra' : ''} ${isCompactMode ? 'h-12' : 'h-14'} hover:bg-accent transition-colors`}
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TableCell 
                      className="tabular-nums font-medium text-sm whitespace-nowrap sticky left-0 bg-inherit cursor-pointer hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                      onClick={() => copyIdContratacao(candidate.id_contratacao)}
                      tabIndex={0}
                    >
                      <div className="flex items-center gap-2">
                        <span>{candidate.id_contratacao || 'N/A'}</span>
                        {candidate.id_contratacao && <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground transition-smooth" />}
                      </div>
                    </TableCell>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copiar ID</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TableCell 
                      className="font-medium text-sm sticky left-[120px] bg-inherit min-w-[250px] max-w-[280px] cursor-pointer hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                      onClick={() => copyName(candidate.nome)}
                      tabIndex={0}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <span className="truncate flex-1" title={candidate.nome}>{candidate.nome}</span>
                        <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground transition-smooth flex-shrink-0" />
                      </div>
                    </TableCell>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Clique para copiar nome</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TableCell 
                      className="tabular-nums text-sm whitespace-nowrap cursor-pointer hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                      onClick={() => copyCPF(candidate.cpf || '')}
                      tabIndex={0}
                    >
                      <div className="flex items-center gap-2">
                        <span>{formatCPF(candidate.cpf || '')}</span>
                        {candidate.cpf && candidate.cpf !== 'N/A' && <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground transition-smooth" />}
                      </div>
                    </TableCell>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Clique para copiar CPF</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TableCell className="text-sm whitespace-nowrap">{candidate.status_contratacao || 'N/A'}</TableCell>
              <TableCell className="text-sm whitespace-nowrap max-w-[150px]">
                <span className="truncate block" title={candidate.motivo || 'N/A'}>
                  {candidate.motivo || 'N/A'}
                </span>
              </TableCell>
              <TableCell className="text-sm whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <div className="w-20 h-2.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 rounded-full ${
                        (candidate.progresso_documentos || 0) < 60 ? 'bg-orange-500' : 'bg-primary'
                      }`}
                      style={{ width: `${candidate.progresso_documentos || 0}%` }}
                    />
                  </div>
                  <span className="tabular-nums text-xs text-muted-foreground">
                    {candidate.progresso_documentos !== null && candidate.progresso_documentos !== undefined ? `${candidate.progresso_documentos}%` : '0%'}
                  </span>
                  {(candidate.progresso_documentos || 0) >= 60 && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </TableCell>

              <TableCell className="text-sm whitespace-nowrap">{candidate.bpo_responsavel || 'N/A'}</TableCell>
              
              <TableCell className="text-sm whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={getPriorityLevel(candidate) === 'Alta' ? 'destructive' : getPriorityLevel(candidate) === 'Média' ? 'default' : 'secondary'}
                    className="inline-flex items-center gap-1 rounded-full border bg-white px-2.5 h-7 text-xs"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      getPriorityLevel(candidate) === 'Alta' ? 'bg-red-500' : 
                      getPriorityLevel(candidate) === 'Média' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`} />
                    {getPriorityLevel(candidate)}
                  </Badge>
                  {(candidate.priorizar_status || candidate.priorizar_data_admissao) && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <Zap className="h-4 w-4 text-yellow-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Priorizar</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </TableCell>

              <TableCell className="whitespace-nowrap">
                <Badge 
                  className={`inline-flex items-center gap-1 rounded-full border bg-white px-2.5 h-7 text-xs ${
                    candidate.bpo_validou 
                      ? "border-primary/20 text-primary bg-primary/10" 
                      : "border-orange-200 text-orange-700 bg-orange-50"
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    candidate.bpo_validou ? 'bg-primary' : 'bg-orange-500'
                  }`} />
                  {candidate.bpo_validou ? "Validado" : "Pendente"}
                </Badge>
              </TableCell>

              <TableCell className="text-center">
                {candidate.id_contratacao && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                          onClick={() => {
                            const url = `https://tecfyrh.com.br/admissions/${candidate.id_contratacao}?menu=document`;
                            window.open(url, '_blank', 'noopener,noreferrer');
                          }}
                          aria-label={`Abrir Admissão ${candidate.id_contratacao}`}
                        >
                          <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground transition-smooth" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Abrir Admissão</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </TableCell>

              <TableCell className="whitespace-nowrap sticky right-0 bg-inherit">
                <div className="flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCandidate(candidate)}
                        className="h-8 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Detalhes do Candidato</DialogTitle>
                      </DialogHeader>
                      {selectedCandidate && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="font-semibold text-sm text-muted-foreground">ID Contratação:</label>
                            <p className="font-medium">{selectedCandidate.id_contratacao || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="font-semibold text-sm text-muted-foreground">Nome:</label>
                            <p className="font-medium">{selectedCandidate.nome}</p>
                          </div>
                          <div>
                            <label className="font-semibold text-sm text-muted-foreground">CPF:</label>
                            <p className="font-medium">{selectedCandidate.cpf || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="font-semibold text-sm text-muted-foreground">Status Contratação:</label>
                            <p className="font-medium">{selectedCandidate.status_contratacao || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="font-semibold text-sm text-muted-foreground">Motivo:</label>
                            <p className="font-medium">{selectedCandidate.motivo || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="font-semibold text-sm text-muted-foreground">Progresso Documentos:</label>
                            <p className="font-medium">{selectedCandidate.progresso_documentos ? `${selectedCandidate.progresso_documentos}%` : 'N/A'}</p>
                          </div>
                          <div>
                            <label className="font-semibold text-sm text-muted-foreground">Criado em:</label>
                            <p className="font-medium">{selectedCandidate.criado_em || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="font-semibold text-sm text-muted-foreground">Data Admissão:</label>
                            <p className="font-medium">{selectedCandidate.data_admissao || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="font-semibold text-sm text-muted-foreground">Data Expiração:</label>
                            <p className="font-medium">{selectedCandidate.data_expiracao || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="font-semibold text-sm text-muted-foreground">Evolução:</label>
                            <p className="font-medium">{selectedCandidate.evolucao || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="font-semibold text-sm text-muted-foreground">BPO Responsável:</label>
                            <p className="font-medium">{selectedCandidate.bpo_responsavel || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="font-semibold text-sm text-muted-foreground">Priorizar Status:</label>
                            <p className="font-medium">{selectedCandidate.priorizar_status || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="font-semibold text-sm text-muted-foreground">Priorizar Data Admissão:</label>
                            <p className="font-medium">{selectedCandidate.priorizar_data_admissao || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="font-semibold text-sm text-muted-foreground">Em Progresso ≥60:</label>
                            <p className="font-medium">{selectedCandidate.em_progresso_ge_60 || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="font-semibold text-sm text-muted-foreground">BPO que Validou:</label>
                            <p className="font-medium">{selectedCandidate.bpo_que_validou || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="font-semibold text-sm text-muted-foreground">Status:</label>
                            <Badge variant={selectedCandidate.bpo_validou ? "default" : "secondary"} className="ml-2">
                              {selectedCandidate.bpo_validou ? 'Validado' : 'Pendente'}
                            </Badge>
                          </div>
                          <div>
                            <label className="font-semibold text-sm text-muted-foreground">Criado em:</label>
                            <p className="font-medium">{new Date(selectedCandidate.created_at).toLocaleDateString('pt-BR')}</p>
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
                      className="h-8 transition-all duration-200 hover:scale-105 bg-primary hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
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
        <div className="text-center py-12 text-muted-foreground">
          <div className="flex flex-col items-center gap-2">
            <Search className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-lg font-medium">
              {searchTerm ? 'Nenhum candidato encontrado' : 'Nenhum candidato cadastrado'}
            </p>
            <p className="text-sm">
              {searchTerm ? 'Tente ajustar os filtros de busca' : 'Os candidatos aparecerão aqui quando carregados'}
            </p>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-6 px-4 pb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
          >
            <ChevronLeft className="h-4 w-4" />
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
                  className="h-8 w-8 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
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
            className="h-8 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="text-center mt-4 pb-4 text-sm text-muted-foreground">
        Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, filteredCandidates.length)} - {Math.min(currentPage * itemsPerPage, filteredCandidates.length)} de {filteredCandidates.length} itens
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Modern Header */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Painel Operacional</h1>
        <p className="text-base text-muted-foreground">Candidatos para Validação</p>
        <div className="h-px bg-border mt-4" />
      </div>

      {/* Filter Bar */}
      <div className="bg-muted/40 border rounded-2xl p-3 md:p-4 space-y-4">
        {/* Quick Filter Chips */}
        <div className="flex flex-wrap gap-3 items-center">
          {(() => {
            const counts = getQuickFilterCounts();
            return (
              <>
                <Button
                  variant={quickFilters.includes('prioridadeData') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleQuickFilter('prioridadeData')}
                  className="rounded-full border bg-white hover:bg-accent px-3 h-9 text-sm focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Priorizar Data ({counts.prioridadeData})
                </Button>
                <Button
                  variant={quickFilters.includes('prioridadeStatus') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleQuickFilter('prioridadeStatus')}
                  className="rounded-full border bg-white hover:bg-accent px-3 h-9 text-sm focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                >
                  <Zap className="h-4 w-4 mr-1" />
                  Priorizar Status ({counts.prioridadeStatus})
                </Button>
                <Button
                  variant={quickFilters.includes('progress60') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleQuickFilter('progress60')}
                  className="rounded-full border bg-white hover:bg-accent px-3 h-9 text-sm focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                >
                  <ScanLine className="h-4 w-4 mr-1" />
                  ≥60% ({counts.progress60})
                </Button>
                <Badge variant="outline" className="rounded-full border bg-white px-3 h-9 text-sm">
                  Total: {counts.total}
                </Badge>
              </>
            );
          })()}
        </div>

        {/* Main Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF ou ID contratação..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1 pl-10 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
            />
          </div>
          
          {/* BPO Filter */}
          {availableBPOs.length > 0 && (
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-[250px] justify-start text-left font-normal focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    {selectedBPOs.length === 0
                      ? "Todos os BPOs"
                      : selectedBPOs.length === 1
                      ? selectedBPOs[0]
                      : `${selectedBPOs.length} BPOs selecionados`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar BPO..." />
                    <CommandList>
                      <CommandEmpty>Nenhum BPO encontrado.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => handleBPOFilter([])}
                          className="cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedBPOs.length === 0}
                            className="mr-2"
                          />
                          Todos os BPOs
                        </CommandItem>
                        {availableBPOs.map((bpo) => (
                          <CommandItem
                            key={bpo}
                            onSelect={() => {
                              const isSelected = selectedBPOs.includes(bpo);
                              if (isSelected) {
                                handleBPOFilter(selectedBPOs.filter((b) => b !== bpo));
                              } else {
                                handleBPOFilter([...selectedBPOs, bpo]);
                              }
                            }}
                            className="cursor-pointer"
                          >
                            <Checkbox
                              checked={selectedBPOs.includes(bpo)}
                              className="mr-2"
                            />
                            {bpo}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {activeTab === 'pendentes' && (
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={priorityFilter} onValueChange={handlePriorityFilter}>
                <SelectTrigger className="w-[200px] focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2">
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

          {/* Clear filters button */}
          {(searchTerm || priorityFilter || selectedBPOs.length > 0 || quickFilters.length > 0) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                clearAllFilters();
                setQuickFilters([]);
              }}
              className="flex items-center space-x-1 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Limpar filtros</span>
            </Button>
          )}
        </div>

        {/* Selected BPO chips */}
        {selectedBPOs.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground">BPOs selecionados:</span>
            {selectedBPOs.map((bpo) => (
              <Badge
                key={bpo}
                variant="secondary"
                className="flex items-center gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground rounded-full px-3 h-7 text-xs transition-colors"
                onClick={() => handleBPOFilter(selectedBPOs.filter((b) => b !== bpo))}
              >
                {bpo}
                <X className="h-3 w-3" />
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Card */}
      <Card className="rounded-2xl border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-semibold">Candidatos</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Densidade:</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs">Compacto</span>
                  <Switch
                    checked={!isCompactMode}
                    onCheckedChange={(checked) => setIsCompactMode(!checked)}
                  />
                  <span className="text-xs">Conforto</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="px-0">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <div className="px-6">
              <TabsList className="rounded-full bg-muted/50 p-1 h-10">
                <TabsTrigger 
                  value="pendentes" 
                  className="rounded-full px-4 py-2 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                >
                  Pendentes
                </TabsTrigger>
                <TabsTrigger 
                  value="todos" 
                  className="rounded-full px-4 py-2 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                >
                  Todos
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="pendentes" className="mt-6">
              {renderCandidateTable(false)}
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
