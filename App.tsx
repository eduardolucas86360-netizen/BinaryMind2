
import React, { useState, useEffect, createContext } from 'react';
import { 
  User, MarketData, UserRole 
} from './types';
import { 
  initializeDB, getCurrentUser, runMarketEngine, logout, initializeBankingCore 
} from './services/api';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import Layout from './components/Layout';
import AIAdvisor from './components/AIAdvisor';
import { Loader2 } from 'lucide-react';

interface AppContextType {
  user: User | null;
  market: MarketData | null;
  privacyMode: boolean;
  togglePrivacy: () => void;
  refreshUser: () => void;
  refreshMarket: () => void;
  setUser: (u: User | null) => void;
}

export const AppContext = createContext<AppContextType>({} as any);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [market, setMarket] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [privacyMode, setPrivacyMode] = useState(false);

  useEffect(() => {
    initializeDB();
    initializeBankingCore();
    
    const syncWithServer = async () => {
      const u = await getCurrentUser();
      setUser(u);
      const m = await runMarketEngine();
      setMarket(m);
      setLoading(false);
    };

    syncWithServer();

    const handleUpdate = () => {
      getCurrentUser().then(setUser);
      runMarketEngine().then(setMarket);
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('storage_update', handleUpdate);

    const interval = setInterval(handleUpdate, 15000);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('storage_update', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  const refreshUser = async () => {
    const u = await getCurrentUser();
    setUser(u);
  };

  const refreshMarket = async () => {
    const m = await runMarketEngine();
    setMarket(m);
  };

  const togglePrivacy = () => {
    setPrivacyMode(prev => !prev);
  }

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setCurrentView('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-gold-500 gap-6">
        <div className="relative">
          <Loader2 className="animate-spin h-12 w-12" />
          <div className="absolute inset-0 bg-gold-500/20 blur-xl animate-pulse rounded-full"></div>
        </div>
        <span className="text-[10px] font-black tracking-[0.4em] uppercase opacity-60">Sincronizando com Obsidian Central Core...</span>
      </div>
    );
  }

  const contrastClass = user?.settings.highContrast ? 'high-contrast' : '';
  const textClass = user?.settings.largeText ? 'large-text' : '';

  const renderView = () => {
    if (user?.role === UserRole.ADMIN && currentView === 'admin') return <AdminPanel />;
    if (currentView === 'ai_advisor') return <AIAdvisor />;
    return <Dashboard currentView={currentView} setView={setCurrentView} />;
  }

  return (
    <AppContext.Provider value={{ user, market, privacyMode, togglePrivacy, refreshUser, refreshMarket, setUser }}>
      <div className={`${contrastClass} ${textClass} min-h-screen text-zinc-100 font-sans selection:bg-gold-500 selection:text-black`}>
        {!user ? (
          <Login />
        ) : (
          <Layout onLogout={handleLogout} currentView={currentView} setView={setCurrentView}>
            {renderView()}
          </Layout>
        )}
      </div>
    </AppContext.Provider>
  );
};

export default App;
