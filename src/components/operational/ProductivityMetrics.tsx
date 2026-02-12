import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Clock, History, TrendingUp, Layers } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ProductivityMetricsProps {
    totalPending: number;
}

export const ProductivityMetrics = ({ totalPending }: ProductivityMetricsProps) => {
    const [metrics, setMetrics] = useState({
        total: 0,
        avgTime: 0,
        rollbacks: 0
    });
    const { user } = useAuth();

    // Load Metrics - Rule 7
    const loadMetrics = async () => {
        if (!user) return;

        try {
            const userName = user.user_metadata?.full_name || user.email;

            const { data, error } = await supabase
                .from('vw_bpo_metricas_produtividade')
                .select('*')
                .eq('bpo_nome', userName)
                .maybeSingle();

            if (!error && data) {
                setMetrics({
                    total: data.total_validados || 0,
                    avgTime: Math.round(data.tempo_medio_segundos || 0),
                    rollbacks: data.total_rollbacks || 0
                });
            } else {
                // Fallback
                const { data: rawData } = await supabase
                    .from('bpo_validacoes')
                    .select('tempo_validacao_segundos, rollback')
                    .eq('bpo_usuario_id', user.id);

                if (rawData) {
                    const total = rawData.length;
                    const rollbacks = rawData.filter(r => r.rollback).length;
                    const validTimes = rawData.filter(r => !r.rollback).map(r => r.tempo_validacao_segundos);
                    const avgTime = validTimes.length > 0
                        ? validTimes.reduce((a, b) => a + b, 0) / validTimes.length
                        : 0;

                    setMetrics({
                        total,
                        avgTime: Math.round(avgTime),
                        rollbacks
                    });
                }
            }
        } catch (error) {
            console.error('Error loading metrics:', error);
        }
    };

    useEffect(() => {
        loadMetrics();

        const channel = supabase
            .channel('metrics-updates')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'bpo_validacoes' },
                () => loadMetrics()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* New KPI: Fila Operacional */}
            <Card className="bg-card border-border shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-full text-primary">
                        <Layers className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Fila Operacional</p>
                        <h3 className="text-2xl font-bold tabular-nums">{totalPending}</h3>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-full text-primary">
                        <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Validado (Você)</p>
                        <h3 className="text-2xl font-bold tabular-nums">{metrics.total}</h3>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-2 bg-blue-500/10 rounded-full text-blue-500">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Tempo Médio</p>
                        <h3 className="text-2xl font-bold tabular-nums">{metrics.avgTime}s</h3>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-2 bg-orange-500/10 rounded-full text-orange-500">
                        <History className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Retrabalho / Rollback</p>
                        <h3 className="text-2xl font-bold tabular-nums">{metrics.rollbacks}</h3>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
