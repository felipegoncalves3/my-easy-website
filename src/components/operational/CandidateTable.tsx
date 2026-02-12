import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, CheckCircle, Copy, Zap, ExternalLink, AlertTriangle, ArrowUp, ArrowDown, ArrowUpDown, ScanLine } from 'lucide-react';
import { Candidate } from '@/types';
import { AuditLogSection } from './AuditLogSection';
import { toast } from 'sonner';

interface CandidateTableProps {
    candidates: Candidate[];
    isLoading: boolean;
    onValidate: (id: string, code: string) => void;
    onRefresh: () => void;
    isCompactMode?: boolean;
    readonly?: boolean; // If true, hides "Validar" button (for "Todos" tab)
    sortConfig: {
        key: string;
        direction: 'asc' | 'desc' | null;
    };
    onSort: (key: string) => void;
}

export const CandidateTable = ({
    candidates,
    isLoading,
    onValidate,
    onRefresh,
    isCompactMode = false,
    readonly = false,
    sortConfig,
    onSort
}: CandidateTableProps) => {
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

    // Helper: Copy logic
    const copyToClipboard = (text: string, label: string) => {
        if (!text || text === 'N/A') return;
        navigator.clipboard.writeText(text);
        toast.success(`${label} copiado!`);
    };

    // Helper: Format CPF
    const formatCPF = (cpf: string) => {
        if (!cpf || cpf === 'N/A') return 'N/A';
        const numbers = cpf.replace(/\D/g, '');
        return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    };

    const SortIcon = ({ columnKey }: { columnKey: string }) => {
        if (sortConfig.key !== columnKey) return <ArrowUpDown className="ml-2 h-3 w-3 opacity-30" />;
        return sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-3 w-3 text-primary" /> : <ArrowDown className="ml-2 h-3 w-3 text-primary" />;
    };

    if (isLoading) {
        return (
            <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 w-full bg-muted/20 animate-pulse rounded-md" />
                ))}
            </div>
        );
    }

    if (candidates.length === 0) {
        return (
            <div className="text-center py-16 text-muted-foreground bg-muted/10 rounded-xl border border-dashed">
                <p className="text-lg font-medium">Nenhum candidato na fila</p>
                <p className="text-sm opacity-70">Aguardando novos registros...</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
            <Table className="w-auto text-sm">
                <TableHeader className="bg-muted/50">
                    <TableRow className="hover:bg-transparent border-b border-border h-10">
                        <TableHead className="w-[80px]">ID</TableHead>
                        <TableHead className="min-w-[150px] cursor-pointer hover:text-foreground" onClick={() => onSort('nome')}>
                            <div className="flex items-center">
                                Nome <SortIcon columnKey="nome" />
                            </div>
                        </TableHead>
                        <TableHead className="min-w-[120px]">CPF</TableHead>
                        <TableHead className="min-w-[120px]">Matriz</TableHead>
                        <TableHead className="min-w-[100px] cursor-pointer hover:text-foreground" onClick={() => onSort('data_de_admissao_10040')}>
                            <div className="flex items-center">
                                Data Admissão <SortIcon columnKey="data_de_admissao_10040" />
                            </div>
                        </TableHead>
                        <TableHead>Status Contratação</TableHead>
                        <TableHead className="cursor-pointer hover:text-foreground" onClick={() => onSort('progressao_documentos')}>
                            <div className="flex items-center">
                                Progresso <SortIcon columnKey="progressao_documentos" />
                            </div>
                        </TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {candidates.map((candidate, index) => {
                        return (
                            <TableRow
                                key={candidate.id}
                                className={`
                    ${isCompactMode ? 'h-10' : 'h-14'} 
                    hover:bg-muted/30 transition-colors
                    ${index % 2 === 0 ? 'bg-muted/5' : ''}
                `}
                            >
                                {/* ID Column */}
                                <TableCell className="font-mono text-xs font-medium">
                                    <div
                                        className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors group"
                                        onClick={() => copyToClipboard(candidate.codigo || '', 'ID')}
                                    >
                                        <span>{candidate.codigo}</span>
                                        <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                                    </div>
                                </TableCell>

                                {/* Name Column */}
                                <TableCell>
                                    <span
                                        className="font-medium truncate max-w-[200px] cursor-pointer hover:text-primary block"
                                        onClick={() => copyToClipboard(candidate.nome, 'Nome')}
                                        title={candidate.nome}
                                    >
                                        {candidate.nome}
                                    </span>
                                </TableCell>

                                {/* CPF Column */}
                                <TableCell>
                                    <span
                                        className="text-[11px] text-muted-foreground font-mono cursor-pointer hover:text-foreground hover:bg-muted/50 px-1.5 py-0.5 rounded transition-colors"
                                        onClick={() => copyToClipboard(candidate.cpf || '', 'CPF')}
                                    >
                                        {formatCPF(candidate.cpf || '')}
                                    </span>
                                </TableCell>

                                {/* Matrix Column */}
                                <TableCell>
                                    <span
                                        className="text-xs text-muted-foreground truncate max-w-[150px] block"
                                        title={candidate.matrix_name || 'N/A'}
                                    >
                                        {candidate.matrix_name || '-'}
                                    </span>
                                </TableCell>

                                {/* Admission Date Column */}
                                <TableCell>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {candidate.data_de_admissao_10040 || '-'}
                                    </span>
                                </TableCell>

                                {/* Status Column */}
                                <TableCell>
                                    <Badge variant="outline" className="font-normal text-[10px] uppercase tracking-wide whitespace-nowrap">
                                        {candidate.status_contratacao}
                                    </Badge>
                                </TableCell>

                                {/* Progress Column */}
                                <TableCell>
                                    <div className="flex items-center gap-2 min-w-[80px]">
                                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${(candidate.progressao_documentos || 0) >= 60 ? 'bg-primary' : 'bg-orange-500'
                                                    }`}
                                                style={{ width: `${candidate.progressao_documentos || 0}%` }}
                                            />
                                        </div>
                                        <span className="text-xs tabular-nums text-muted-foreground">
                                            {candidate.progressao_documentos}%
                                        </span>
                                    </div>
                                </TableCell>

                                {/* Priority Column - dynamic based on new rules */}
                                <TableCell>
                                    <div className="flex gap-1">
                                        {candidate.flag_prioridade_status && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                                                            <Zap className="h-3.5 w-3.5" />
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Status: Validação</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                        {candidate.flag_prioridade_progresso && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                            <ScanLine className="h-3.5 w-3.5" />
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Progresso ≥ 60%</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                        {candidate.flag_prioridade_data && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                                                            <AlertTriangle className="h-3.5 w-3.5" />
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Admissão Próxima (5 dias)</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                        {!candidate.flag_prioridade_status && !candidate.flag_prioridade_progresso && !candidate.flag_prioridade_data && (
                                            <span className="text-[10px] text-muted-foreground opacity-50">-</span>
                                        )}
                                    </div>
                                </TableCell>

                                {/* Actions Column */}
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {/* Open Original System */}
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                        onClick={() => window.open(`https://tecfyrh.com.br/admissions/${candidate.codigo}?menu=document`, '_blank')}
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Abrir Sistema RH</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>

                                        {/* Details Modal */}
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedCandidate(candidate)}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-3xl">
                                                <DialogHeader>
                                                    <DialogTitle>Ficha do Candidato {candidate.codigo}</DialogTitle>
                                                </DialogHeader>
                                                {selectedCandidate && (
                                                    <div>
                                                        {/* Simplified details view for brevity */}
                                                        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                                                            <div>
                                                                <label className="text-muted-foreground text-xs font-semibold uppercase">Nome</label>
                                                                <p className="font-medium">{selectedCandidate.nome}</p>
                                                            </div>
                                                            <div>
                                                                <label className="text-muted-foreground text-xs font-semibold uppercase">CPF</label>
                                                                <p className="font-medium font-mono">{formatCPF(selectedCandidate.cpf || '')}</p>
                                                            </div>
                                                            <div>
                                                                <label className="text-muted-foreground text-xs font-semibold uppercase">Status</label>
                                                                <p>{selectedCandidate.status_contratacao}</p>
                                                            </div>
                                                            <div>
                                                                <label className="text-muted-foreground text-xs font-semibold uppercase">Evolução</label>
                                                                <p>{selectedCandidate.evolucao || '-'}</p>
                                                            </div>
                                                            <div>
                                                                <label className="text-muted-foreground text-xs font-semibold uppercase">Motivo</label>
                                                                <p>{selectedCandidate.motivo || '-'}</p>
                                                            </div>
                                                        </div>
                                                        {/* Audit Log / Rollback Section */}
                                                        <AuditLogSection candidateCode={selectedCandidate.codigo || ''} onRollbackSuccess={onRefresh} />
                                                    </div>
                                                )}
                                            </DialogContent>
                                        </Dialog>

                                        {/* Validate Button - Rule 4 */}
                                        {!readonly && (
                                            <Button
                                                size="sm"
                                                onClick={() => onValidate(candidate.id, candidate.codigo || '')}
                                                className="h-8 bg-primary hover:bg-primary-variant text-primary-foreground font-medium shadow-sm transition-transform hover:scale-105 active:scale-95"
                                            >
                                                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                                                Validar
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div >
    );
};
