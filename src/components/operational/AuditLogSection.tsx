import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AuditLogSectionProps {
    candidateCode: string;
    onRollbackSuccess: () => void;
}

export const AuditLogSection = ({ candidateCode, onRollbackSuccess }: AuditLogSectionProps) => {
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();

    const loadLogs = async () => {
        try {
            const { data, error } = await supabase
                .from('bpo_validacoes')
                .select('*')
                .eq('codigo', candidateCode)
                .order('data_validacao', { ascending: false });

            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error('Erro ao carregar logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, [candidateCode]);

    const handleRollback = async (logId: string) => {
        const reason = window.prompt('Motivo do Rollback (obrigatório):');
        if (!reason) return;

        try {
            // RULE 6: Exact Rollback Logic
            const { error } = await supabase.rpc('executar_rollback', {
                p_validacao_id: logId,
                p_usuario_id: user?.id,
                p_motivo_rollback: reason
            });

            if (error) throw error;

            toast.success('Rollback executado com sucesso!');
            loadLogs();
            onRollbackSuccess();
        } catch (error) {
            console.error('Erro no rollback:', error);
            toast.error('Erro ao executar rollback');
        }
    };

    if (isLoading) return <div className="text-sm text-muted-foreground animate-pulse">Carregando histórico...</div>;
    if (logs.length === 0) return <div className="text-sm text-muted-foreground italic">Nenhum histórico de validação encontrado.</div>;

    return (
        <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-primary">
                <RotateCcw className="h-4 w-4" />
                Auditoria de Validações
            </h4>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {logs.map((log) => (
                    <div
                        key={log.id}
                        className={`p-3 rounded-lg border text-xs transition-colors ${log.rollback
                                ? 'bg-destructive/10 border-destructive/20'
                                : 'bg-muted/40 border-border hover:bg-muted/60'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex flex-col">
                                <span className="font-semibold text-foreground">{log.bpo_nome}</span>
                                <span className="text-muted-foreground text-[10px]">
                                    {new Date(log.data_validacao).toLocaleString('pt-BR')}
                                </span>
                            </div>
                            {!log.rollback && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-[10px] text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => handleRollback(log.id)}
                                >
                                    Confirmar Erro (Rollback)
                                </Button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-muted-foreground mt-2">
                            <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{log.tempo_validacao_segundos}s de análise</span>
                            </div>
                            {log.motivo_validacao && <div>Motivo: {log.motivo_validacao}</div>}
                        </div>

                        {log.rollback && (
                            <div className="mt-2 pt-2 border-t border-destructive/20 text-destructive flex items-start gap-2">
                                <AlertTriangle className="h-3 w-3 mt-0.5" />
                                <div>
                                    <span className="font-semibold block">ROLLBACK EXECUTADO</span>
                                    <span className="opacity-80">"{log.motivo_rollback}"</span>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
