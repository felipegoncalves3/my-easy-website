import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  CheckCircle
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const { user, logout, hasPermission } = useAuth();

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', permission: 'dashboard' },
    { id: 'operational', icon: Users, label: 'Painel Operacional', permission: 'operational' },
    { id: 'reports', icon: BarChart3, label: 'Relatórios', permission: 'reports' },
    { id: 'settings', icon: Settings, label: 'Configurações', permission: 'settings' },
  ];

  const visibleMenuItems = menuItems.filter(item => hasPermission(item.permission));

  return (
    <div className="w-64 h-screen sidebar-modern fixed left-0 top-0 z-10 animate-fade-in">
      <div className="p-6">
        <div className="flex items-center mb-10 animate-scale-in">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-variant flex items-center justify-center shadow-glow">
            <CheckCircle className="h-7 w-7 text-primary-foreground" />
          </div>
          <span className="ml-3 text-xl font-bold text-gradient">Validação BPO</span>
        </div>
        
        <div className="mb-6 p-4 glass-card rounded-xl animate-slide-up">
          <p className="text-sm font-semibold text-foreground">{user?.full_name}</p>
          <p className="text-xs text-muted-foreground font-medium">{user?.role}</p>
        </div>
        
        <nav className="space-y-2 animate-slide-up" style={{ animationDelay: '100ms' }}>
          {visibleMenuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start transition-all duration-300 rounded-xl font-medium hover:shadow-md hover:bg-accent/60 ${
                  isActive 
                    ? 'bg-gradient-to-r from-primary to-primary-variant text-primary-foreground shadow-md border-0' 
                    : 'hover:text-primary'
                }`}
                onClick={() => onPageChange(item.id)}
                style={{ animationDelay: `${(index + 2) * 50}ms` }}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </Button>
            );
          })}
        </nav>
        
        <div className="mt-8 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300 rounded-xl font-medium"
            onClick={logout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
};