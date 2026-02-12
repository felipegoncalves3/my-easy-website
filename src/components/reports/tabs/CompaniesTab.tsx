import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { MatrixPerformance } from '@/types/reports';
import { Building2, Users, FileCheck, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export const CompaniesTab = () => {
    const [data, setData] = useState<MatrixPerformance[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data, error } = await supabase
                    .from('vw_rpt_matrix_performance')
                    .select('*')
                    .order('total_candidates', { ascending: false });

                if (error) throw error;
                setData(data || []);
            } catch (error) {
                console.error('Error fetching matrix stats:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando dados das empresas...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((matrix) => (
                <Card key={matrix.matrix_id || matrix.matrix_name} className="border-sidebar-border bg-sidebar-accent/5 hover:bg-sidebar-accent/10 transition-all cursor-pointer">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Building2 className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="font-bold text-lg leading-tight line-clamp-1" title={matrix.matrix_name}>
                                {matrix.matrix_name}
                            </h3>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Users className="w-3 h-3" /> Total
                                </span>
                                <div className="text-xl font-bold">{matrix.total_candidates}</div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <FileCheck className="w-3 h-3" /> Documentação
                                </span>
                                <div className="text-xl font-bold">{matrix.avg_documentation_progress}%</div>
                            </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-sidebar-border/50">
                            <div className="flex justify-between text-xs">
                                <span className="text-green-400">Dimencionados: {matrix.validated_count}</span>
                                <span className="text-yellow-400">Pendente: {matrix.pending_count}</span>
                            </div>
                            {/* Simple Visual Bar */}
                            <div className="flex w-full h-1.5 bg-sidebar-accent rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500"
                                    style={{ width: `${(matrix.validated_count / matrix.total_candidates) * 100}%` }}
                                />
                                <div
                                    className="h-full bg-yellow-500"
                                    style={{ width: `${(matrix.pending_count / matrix.total_candidates) * 100}%` }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
