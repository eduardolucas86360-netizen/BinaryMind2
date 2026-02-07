import React, { useContext } from 'react';
import { AppContext } from '../App';
import { UserRole } from '../types';
import { 
  LayoutDashboard, TrendingUp, Lock, Settings, LogOut, 
  ShieldCheck, Bell
} from 'lucide-react';
import { Logo } from './Logo';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  currentView: string;
  setView: (view: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout, currentView, setView }) => {
  const { user } = useContext(AppContext);
  const unreadCount = user?.notifications.filter(n => !n.read).length || 0;

  const NavItem = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => (
    <button
      onClick={() => setView(id)}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        currentView === id 
          ? 'bg-gold-500/10 text-gold-500 border-r-2 border-gold-500' 
          : 'text-zinc-400 hover:bg-dark-800 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-dark-950">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-dark-950 border-r border-dark-800">
        <div className="p-6 flex items-center space-x-3">
          <Logo className="text-gold-500 w-10 h-10" />
          <h1 className="text-xl font-bold tracking-tight text-white">
            Binary<span className="text-gold-500">Mind</span>
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem id="dashboard" icon={LayoutDashboard} label="Visão Geral" />
          <NavItem id="market" icon={TrendingUp} label="Mercado" />
          <NavItem id="staking" icon={Lock} label="Renda Passiva" />
          <NavItem id="notifications" icon={Bell} label={`Notificações ${unreadCount > 0 ? `(${unreadCount})` : ''}`} />
          <NavItem id="settings" icon={Settings} label="Configurações" />
          
          {user?.role === UserRole.ADMIN && (
            <>
              <div className="my-4 border-t border-dark-800"></div>
              <NavItem id="admin" icon={ShieldCheck} label="Painel Admin" />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-dark-800">
          <button 
            onClick={onLogout}
            className="flex items-center space-x-3 text-red-400 hover:text-red-300 w-full px-4 py-2 transition-colors"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-dark-950 border-b border-dark-800 sticky top-0 z-10">
          <div className="flex items-center space-x-2">
             <Logo className="text-gold-500 w-8 h-8" />
             <span className="font-bold text-white">BinaryMind</span>
          </div>
          <button onClick={onLogout}><LogOut size={20} className="text-red-400" /></button>
        </div>
        
        {/* Mobile Nav (Bottom) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-900 border-t border-dark-800 flex justify-around p-3 z-50">
          <button onClick={() => setView('dashboard')} className={currentView === 'dashboard' ? 'text-gold-500' : 'text-zinc-500'}><LayoutDashboard /></button>
          <button onClick={() => setView('market')} className={currentView === 'market' ? 'text-gold-500' : 'text-zinc-500'}><TrendingUp /></button>
          <button onClick={() => setView('settings')} className={currentView === 'settings' ? 'text-gold-500' : 'text-zinc-500'}><Settings /></button>
          {user?.role === UserRole.ADMIN && (
             <button onClick={() => setView('admin')} className={currentView === 'admin' ? 'text-red-500' : 'text-zinc-500'}><ShieldCheck /></button>
          )}
        </div>

        <div className="p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;