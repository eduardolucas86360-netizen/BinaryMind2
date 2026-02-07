
import React, { useState, useEffect, createContext, useContext } from 'react';
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
import { Loader2 } from 'lucide-react';

// --- Contexts ---
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

  // Initialize App
  useEffect(() => {
    // 1. Initialize Database / Persistence Layer
    initializeDB();

    // 2. Start Core Banking Services (Workers)
    initializeBankingCore();
    
    // 3. Authenticate & Load State
    const init = async () => {
      try {
        const u = await getCurrentUser();
        setUser(u);
        const m = await runMarketEngine();
        setMarket(m);
      } catch (e) {
        console.error("Initialization Error:", e);
      } finally {
        setLoading(false);
      }
    };
    init();

    // Polling for UI Updates (Client perspective)
    const interval = setInterval(async () => {
      // Refresh Market State
      const m = await runMarketEngine();
      setMarket(m);
      
      // Refresh User State from "DB" if logged in
      if (localStorage.getItem('binarymind_auth_token')) {
         const u = await getCurrentUser();
         if (u) setUser(u);
      }
    }, 10000);

    return () => clearInterval(interval);
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
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center text-gold-500 gap-4">
        <Loader2 className="animate-spin h-10 w-10" />
        <span className="text-sm font-mono tracking-widest uppercase">Estabelecendo Conexão Segura...</span>
      </div>
    );
  }

  const themeClass = user?.settings.theme === 'light' ? 'light-mode' : '';
  const contrastClass = user?.settings.highContrast ? 'high-contrast' : '';
  const textClass = user?.settings.largeText ? 'large-text' : '';

  return (
    <AppContext.Provider value={{ user, market, privacyMode, togglePrivacy, refreshUser, refreshMarket, setUser }}>
      <div className={`${themeClass} ${contrastClass} ${textClass} min-h-screen text-gray-100 font-sans selection:bg-gold-500 selection:text-black`}>
        {!user ? (
          <Login />
        ) : (
          <Layout onLogout={handleLogout} currentView={currentView} setView={setCurrentView}>
            {user.role === UserRole.ADMIN && currentView === 'admin' ? (
               <AdminPanel />
            ) : (
              <Dashboard currentView={currentView} setView={setCurrentView} />
            )}
          </Layout>
        )}
      </div>
    </AppContext.Provider>
  );
};

export default App;
