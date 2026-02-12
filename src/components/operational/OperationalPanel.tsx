import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Candidate } from '@/types';

// Components
import { ProductivityMetrics } from './ProductivityMetrics';
import { CandidateFilters } from './CandidateFilters';
import { CandidateTable } from './CandidateTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export const OperationalPanel = () => {
  // State
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pendentes');

  // Filter State
  const [filters, setFilters] = useState({
    searchTerm: '',
    statusFilter: 'todos',
    selectedBPOs: [] as string[],
    admissionStart: '',
    admissionEnd: ''
  });

  // Sort State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
    key: '',
    direction: null
  });

  // BPO List
  const [availableBPOs, setAvailableBPOs] = useState<string[]>([]);

  // Matrix Map
  const [matrixMap, setMatrixMap] = useState<Record<number, string>>({});

  const { user } = useAuth();
  const [firstViewTime, setFirstViewTime] = useState<string | null>(null);

  // Initial Load
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadCompanies(), loadCandidates()]);
    };

    loadData();
    setFirstViewTime(new Date().toISOString());

    // Polling Strategy: Update every 1 hour (3600000 ms) instead of Realtime
    const intervalId = setInterval(() => {
      loadCandidates();
    }, 3600000);

    return () => clearInterval(intervalId);
  }, []);

  // Effect: Apply Filters whenever dependencies change
  useEffect(() => {
    applyFilters();
  }, [candidates, filters, activeTab, sortConfig]);

  const loadCandidates = async () => {
    try {
      // Fetching everything from the table. We will calculate flags dynamically.
      const { data, error } = await supabase
        .from('bpo_producao')
        .select('*');

      if (error) throw error;

      const raw = (data as any[]) || [];

      // Calculate dynamic flags for each candidate
      const today = new Date();
      const next5Days = new Date();
      next5Days.setDate(today.getDate() + 5);

      const computed = raw.map(c => {
        const admDate = c.data_de_admissao_10040 ? new Date(c.data_de_admissao_10040) : null;
        const status = (c.status_contratacao || '').toUpperCase();
        const progress = c.progressao_documentos || 0;

        return {
          ...c,
          flag_prioridade_status: status === 'VALIDAÇÃO',
          flag_prioridade_progresso: status === 'EM PROGRESSO' && progress >= 60,
          flag_prioridade_data: admDate !== null &&
            admDate <= next5Days &&
            !['ADMITIDO', 'CANCELADO', 'REPROVADO', 'FINALIZADO'].includes(status)
        } as Candidate;
      });

      setCandidates(computed);

      // Extract unique BPOs for filter
      const bpos = [...new Set(computed.map(c => c.bpo_responsavel).filter(Boolean) as string[])].sort();
      setAvailableBPOs(bpos);

      setIsLoading(false);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar fila.');
    }
  };

  const loadCompanies = async () => {
    const { data } = await supabase.from('empresas').select('id, nome');
    if (data) {
      const map: Record<number, string> = {};
      data.forEach((c: any) => { map[c.id] = c.nome; });
      setMatrixMap(map);
    }
  };

  const applyFilters = () => {
    let result = [...candidates];

    // RULE: Pending vs History
    if (activeTab === 'pendentes') {
      result = result.filter(c => {
        const status = (c.status_contratacao || '').toLowerCase().trim();
        const INVALID_STATUSES = ['finalizado', 'cancelado', 'arquivado', 'concluído', 'concluido', 'validado', 'iniciado'];

        if (INVALID_STATUSES.includes(status)) return false;

        const isPendingFlag = c.bpo_validou === null || c.bpo_validou === 'NÃO';
        const hasEvolution = c.evolucao === 'SIM';
        return (isPendingFlag || hasEvolution);
      });
    } else {
      result = result.filter(c => c.bpo_validou === 'SIM');
    }

    // Text Search
    if (filters.searchTerm) {
      const lower = filters.searchTerm.toLowerCase();
      result = result.filter(c =>
        c.nome.toLowerCase().includes(lower) ||
        c.cpf?.includes(lower) ||
        c.codigo?.toString().includes(lower)
      );
    }

    // Status Filter
    if (filters.statusFilter && filters.statusFilter !== 'todos') {
      result = result.filter(c => (c.status_contratacao || '').toUpperCase() === filters.statusFilter.toUpperCase());
    }

    // Date Range Filter (Admission Date)
    if (filters.admissionStart || filters.admissionEnd) {
      result = result.filter(c => {
        if (!c.data_de_admissao_10040) return false;
        let candidateDate = c.data_de_admissao_10040.split('T')[0];
        if (filters.admissionStart && candidateDate < filters.admissionStart) return false;
        if (filters.admissionEnd && candidateDate > filters.admissionEnd) return false;
        return true;
      });
    }

    // BPO Filter
    if (filters.selectedBPOs.length > 0) {
      result = result.filter(c => filters.selectedBPOs.includes(c.bpo_responsavel || ''));
    }

    // Sorting Logic
    if (sortConfig.key && sortConfig.direction) {
      result.sort((a: any, b: any) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Default Sorting Mode (Smart Operational Order)
      result.sort((a, b) => {
        // Rule: status='VALIDAÇÃO' (1), status='EM PROGRESSO' && progress >= 60 (2), data_adm <= 5 days (3), others (4)
        const getRank = (c: Candidate) => {
          if (c.flag_prioridade_status) return 1;
          if (c.flag_prioridade_progresso) return 2;
          if (c.flag_prioridade_data) return 3;
          return 4;
        };

        const rankA = getRank(a);
        const rankB = getRank(b);

        if (rankA !== rankB) return rankA - rankB;

        // Secondary sorting by admission date (nearest first)
        const dateA = a.data_de_admissao_10040 || '9999-99-99';
        const dateB = b.data_de_admissao_10040 || '9999-99-99';
        return dateA.localeCompare(dateB);
      });
    }

    setFilteredCandidates(result);
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        return { key: '', direction: null };
      }
      return { key, direction: 'asc' };
    });
  };

  const getPendingCount = () => {
    const INVALID_STATUSES = ['finalizado', 'cancelado', 'arquivado', 'concluído', 'concluido', 'validado', 'iniciado'];
    return candidates.filter(c => {
      const status = (c.status_contratacao || '').toLowerCase().trim();
      if (INVALID_STATUSES.includes(status)) return false;
      return (c.bpo_validou === null || c.bpo_validou === 'NÃO' || c.evolucao === 'SIM');
    }).length;
  };

  const getFilterCounts = () => {
    const base = candidates.filter(c => {
      const status = (c.status_contratacao || '').toLowerCase().trim();
      if (['finalizado', 'cancelado', 'arquivado', 'concluído', 'concluido', 'validado', 'iniciado'].includes(status)) return false;
      return (c.bpo_validou === null || c.bpo_validou === 'NÃO' || c.evolucao === 'SIM');
    });

    return {
      prioridadeData: base.filter(c => c.flag_prioridade_data).length,
      prioridadeStatus: base.filter(c => c.flag_prioridade_status).length,
      progress60: base.filter(c => c.flag_prioridade_progresso).length,
      total: base.length
    };
  };

  const handleValidation = async (id: string, code: string) => {
    if (!firstViewTime) {
      toast.error("Erro de sessão (tempo não registrado). Recarregue a página.");
      return;
    }

    const toastId = toast.loading('Validando...');

    try {
      const { error } = await supabase.rpc('validar_candidato', {
        p_codigo: code,
        p_usuario_id: user?.id,
        p_usuario_nome: (user as any)?.user_metadata?.full_name || user?.email || 'BPO',
        p_data_primeira_visualizacao: firstViewTime,
        p_motivo_validacao: 'Validação Operacional'
      });

      if (error) throw error;

      toast.dismiss(toastId);
      toast.success(`Candidato ${code} validado com sucesso!`);
      loadCandidates();
    } catch (err) {
      console.error(err);
      toast.dismiss(toastId);
      toast.error('Falha na validação.');
    }
  };

  const candidatesWithMatrix = filteredCandidates.map(c => ({
    ...c,
    matrix_name: c.id_empresa_matriz ? matrixMap[c.id_empresa_matriz] : undefined
  }));

  return (
    <div className="space-y-6 container mx-auto pt-6 pb-20 max-w-[1600px]">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Painel Operacional</h1>
            <p className="text-muted-foreground">Gerenciamento de fila e validações BPO</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              toast.info("Atualizando lista...");
              loadCandidates();
            }}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar Lista
          </Button>
        </div>
      </div>

      <ProductivityMetrics totalPending={getPendingCount()} />

      <CandidateFilters
        filters={filters}
        onChange={setFilters}
        availableBPOs={availableBPOs}
        counts={getFilterCounts()}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/30 p-1 mb-4 h-auto rounded-full">
          <TabsTrigger value="pendentes" className="rounded-full px-6 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Fila Operacional
          </TabsTrigger>
          <TabsTrigger value="todos" className="rounded-full px-6 py-2">
            Histórico / Já Validados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes" className="mt-0">
          <CandidateTable
            candidates={candidatesWithMatrix}
            isLoading={isLoading}
            onValidate={handleValidation}
            onRefresh={loadCandidates}
            readonly={false}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
        </TabsContent>

        <TabsContent value="todos" className="mt-0">
          <CandidateTable
            candidates={candidatesWithMatrix}
            isLoading={isLoading}
            onValidate={handleValidation}
            onRefresh={loadCandidates}
            readonly={true}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
