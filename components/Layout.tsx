
import React, { useContext } from 'react';
import { AppContext } from '../App';
import { UserRole } from '../types';
import { 
  Home, TrendingUp, Lock, Settings, LogOut, 
  ShieldCheck, Bell, Trophy, BrainCircuit
} from 'lucide-react';

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
      className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all duration-300 ${
        currentView === id 
          ? 'bg-nuPurple/10 text-nuPurple font-black shadow-inner border-l-4 border-nuPurple' 
          : 'text-gray-500 hover:text-white hover:bg-[#111111]'
      }`}
    >
      <Icon size={24} />
      <span className="text-sm uppercase tracking-widest">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-black font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-black border-r border-[#1c1c1c]">
        <div className="p-10 flex items-center gap-3">
          <div className="w-8 h-8 bg-nuPurple rounded-md"></div>
          <h1 className="text-2xl font-black tracking-tighter text-white italic">
            BINARY<span className="text-nuPurple">MIND</span>
          </h1>
        </div>

        <nav className="flex-1 px-6 space-y-2 mt-4">
          <NavItem id="dashboard" icon={Home} label="Início" />
          <NavItem id="market" icon={TrendingUp} label="Trade" />
          <NavItem id="ai_advisor" icon={BrainCircuit} label="NuAdvisor" />
          <NavItem id="ranking" icon={Trophy} label="Elite" />
          <NavItem id="staking" icon={Lock} label="Staking" />
          <NavItem id="settings" icon={Settings} label="Config" />
          
          {user?.role === UserRole.ADMIN && (
            <>
              <div className="my-6 border-t border-[#1c1c1c]"></div>
              <NavItem id="admin" icon={ShieldCheck} label="Admin" />
            </>
          )}
        </nav>

        <div className="p-8 border-t border-[#1c1c1c]">
          <button 
            onClick={onLogout}
            className="flex items-center space-x-3 text-gray-500 hover:text-red-400 w-full px-5 py-3 transition-colors font-bold text-sm"
          >
            <LogOut size={22} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative scrollbar-hide">
        {/* Mobile Header (Hidden on scroll Nu-style would be cool but keep it simple) */}
        <div className="md:hidden flex items-center justify-between p-6 bg-black sticky top-0 z-50">
           <div className="flex items-center gap-2">
             <div className="w-6 h-6 bg-nuPurple rounded-sm"></div>
             <span className="font-black italic text-lg">BMIND</span>
           </div>
           <button onClick={() => setView('settings')} className="text-nuPurple"><Settings size={22}/></button>
        </div>

        {/* Mobile Bottom Nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-[#1c1c1c] flex justify-around p-5 z-[100]">
          <button onClick={() => setView('dashboard')} className={currentView === 'dashboard' ? 'text-nuPurple scale-110' : 'text-gray-600'}><Home size={26}/></button>
          <button onClick={() => setView('market')} className={currentView === 'market' ? 'text-nuPurple scale-110' : 'text-gray-600'}><TrendingUp size={26}/></button>
          <button onClick={() => setView('ai_advisor')} className={currentView === 'ai_advisor' ? 'text-nuPurple scale-110' : 'text-gray-600'}><BrainCircuit size={26}/></button>
          <button onClick={() => setView('ranking')} className={currentView === 'ranking' ? 'text-nuPurple scale-110' : 'text-gray-600'}><Trophy size={26}/></button>
        </div>

        <div className="p-6 md:p-12 pb-32">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
