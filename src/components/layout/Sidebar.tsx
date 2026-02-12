import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  LogOut,
  CheckCircle,
  Pin,
  PinOff
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isPinned: boolean;
  onTogglePin: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onPageChange,
  isPinned,
  onTogglePin,
  isOpen,
  onClose
}) => {
  const { user, logout, hasPermission } = useAuth();

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', permission: 'dashboard' },
    { id: 'operational', icon: Users, label: 'Painel Operacional', permission: 'operational' },
    { id: 'reports', icon: BarChart3, label: 'Relatórios', permission: 'reports' },
    { id: 'settings', icon: Settings, label: 'Configurações', permission: 'settings' },
  ];

  const visibleMenuItems = menuItems.filter(item => hasPermission(item.permission));

  const handleMenuClick = (page: string) => {
    onPageChange(page);
    if (!isPinned) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay para drawer mode */}
      {!isPinned && isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      <div className={`
        h-screen bg-sidebar-background border-r border-sidebar-border z-50 transition-transform duration-300
        ${isPinned
          ? 'w-72 fixed left-0 top-0'
          : `w-72 fixed left-0 top-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
        }
      `}>
        <div className="p-6">
          {/* Botão de Pin/Unpin */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <img
                src="/techub-logo.jpg"
                alt="TECHUB BPO"
                className="h-10 w-auto rounded-lg"
              />
              <span className="text-xl font-bold tracking-tight text-foreground">TECHUB - BPO</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onTogglePin}
              className="p-2 hover:bg-sidebar-accent"
              title={isPinned ? "Desfixar menu" : "Fixar menu"}
            >
              {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            </Button>
          </div>

          <div className="mb-6 p-4 bg-sidebar-accent/50 rounded-xl border border-sidebar-border shadow-sm">
            <p className="text-sm font-semibold text-foreground">{user?.full_name}</p>
            <p className="text-xs text-muted-foreground font-medium">{user?.role}</p>
          </div>

          <nav className="space-y-2">
            {visibleMenuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start transition-all duration-300 rounded-xl font-medium ${isActive
                    ? 'bg-primary text-black shadow-[0_0_15px_rgba(20,184,166,0.4)] border-0'
                    : 'hover:bg-sidebar-accent hover:text-primary'
                    }`}
                  onClick={() => handleMenuClick(item.id)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          <div className="mt-8">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-sidebar-accent transition-all duration-300 rounded-xl font-medium"
              onClick={logout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};