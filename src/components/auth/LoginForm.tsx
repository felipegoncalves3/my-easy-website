import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User, Lock } from 'lucide-react';

export const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setIsSubmitting(true);
    await login(username, password);
    setIsSubmitting(false);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* 2️⃣ Adicionar vídeo como fundo da página */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed top-0 left-0 w-full h-full object-cover z-0"
      >
        <source src="/monitoramento.mp4" type="video/mp4" />
      </video>

      {/* 3️⃣ Adicionar overlay escuro sobre o vídeo */}
      <div className="fixed inset-0 bg-black/70 z-0"></div>

      {/* 4️⃣ Ajustar card de login */}
      <div className="relative z-10 bg-zinc-900/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/10">
        <div className="text-center mb-8">
          {/* 1️⃣ Substituir o ícone superior pela logo */}
          <img
            src="/logo_techub.jpg"
            alt="Techub"
            className="w-full max-w-[180px] mx-auto mb-6 h-auto"
          />
          <h1 className="text-2xl font-bold text-white mb-1">Validação BPO</h1>
          <p className="text-zinc-400 text-sm">Sistema de Validação de Candidatos</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-zinc-300">Usuário</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
              <Input
                id="username"
                type="text"
                placeholder="Digite seu usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-9 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-primary focus:border-primary"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-300">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-primary focus:border-primary"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            disabled={isSubmitting || !username || !password}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};