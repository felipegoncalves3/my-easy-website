import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { SyncLog } from '@/types'; // Reusing base type
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const AuditTab = () => {
    const [logs, setLogs] = useState<SyncLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const { data, error } = await supabase
                    .from('sync_logs')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50); // Limit to last 50 for perf

                if (error) throw error;
                setLogs(data || []);
            } catch (error) {
                console.error('Error fetching logs:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLogs();
    }, []);

    if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando logs de auditoria...</div>;

    return (
        <Card className="border-sidebar-border bg-sidebar-accent/5">
            <CardHeader>
                <CardTitle>Histórico de Sincronização</CardTitle>
                <CardDescription>Últimas 50 operações de integração com Google Sheets.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-sidebar-border">
                            <TableHead>Data/Hora</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Registros</TableHead>
                            <TableHead>Mensagem</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.map((log) => (
                            <TableRow key={log.id} className="border-sidebar-border hover:bg-sidebar-accent/30">
                                <TableCell className="text-muted-foreground text-sm font-mono">
                                    {new Date(log.created_at).toLocaleString('pt-BR')}
                                </TableCell>
                                <TableCell className="capitalize font-medium">
                                    {log.sync_type}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={log.status === 'success' ? 'default' : 'destructive'} className="uppercase text-[10px]">
                                        {log.status === 'success' ? 'Sucesso' : 'Erro'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center font-bold">
                                    {log.records_processed}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground max-w-md truncate" title={log.message}>
                                    {log.message || '-'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};
