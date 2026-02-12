import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { OverviewKPIs } from '@/types/reports';
import { Users, CheckCircle2, AlertCircle, BarChart, XCircle } from 'lucide-react';

export const OverviewTab = () => {
    const [data, setData] = useState<OverviewKPIs | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data, error } = await supabase
                    .from('vw_rpt_overview_kpis')
                    .select('*')
                    .single();

                if (error) throw error;
                setData(data);
            } catch (error) {
                console.error('Error fetching overview:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) return <div className="p-8 text-center">Carregando indicadores...</div>;
    if (!data) return <div>Erro ao carregar dados.</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <KPI_Card
                title="Total de Candidatos"
                value={data.total_candidates}
                icon={Users}
                color="text-blue-400"
            />
            <KPI_Card
                title="Total Validados"
                value={data.total_validated}
                icon={CheckCircle2}
                color="text-techub-green"
            />
            <KPI_Card
                title="Total Pendentes"
                value={data.total_pending}
                icon={AlertCircle}
                color="text-yellow-400"
            />
            <KPI_Card
                title="Taxa de Validação"
                value={`${data.validation_rate_pct}%`}
                icon={BarChart}
                color="text-purple-400"
            />
            <KPI_Card
                title="Taxa de Recusa"
                value={`${data.rejection_rate_pct}%`}
                icon={XCircle}
                color="text-red-400"
            />
        </div>
    );
};

const KPI_Card = ({ title, value, icon: Icon, color }: any) => (
    <Card className="border-sidebar-border bg-sidebar-accent/10 hover:bg-sidebar-accent/20 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <Icon className={`h-4 w-4 ${color}`} />
        </CardHeader>
        <CardContent>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
        </CardContent>
    </Card>
);
