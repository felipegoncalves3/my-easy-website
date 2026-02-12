import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { DocumentationStats } from '@/types/reports';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981']; // Red, Amber, Blue, Green (Techub)

export const DocumentationTab = () => {
    const [data, setData] = useState<DocumentationStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data, error } = await supabase
                    .from('vw_rpt_documentation_stats')
                    .select('*');

                if (error) throw error;
                // Ensure order
                const order = ['0%', '1-50%', '51-99%', '100%'];
                const sorted = (data || []).sort((a, b) => order.indexOf(a.range_label) - order.indexOf(b.range_label));
                setData(sorted);
            } catch (error) {
                console.error('Error fetching docs stats:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando estatísticas...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-sidebar-border bg-sidebar-accent/5">
                <CardHeader>
                    <CardTitle>Progresso Documental</CardTitle>
                    <CardDescription>Distribuição por faixas de completude.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="count"
                                nameKey="range_label"
                                label={({ range_label, percentage }) => `${range_label} (${percentage}%)`}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="border-sidebar-border bg-sidebar-accent/5">
                <CardHeader>
                    <CardTitle>Detalhes</CardTitle>
                    <CardDescription>Quantitativo por faixa.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {data.map((item, index) => (
                        <div key={item.range_label} className="flex items-center justify-between p-3 rounded-lg border border-sidebar-border/50 bg-background/50">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="font-medium">{item.range_label}</span>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-bold">{item.count}</div>
                                <div className="text-xs text-muted-foreground">{item.percentage}% do total</div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
};
