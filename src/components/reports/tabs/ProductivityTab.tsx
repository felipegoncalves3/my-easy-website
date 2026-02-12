import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BPOProductivity } from '@/types/reports';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckSquare, RotateCcw } from 'lucide-react';

export const ProductivityTab = () => {
    const [data, setData] = useState<BPOProductivity[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data, error } = await supabase
                    .from('vw_rpt_bpo_productivity')
                    .select('*')
                    .order('total_validations', { ascending: false });

                if (error) throw error;
                setData(data || []);
            } catch (error) {
                console.error('Error fetching productivity:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando métricas de produtividade...</div>;

    return (
        <Card className="border-sidebar-border bg-sidebar-accent/5">
            <CardHeader>
                <CardTitle>Ranking de Produtividade</CardTitle>
                <CardDescription>Performance detalhada por analista BPO.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-sidebar-border">
                            <TableHead>Analista (BPO)</TableHead>
                            <TableHead className="text-center">Validações Totais</TableHead>
                            <TableHead className="text-center">Hoje</TableHead>
                            <TableHead className="text-center">Tempo Médio</TableHead>
                            <TableHead className="text-center">Rollbacks</TableHead>
                            <TableHead className="text-right">Última Atividade</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((bpo) => (
                            <TableRow key={bpo.bpo_id} className="border-sidebar-border hover:bg-sidebar-accent/30">
                                <TableCell className="font-medium text-foreground">
                                    {bpo.bpo_name || 'Desconhecido'}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-md px-3 py-1">
                                        {bpo.total_validations}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    <span className="font-mono">{bpo.validations_today}</span>
                                </TableCell>
                                <TableCell className="text-center flex items-center justify-center gap-2">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                    {bpo.avg_time_seconds}s
                                </TableCell>
                                <TableCell className="text-center">
                                    {bpo.total_rollbacks > 0 ? (
                                        <Badge variant="destructive" className="items-center gap-1">
                                            <RotateCcw className="w-3 h-3" /> {bpo.total_rollbacks}
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground text-sm">
                                    {bpo.last_active_at ? new Date(bpo.last_active_at).toLocaleString('pt-BR') : 'N/A'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};
