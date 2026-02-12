import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { Sidebar } from '@/components/layout/Sidebar';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { OperationalPanel } from '@/components/operational/OperationalPanel';
import { ReportsLayout } from '@/components/reports/ReportsLayout';
import { Settings } from '@/components/settings/Settings';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export const System = () => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isPinned, setIsPinned] = useState(() => {
    const saved = localStorage.getItem('sidebar-pinned');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('sidebar-pinned', JSON.stringify(isPinned));
  }, [isPinned]);

  const handleTogglePin = () => {
    setIsPinned(!isPinned);
    if (!isPinned) {
      setIsOpen(false);
    }
  };

  const handleOpenDrawer = () => {
    if (!isPinned) {
      setIsOpen(true);
    }
  };

  const handleCloseDrawer = () => {
    setIsOpen(false);
  };

  if (!user) {
    return <LoginForm />;
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'operational':
        return <OperationalPanel />;
      case 'reports':
        return <ReportsLayout />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        isPinned={isPinned}
        onTogglePin={handleTogglePin}
        isOpen={isOpen}
        onClose={handleCloseDrawer}
      />

      <main className={`flex-1 p-6 transition-all duration-300 ${isPinned ? 'ml-72' : 'ml-0'}`}>
        {!isPinned && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenDrawer}
            className="mb-4 p-2 hover:bg-gray-200"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        {renderCurrentPage()}
      </main>
    </div>
  );
};