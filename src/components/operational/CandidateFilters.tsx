import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Filter, RotateCcw, AlertTriangle, Zap, ScanLine, X } from 'lucide-react';

interface FilterState {
    searchTerm: string;
    statusFilter: string;
    selectedBPOs: string[];
    admissionStart: string; // YYYY-MM-DD
    admissionEnd: string;   // YYYY-MM-DD
}

interface CandidateFiltersProps {
    filters: FilterState;
    onChange: (newFilters: FilterState) => void;
    availableBPOs: string[];
    counts: {
        prioridadeData: number;
        prioridadeStatus: number;
        progress60: number;
        total: number;
    };
}

export const CandidateFilters = ({
    filters,
    onChange,
    availableBPOs,
    counts
}: CandidateFiltersProps) => {

    const updateFilter = (key: keyof FilterState, value: any) => {
        onChange({ ...filters, [key]: value });
    };

    const clearAll = () => {
        onChange({
            searchTerm: '',
            statusFilter: 'todos',
            selectedBPOs: [],
            admissionStart: '',
            admissionEnd: ''
        });
    };

    const hasActiveFilters = filters.searchTerm || (filters.statusFilter && filters.statusFilter !== 'todos') || filters.selectedBPOs.length > 0 || filters.admissionStart || filters.admissionEnd;

    return (
        <div className="bg-muted/30 border border-border rounded-2xl p-4 space-y-4 shadow-sm">
            {/* Quick Chips Row - Dynamic Priorities Info */}
            <div className="flex flex-wrap gap-2 items-center">
                <Badge variant="outline" className="rounded-full h-8 px-3 text-xs bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                    <Zap className="h-3 w-3 mr-1.5" />
                    Validação ({counts.prioridadeStatus})
                </Badge>
                <Badge variant="outline" className="rounded-full h-8 px-3 text-xs bg-blue-500/10 text-blue-400 border-blue-500/20">
                    <ScanLine className="h-3 w-3 mr-1.5" />
                    Progresso ≥60% ({counts.progress60})
                </Badge>
                <Badge variant="outline" className="rounded-full h-8 px-3 text-xs bg-red-500/10 text-red-500 border-red-500/20">
                    <AlertTriangle className="h-3 w-3 mr-1.5" />
                    Admissão Próxima ({counts.prioridadeData})
                </Badge>
                <div className="flex-1" />
                <Badge variant="outline" className="rounded-full h-8 px-3 text-xs bg-background/50">
                    Total na Fila: {counts.total}
                </Badge>
            </div>

            {/* Main Inputs Row */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome, CPF ou ID..."
                        value={filters.searchTerm}
                        onChange={(e) => updateFilter('searchTerm', e.target.value)}
                        className="pl-9 bg-background/50 border-border focus:bg-background transition-all"
                    />
                </div>

                {/* Status Filter */}
                <Select value={filters.statusFilter || 'todos'} onValueChange={(val) => updateFilter('statusFilter', val)}>
                    <SelectTrigger className="w-[180px] bg-background/50 border-border">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todos">Todos os Status</SelectItem>
                        <SelectItem value="VALIDAÇÃO">Validação</SelectItem>
                        <SelectItem value="EM PROGRESSO">Em Progresso</SelectItem>
                        <SelectItem value="ADMITIDO">Admitido</SelectItem>
                        <SelectItem value="CANCELADO">Cancelado</SelectItem>
                        <SelectItem value="REPROVADO">Reprovado</SelectItem>
                    </SelectContent>
                </Select>

                {/* Date Filter Popover */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={`justify-start text-left font-normal border-border bg-background/50 min-w-[160px] ${filters.admissionStart || filters.admissionEnd ? 'text-primary border-primary/50 bg-primary/5' : ''}`}
                        >
                            <span className="mr-2 h-4 w-4">📅</span>
                            {filters.admissionStart || filters.admissionEnd ? (
                                <span className="truncate">
                                    {filters.admissionStart ? new Date(filters.admissionStart).toLocaleDateString('pt-BR') : '...'}
                                    {' - '}
                                    {filters.admissionEnd ? new Date(filters.admissionEnd).toLocaleDateString('pt-BR') : '...'}
                                </span>
                            ) : (
                                "Data Admissão"
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4 space-y-4" align="start">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none">Período de Admissão</h4>
                            <p className="text-sm text-muted-foreground">Filtrar candidatos pela data de admissão.</p>
                        </div>
                        <div className="grid gap-2">
                            <div className="grid grid-cols-3 items-center gap-4">
                                <span className="text-sm">Início:</span>
                                <Input
                                    type="date"
                                    className="col-span-2 h-8"
                                    value={filters.admissionStart}
                                    onChange={(e) => updateFilter('admissionStart', e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-3 items-center gap-4">
                                <span className="text-sm">Fim:</span>
                                <Input
                                    type="date"
                                    className="col-span-2 h-8"
                                    value={filters.admissionEnd}
                                    onChange={(e) => updateFilter('admissionEnd', e.target.value)}
                                />
                            </div>
                        </div>
                        {(filters.admissionStart || filters.admissionEnd) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-red-400 hover:text-red-500 hover:bg-red-500/10 h-8"
                                onClick={() => {
                                    updateFilter('admissionStart', '');
                                    updateFilter('admissionEnd', '');
                                }}
                            >
                                Limpar Datas
                            </Button>
                        )}
                    </PopoverContent>
                </Popover>

                {/* BPO Filter */}
                {availableBPOs.length > 0 && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="justify-start text-left font-normal border-border bg-background/50 min-w-[180px]">
                                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                                {filters.selectedBPOs.length === 0 ? "Filtrar por BPO" : `${filters.selectedBPOs.length} selecionados`}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Buscar BPO..." />
                                <CommandList>
                                    <CommandEmpty>Nenhum BPO.</CommandEmpty>
                                    <CommandGroup>
                                        <CommandItem onSelect={() => updateFilter('selectedBPOs', [])} className="cursor-pointer">
                                            <Checkbox checked={filters.selectedBPOs.length === 0} className="mr-2" />
                                            Todos
                                        </CommandItem>
                                        {availableBPOs.map((bpo) => (
                                            <CommandItem key={bpo} onSelect={() => {
                                                const current = filters.selectedBPOs;
                                                const updated = current.includes(bpo) ? current.filter(b => b !== bpo) : [...current, bpo];
                                                updateFilter('selectedBPOs', updated);
                                            }} className="cursor-pointer">
                                                <Checkbox checked={filters.selectedBPOs.includes(bpo)} className="mr-2" />
                                                {bpo}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                )}

                {hasActiveFilters && (
                    <Button variant="ghost" size="icon" onClick={clearAll} className="h-10 w-10 text-muted-foreground hover:text-foreground">
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Active Filters Display */}
            {(filters.selectedBPOs.length > 0 || filters.admissionStart || filters.admissionEnd || (filters.statusFilter && filters.statusFilter !== 'todos')) && (
                <div className="flex flex-wrap gap-2">
                    {filters.statusFilter && filters.statusFilter !== 'todos' && (
                        <Badge variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1 group">
                            Status: {filters.statusFilter}
                            <div
                                className="p-0.5 rounded-full hover:bg-destructive/20 cursor-pointer"
                                onClick={() => updateFilter('statusFilter', 'todos')}
                            >
                                <X className="h-3 w-3 text-muted-foreground group-hover:text-destructive" />
                            </div>
                        </Badge>
                    )}
                    {filters.selectedBPOs.map(bpo => (
                        <Badge key={bpo} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1 group">
                            {bpo}
                            <div
                                className="p-0.5 rounded-full hover:bg-destructive/20 cursor-pointer"
                                onClick={() => updateFilter('selectedBPOs', filters.selectedBPOs.filter(b => b !== bpo))}
                            >
                                <X className="h-3 w-3 text-muted-foreground group-hover:text-destructive" />
                            </div>
                        </Badge>
                    ))}
                    {(filters.admissionStart || filters.admissionEnd) && (
                        <Badge variant="outline" className="pl-2 pr-1 py-1 flex items-center gap-1 border-primary/30 text-primary bg-primary/5">
                            📅 {filters.admissionStart ? new Date(filters.admissionStart).toLocaleDateString('pt-BR') : '...'} - {filters.admissionEnd ? new Date(filters.admissionEnd).toLocaleDateString('pt-BR') : '...'}
                            <div
                                className="p-0.5 rounded-full hover:bg-destructive/10 cursor-pointer"
                                onClick={() => {
                                    updateFilter('admissionStart', '');
                                    updateFilter('admissionEnd', '');
                                }}
                            >
                                <X className="h-3 w-3 group-hover:text-destructive" />
                            </div>
                        </Badge>
                    )}
                </div>
            )}
        </div>
    );
};
