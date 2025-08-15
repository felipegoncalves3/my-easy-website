import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Search, Eye, CheckCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Candidate } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const OperationalPanel = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const loadCandidates = async () => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCandidates(data || []);
      setFilteredCandidates(data || []);
    } catch (error) {
      console.error('Erro ao carregar candidatos:', error);
      toast.error('Erro ao carregar candidatos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateCandidate = async (candidateId: string) => {
    try {
      const { error } = await supabase
        .from('candidates')
        .update({
          bpo_validou: true,
          validado_por: user?.id,
          validado_em: new Date().toISOString()
        })
        .eq('id', candidateId);

      if (error) throw error;

      toast.success('Candidato validado com sucesso!');
      await loadCandidates();
      
      // Aqui também atualizaríamos a planilha do Google Sheets
      // Implementar quando integração com Google Sheets estiver pronta
      
    } catch (error) {
      console.error('Erro ao validar candidato:', error);
      toast.error('Erro ao validar candidato');
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    const filtered = candidates.filter(candidate =>
      candidate.nome.toLowerCase().includes(value.toLowerCase()) ||
      candidate.email?.toLowerCase().includes(value.toLowerCase()) ||
      candidate.cpf?.includes(value)
    );
    setFilteredCandidates(filtered);
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Painel Operacional</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Candidatos para Validação</CardTitle>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou CPF..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell className="font-medium">{candidate.nome}</TableCell>
                    <TableCell>{candidate.email || '-'}</TableCell>
                    <TableCell>{candidate.telefone || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={candidate.bpo_validou ? "default" : "secondary"}>
                        {candidate.bpo_validou ? "Validado" : "Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedCandidate(candidate)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Detalhes do Candidato</DialogTitle>
                            </DialogHeader>
                            {selectedCandidate && (
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="font-semibold">Nome:</label>
                                  <p>{selectedCandidate.nome}</p>
                                </div>
                                <div>
                                  <label className="font-semibold">CPF:</label>
                                  <p>{selectedCandidate.cpf || '-'}</p>
                                </div>
                                <div>
                                  <label className="font-semibold">Email:</label>
                                  <p>{selectedCandidate.email || '-'}</p>
                                </div>
                                <div>
                                  <label className="font-semibold">Telefone:</label>
                                  <p>{selectedCandidate.telefone || '-'}</p>
                                </div>
                                <div>
                                  <label className="font-semibold">Data de Nascimento:</label>
                                  <p>{selectedCandidate.data_nascimento || '-'}</p>
                                </div>
                                <div>
                                  <label className="font-semibold">Cidade:</label>
                                  <p>{selectedCandidate.cidade || '-'}</p>
                                </div>
                                <div className="col-span-2">
                                  <label className="font-semibold">Endereço:</label>
                                  <p>{selectedCandidate.endereco || '-'}</p>
                                </div>
                                <div>
                                  <label className="font-semibold">Escolaridade:</label>
                                  <p>{selectedCandidate.escolaridade || '-'}</p>
                                </div>
                                <div>
                                  <label className="font-semibold">Disponibilidade:</label>
                                  <p>{selectedCandidate.disponibilidade || '-'}</p>
                                </div>
                                <div className="col-span-2">
                                  <label className="font-semibold">Experiência Anterior:</label>
                                  <p>{selectedCandidate.experiencia_anterior || '-'}</p>
                                </div>
                                <div className="col-span-2">
                                  <label className="font-semibold">Observações:</label>
                                  <p>{selectedCandidate.observacoes || '-'}</p>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        {!candidate.bpo_validou && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleValidateCandidate(candidate.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredCandidates.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'Nenhum candidato encontrado' : 'Nenhum candidato cadastrado'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};