
import React, { useContext } from 'react';
import { AppContext } from '../App';
import { UserRole } from '../types';
import { 
  LayoutDashboard, TrendingUp, Lock, Settings, LogOut, 
  ShieldCheck, Bell, Trophy, BrainCircuit
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

  const NavItem = ({ id, icon: Icon, label, color = "text-zinc-400" }: { id: string, icon: any, label: string, color?: string }) => (
    <button
      onClick={() => setView(id)}
      className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all duration-300 ${
        currentView === id 
          ? 'bg-gold-500/10 text-gold-500 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)] border-r-4 border-gold-500' 
          : `${color} hover:bg-zinc-900 hover:text-white`
      }`}
    >
      <Icon size={22} />
      <span className="font-bold text-xs uppercase tracking-widest">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-black font-sans">
      <div className="glow-bg w-[400px] h-[400px] bg-gold-500/5 top-[-10%] left-[-10%] rounded-full"></div>
      
      <aside className="hidden md:flex flex-col w-72 bg-black border-r border-zinc-900 relative z-10">
        <div className="p-10 flex items-center space-x-4">
          <div className="bg-gold-500/10 p-2 rounded-xl border border-gold-500/20">
            <Logo className="text-gold-500 w-8 h-8" />
          </div>
          <h1 className="text-xl font-black tracking-tighter text-white italic">
            BINARY<span className="text-gold-500">MIND</span>
          </h1>
        </div>

        <nav className="flex-1 px-6 space-y-3 mt-4">
          <NavItem id="dashboard" icon={LayoutDashboard} label="Overview" />
          <NavItem id="market" icon={TrendingUp} label="Exchange" />
          <NavItem id="ai_advisor" icon={BrainCircuit} label="AI Advisor" color="text-gold-400" />
          <NavItem id="ranking" icon={Trophy} label="Elite Rank" />
          <NavItem id="staking" icon={Lock} label="Staking" />
          <NavItem id="notifications" icon={Bell} label={`Alertas ${unreadCount > 0 ? `(${unreadCount})` : ''}`} />
          <NavItem id="settings" icon={Settings} label="Config" />
          
          {user?.role === UserRole.ADMIN && (
            <>
              <div className="my-6 border-t border-zinc-900"></div>
              <NavItem id="admin" icon={ShieldCheck} label="Central Hub" color="text-red-500" />
            </>
          )}
        </nav>

        <div className="p-8 border-t border-zinc-900">
          <button 
            onClick={onLogout}
            className="flex items-center space-x-3 text-zinc-600 hover:text-red-400 w-full px-5 py-3 transition-colors font-bold text-xs uppercase tracking-widest"
          >
            <LogOut size={20} />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative z-10 scrollbar-hide">
        <div className="md:hidden flex items-center justify-between p-6 bg-black border-b border-zinc-900 sticky top-0 z-50 backdrop-blur-xl">
          <div className="flex items-center space-x-3">
             <Logo className="text-gold-500 w-8 h-8" />
             <span className="font-black text-white italic tracking-tighter">BINARYMIND</span>
          </div>
          <button onClick={onLogout}><LogOut size={20} className="text-red-500" /></button>
        </div>
        
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-2xl border-t border-zinc-900 flex justify-around p-5 z-50">
          <button onClick={() => setView('dashboard')} className={currentView === 'dashboard' ? 'text-gold-500' : 'text-zinc-600'}><LayoutDashboard /></button>
          <button onClick={() => setView('market')} className={currentView === 'market' ? 'text-gold-500' : 'text-zinc-600'}><TrendingUp /></button>
          <button onClick={() => setView('ai_advisor')} className={currentView === 'ai_advisor' ? 'text-gold-500' : 'text-zinc-600'}><BrainCircuit /></button>
          <button onClick={() => setView('settings')} className={currentView === 'settings' ? 'text-gold-500' : 'text-zinc-600'}><Settings /></button>
          {user?.role === UserRole.ADMIN && (
             <button onClick={() => setView('admin')} className={currentView === 'admin' ? 'text-red-500' : 'text-zinc-600'}><ShieldCheck /></button>
          )}
        </div>

        <div className="p-6 md:p-12 pb-32 md:pb-12 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
