import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { HiringFunnel } from '@/types/reports';
import { Progress } from '@/components/ui/progress';

export const StatusTab = () => {
    const [data, setData] = useState<HiringFunnel[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data, error } = await supabase
                    .from('vw_rpt_hiring_funnel')
                    .select('*')
                    .order('count', { ascending: false });

                if (error) throw error;
                setData(data || []);
            } catch (error) {
                console.error('Error fetching funnel:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando funil...</div>;

    const maxCount = Math.max(...data.map(d => d.count));

    return (
        <Card className="border-sidebar-border bg-sidebar-accent/5">
            <CardHeader>
                <CardTitle>Funil de Contratação</CardTitle>
                <CardDescription>Distribuição dos candidatos por status atual.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {data.map((item) => (
                    <div key={item.status} className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="font-medium text-foreground">{item.status || 'Sem Status'}</span>
                            <span className="text-muted-foreground">
                                {item.count} ({item.percentage}%)
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Progress value={(item.count / maxCount) * 100} className="h-3 bg-muted" />
                        </div>
                    </div>
                ))}

                {data.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">Nenhum dado encontrado.</div>
                )}
            </CardContent>
        </Card>
    );
};
