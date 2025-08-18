import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, UserCheck, UserX, Trash2, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { toast } from 'sonner';

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    confirmPassword: '',
    role: 'operator',
    department: ''
  });
  const [editUser, setEditUser] = useState({
    username: '',
    email: '',
    full_name: '',
    role: 'operator',
    department: ''
  });

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  };

  const createUser = async () => {
    try {
      if (newUser.password !== newUser.confirmPassword) {
        toast.error('As senhas não coincidem');
        return;
      }

      if (!newUser.username || !newUser.email || !newUser.full_name || !newUser.password) {
        toast.error('Todos os campos obrigatórios devem ser preenchidos');
        return;
      }

      const { error } = await supabase
        .from('users')
        .insert([{
          username: newUser.username,
          email: newUser.email,
          full_name: newUser.full_name,
          password: newUser.password, // Em produção, deve ser hasheado
          role: newUser.role,
          department: newUser.department || null,
          is_active: true
        }]);

      if (error) throw error;

      toast.success('Usuário criado com sucesso!');
      setIsDialogOpen(false);
      setNewUser({
        username: '',
        email: '',
        full_name: '',
        password: '',
        confirmPassword: '',
        role: 'operator',
        department: ''
      });
      loadUsers();
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      if (error.code === '23505') {
        toast.error('Usuário ou email já existe');
      } else {
        toast.error('Erro ao criar usuário');
      }
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !isActive })
        .eq('id', userId);

      if (error) throw error;

      toast.success(`Usuário ${!isActive ? 'ativado' : 'desativado'} com sucesso!`);
      loadUsers();
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      toast.error('Erro ao alterar status do usuário');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast.success('Usuário excluído com sucesso!');
      loadUsers();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast.error('Erro ao excluir usuário');
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setEditUser({
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      department: user.department || ''
    });
    setIsEditDialogOpen(true);
  };

  const updateUser = async () => {
    if (!editingUser) return;

    try {
      if (!editUser.username || !editUser.email || !editUser.full_name) {
        toast.error('Todos os campos obrigatórios devem ser preenchidos');
        return;
      }

      const { error } = await supabase
        .from('users')
        .update({
          username: editUser.username,
          email: editUser.email,
          full_name: editUser.full_name,
          role: editUser.role,
          department: editUser.department || null
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      toast.success('Usuário atualizado com sucesso!');
      setIsEditDialogOpen(false);
      setEditingUser(null);
      loadUsers();
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      if (error.code === '23505') {
        toast.error('Usuário ou email já existe');
      } else {
        toast.error('Erro ao atualizar usuário');
      }
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gerenciamento de Usuários</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Criar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="full_name">Nome Completo *</Label>
                <Input
                  id="full_name"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Nome completo do usuário"
                />
              </div>
              
              <div>
                <Label htmlFor="username">Usuário *</Label>
                <Input
                  id="username"
                  value={newUser.username}
                  onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Nome de usuário"
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <Label htmlFor="role">Perfil</Label>
                <Select 
                  value={newUser.role} 
                  onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="operator">Operador</SelectItem>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="department">Departamento</Label>
                <Input
                  id="department"
                  value={newUser.department}
                  onChange={(e) => setNewUser(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="Departamento (opcional)"
                />
              </div>

              <div>
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Senha do usuário"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={newUser.confirmPassword}
                  onChange={(e) => setNewUser(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirme a senha"
                />
              </div>

              <Button onClick={createUser} className="w-full">
                Criar Usuário
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_full_name">Nome Completo *</Label>
                <Input
                  id="edit_full_name"
                  value={editUser.full_name}
                  onChange={(e) => setEditUser(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Nome completo do usuário"
                />
              </div>
              
              <div>
                <Label htmlFor="edit_username">Usuário *</Label>
                <Input
                  id="edit_username"
                  value={editUser.username}
                  onChange={(e) => setEditUser(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Nome de usuário"
                />
              </div>

              <div>
                <Label htmlFor="edit_email">Email *</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={editUser.email}
                  onChange={(e) => setEditUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <Label htmlFor="edit_role">Perfil</Label>
                <Select 
                  value={editUser.role} 
                  onValueChange={(value) => setEditUser(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="operator">Operador</SelectItem>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit_department">Departamento</Label>
                <Input
                  id="edit_department"
                  value={editUser.department}
                  onChange={(e) => setEditUser(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="Departamento (opcional)"
                />
              </div>

              <Button onClick={updateUser} className="w-full">
                Atualizar Usuário
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table className="w-auto">
          <TableHeader>
            <TableRow>
              <TableHead className="w-auto whitespace-nowrap">Nome</TableHead>
              <TableHead className="w-auto whitespace-nowrap">Usuário</TableHead>
              <TableHead className="w-auto whitespace-nowrap">Email</TableHead>
              <TableHead className="w-auto whitespace-nowrap">Perfil</TableHead>
              <TableHead className="w-auto whitespace-nowrap">Status</TableHead>
              <TableHead className="w-auto whitespace-nowrap">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium whitespace-nowrap">{user.full_name}</TableCell>
                <TableCell className="whitespace-nowrap">{user.username}</TableCell>
                <TableCell className="whitespace-nowrap">{user.email}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.role === 'admin' ? 'bg-red-100 text-red-800' :
                    user.role === 'operator' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role === 'admin' ? 'Administrador' :
                     user.role === 'operator' ? 'Operador' : 'Visualizador'}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleUserStatus(user.id, user.is_active)}
                    >
                      {user.is_active ? (
                        <UserX className="h-4 w-4" />
                      ) : (
                        <UserCheck className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteUser(user.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};