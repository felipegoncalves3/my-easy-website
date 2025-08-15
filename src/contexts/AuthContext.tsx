import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se há usuário logado no localStorage
    const savedUser = localStorage.getItem('bpo_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('bpo_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Buscar usuário na tabela users
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .single();

      if (error || !userData) {
        toast.error('Usuário ou senha inválidos');
        return false;
      }

      // Verificar senha (implementação simples - em produção usar bcrypt adequadamente)
      // Por enquanto, aceitar a senha "admin123" para o usuário admin
      const isValidPassword = (username === 'admin' && password === 'admin123') || 
                             userData.password === password;

      if (!isValidPassword) {
        toast.error('Usuário ou senha inválidos');
        return false;
      }

      // Salvar usuário no estado e localStorage
      setUser(userData);
      localStorage.setItem('bpo_user', JSON.stringify(userData));
      
      toast.success(`Bem-vindo, ${userData.full_name}!`);
      return true;
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error('Erro interno do sistema');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('bpo_user');
    toast.success('Logout realizado com sucesso');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};