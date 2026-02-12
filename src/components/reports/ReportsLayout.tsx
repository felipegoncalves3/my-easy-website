import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    BarChart3,
    Users,
    FileText,
    Files,
    Building2,
    History
} from 'lucide-react';

import { OverviewTab } from './tabs/OverviewTab';
import { ProductivityTab } from './tabs/ProductivityTab';
import { StatusTab } from './tabs/StatusTab';
import { DocumentationTab } from './tabs/DocumentationTab';
import { CompaniesTab } from './tabs/CompaniesTab';
import { AuditTab } from './tabs/AuditTab';

export const ReportsLayout = () => {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Relatórios Gerenciais</h1>
                <p className="text-muted-foreground">
                    Visão completa da operação, performance e auditoria.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <div className="overflow-x-auto pb-2">
                    <TabsList className="h-12 w-full justify-start rounded-xl bg-sidebar-accent/50 p-1 text-muted-foreground md:w-auto">
                        <TabsTrigger value="overview" className="gap-2 rounded-lg px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <BarChart3 className="h-4 w-4" />
                            Visão Geral
                        </TabsTrigger>
                        <TabsTrigger value="productivity" className="gap-2 rounded-lg px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Users className="h-4 w-4" />
                            Produtividade BPO
                        </TabsTrigger>
                        <TabsTrigger value="status" className="gap-2 rounded-lg px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Files className="h-4 w-4" />
                            Status & Funil
                        </TabsTrigger>
                        <TabsTrigger value="docs" className="gap-2 rounded-lg px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <FileText className="h-4 w-4" />
                            Documentação
                        </TabsTrigger>
                        <TabsTrigger value="companies" className="gap-2 rounded-lg px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Building2 className="h-4 w-4" />
                            Empresas (Matriz)
                        </TabsTrigger>
                        <TabsTrigger value="audit" className="gap-2 rounded-lg px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <History className="h-4 w-4" />
                            Auditoria
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="overview" className="space-y-6 animate-in fade-in-50 duration-500">
                    <OverviewTab />
                </TabsContent>

                <TabsContent value="productivity" className="space-y-6 animate-in fade-in-50 duration-500">
                    <ProductivityTab />
                </TabsContent>

                <TabsContent value="status" className="space-y-6 animate-in fade-in-50 duration-500">
                    <StatusTab />
                </TabsContent>

                <TabsContent value="docs" className="space-y-6 animate-in fade-in-50 duration-500">
                    <DocumentationTab />
                </TabsContent>

                <TabsContent value="companies" className="space-y-6 animate-in fade-in-50 duration-500">
                    <CompaniesTab />
                </TabsContent>

                <TabsContent value="audit" className="space-y-6 animate-in fade-in-50 duration-500">
                    <AuditTab />
                </TabsContent>
            </Tabs>
        </div>
    );
};
