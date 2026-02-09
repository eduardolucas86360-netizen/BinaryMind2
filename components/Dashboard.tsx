
import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../App';
import { CURRENCY_SYMBOL, CRYPTO_SYMBOL } from '../constants';
import { MarketChart } from './Market'; 
import StakingPanel from './Staking';
import SettingsPanel from './Settings';
import RankingPanel from './Ranking';
import { 
  Wallet, TrendingUp, History, Lock, AlertCircle, Eye, EyeOff, Send, QrCode, 
  Barcode, ArrowRightLeft, User as UserIcon, X, Trophy, Search, CheckCircle, Loader2
} from 'lucide-react';
import { buyCrypto, sellCrypto, transferFiat, getPublicDirectory } from '../services/api';

const Dashboard: React.FC<{ currentView: string, setView: (v: string) => void }> = ({ currentView, setView }) => {
  const { user, market, refreshUser, privacyMode, togglePrivacy } = useContext(AppContext);
  const [tradeAmount, setTradeAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Transfer State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferEmail, setTransferEmail] = useState('');
  const [transferValue, setTransferValue] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  
  // Public Directory for Transfers
  const [directory, setDirectory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Sincroniza o diretório sempre que o modal abrir ou houver mudanças no banco
    const fetchDir = async () => {
      if (user) {
        const dir = await getPublicDirectory(user.id);
        setDirectory(dir);
      }
    };
    fetchDir();
    
    window.addEventListener('storage_update', fetchDir);
    return () => window.removeEventListener('storage_update', fetchDir);
  }, [user]);

  if (!user || !market) return null;

  const handleTrade = async (type: 'buy' | 'sell') => {
    setError('');
    setSuccess('');
    const val = parseFloat(tradeAmount);
    if (isNaN(val) || val <= 0) {
      setError('Por favor, insira uma quantidade válida');
      return;
    }

    try {
      if (type === 'buy') {
        await buyCrypto(user.id, val, market.currentPrice);
        setSuccess(`Ordem de compra de ${val} MDC executada.`);
      } else {
        await sellCrypto(user.id, val, market.currentPrice);
        setSuccess(`Ordem de venda de ${val} MDC executada.`);
      }
      setTradeAmount('');
      refreshUser();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferLoading(true);
    const val = parseFloat(transferValue);
    if (isNaN(val) || val <= 0) {
      alert("Valor inválido");
      setTransferLoading(false);
      return;
    }
    try {
      await transferFiat(user.id, transferEmail, val);
      alert("Transferência realizada com sucesso!");
      setShowTransferModal(false);
      setTransferEmail('');
      setTransferValue('');
      refreshUser();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setTransferLoading(false);
    }
  }

  const selectRecipient = (email: string) => {
    setTransferEmail(email);
    setSearchTerm('');
    // Pequeno delay para UX antes de focar se necessário, ou abrir modal direto
    setShowTransferModal(true);
  };

  const filteredDirectory = directory.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Components ---

  const QuickActionButton = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) => (
    <div className="flex flex-col items-center gap-2 min-w-[80px]">
      <button 
        onClick={onClick}
        className="w-16 h-16 rounded-full bg-dark-800 hover:bg-gold-500/20 text-white hover:text-gold-500 flex items-center justify-center transition-colors border border-dark-800 hover:border-gold-500/50"
      >
        <Icon size={24} />
      </button>
      <span className="text-xs font-medium text-zinc-300 text-center">{label}</span>
    </div>
  );

  const MaskedValue = ({ value, isCrypto = false, prefix = '' }: { value: number, isCrypto?: boolean, prefix?: string }) => {
    if (privacyMode) return <span className="bg-dark-800 text-transparent rounded animate-pulse select-none">••••••</span>;
    if (isCrypto) return <span>{value.toLocaleString('pt-BR', { minimumFractionDigits: 4 })}</span>;
    return <span>{prefix} {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>;
  };

  const Overview = () => (
    <div className="space-y-8">
      {/* Header with Privacy Toggle */}
      <div className="flex justify-between items-center bg-dark-900/50 p-4 rounded-xl border border-dark-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold-500 text-black flex items-center justify-center font-bold shadow-lg shadow-gold-500/10">
            <UserIcon size={20} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white">Olá, {user.name.split(' ')[0]}</span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">{user.id}</span>
          </div>
        </div>
        <button onClick={togglePrivacy} className="p-2 text-gold-500 hover:bg-dark-800 rounded-full transition-colors">
          {privacyMode ? <EyeOff size={24} /> : <Eye size={24} />}
        </button>
      </div>

      {/* Main Account Balance */}
      <div>
        <div className="flex items-center justify-between mb-2 px-2">
          <span className="text-lg font-bold text-white">Saldo em Conta</span>
          <div className="flex items-center gap-2 bg-green-500/10 text-green-500 px-2 py-1 rounded text-[10px] font-bold">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            SISTEMA OPERACIONAL
          </div>
        </div>
        <div className="text-4xl font-bold text-white px-2 mb-8 font-mono tracking-tight">
          <MaskedValue value={user.balanceFiat} prefix={CURRENCY_SYMBOL} />
        </div>

        {/* Quick Actions Carousel */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-2">
          <QuickActionButton icon={QrCode} label="Pix" onClick={() => setShowTransferModal(true)} />
          <QuickActionButton icon={Barcode} label="Pagar" onClick={() => alert("Função em desenvolvimento. Use o Pix para agilidade.")} />
          <QuickActionButton icon={Send} label="Transferir" onClick={() => setShowTransferModal(true)} />
          <QuickActionButton icon={Trophy} label="Rankings" onClick={() => setView('ranking')} />
          <QuickActionButton icon={TrendingUp} label="Exchange" onClick={() => setView('market')} />
          <QuickActionButton icon={Lock} label="Staking" onClick={() => setView('staking')} />
        </div>
      </div>

      {/* Public Directory Widget (Real-time Connectivity) */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <UserIcon size={20} className="text-gold-500"/> Rede de Usuários
            </h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Contas conectadas ao servidor</p>
          </div>
          <span className="text-[10px] bg-gold-500/10 text-gold-500 px-2 py-1 rounded font-bold border border-gold-500/20">REAL-TIME</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {directory.length === 0 ? (
            <div className="col-span-4 text-center py-8 bg-dark-950 rounded-xl border border-dashed border-dark-800">
               <Loader2 className="animate-spin mx-auto text-zinc-700 mb-2" size={24} />
               <p className="text-xs text-zinc-600">Aguardando novos registros na rede...</p>
            </div>
          ) : (
            directory.map(u => (
              <div 
                key={u.id}
                className="group flex flex-col p-4 bg-dark-950 rounded-xl border border-dark-800 hover:border-gold-500/50 transition-all relative overflow-hidden"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-dark-800 flex items-center justify-center text-zinc-400 group-hover:bg-gold-500 group-hover:text-black transition-colors relative">
                    <UserIcon size={18} />
                    {u.kycVerified && <CheckCircle size={10} className="absolute -bottom-0.5 -right-0.5 text-gold-500 bg-dark-950 rounded-full" />}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-bold text-white truncate">{u.name}</span>
                    <span className="text-[9px] text-zinc-500 truncate">{u.email}</span>
                  </div>
                </div>
                <button 
                  onClick={() => selectRecipient(u.email)}
                  className="w-full bg-dark-800 hover:bg-gold-500 text-zinc-300 hover:text-black text-[10px] font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Send size={12} /> ENVIAR DINHEIRO
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Transaction History */}
      <div className="border-t border-dark-800 pt-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">Fluxo de Caixa</h3>
        <div className="space-y-3">
          {user.transactions.length === 0 ? (
            <div className="text-center py-10 bg-dark-900/30 rounded-2xl border border-dashed border-dark-800">
               <History size={32} className="mx-auto text-zinc-600 mb-2" />
               <p className="text-zinc-500 text-sm">Nenhuma transação registrada nesta conta.</p>
            </div>
          ) : (
            user.transactions.slice(0, 5).map(tx => (
              <div key={tx.id} className="flex justify-between items-center group p-3 bg-dark-900/20 hover:bg-dark-900/50 rounded-xl border border-transparent hover:border-dark-800 transition-all">
                 <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-dark-800 text-zinc-400 group-hover:text-gold-500 transition-colors`}>
                      {tx.type.includes('BUY') ? <TrendingUp size={18}/> : 
                       tx.type.includes('TRANSFER') ? <ArrowRightLeft size={18}/> :
                       tx.type.includes('SELL') ? <Wallet size={18}/> : <History size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{tx.description}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">{new Date(tx.timestamp).toLocaleString('pt-BR')}</p>
                    </div>
                 </div>
                 <div className="text-right">
                   <p className={`font-mono text-sm font-bold ${
                     tx.type === 'BUY' || tx.type === 'TRANSFER_OUT' ? 'text-zinc-400' : 'text-green-500'
                   }`}>
                     {tx.type === 'BUY' || tx.type === 'TRANSFER_OUT' ? '-' : '+'} <MaskedValue value={tx.amountFiat || 0} prefix={CURRENCY_SYMBOL} />
                   </p>
                   <p className="text-[9px] text-zinc-600 uppercase font-mono">{tx.id}</p>
                 </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Transfer Modal (Optimized for Speed) */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] p-4 backdrop-blur-md animate-in fade-in zoom-in duration-200">
          <div className="bg-dark-900 border border-dark-800 w-full max-w-md rounded-3xl p-6 relative shadow-2xl">
             <button onClick={() => { setShowTransferModal(false); setTransferEmail(''); }} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"><X size={24}/></button>
             
             <div className="mb-8">
               <h3 className="text-xl font-bold text-white flex items-center gap-2"><Send className="text-gold-500" size={20}/> Envio Instantâneo</h3>
               <p className="text-xs text-zinc-500">Transfira saldo em tempo real para qualquer usuário do banco.</p>
             </div>
             
             <form onSubmit={handleTransfer} className="space-y-6">
                <div className="relative">
                   <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2 block">Identificador do Recebedor</label>
                   <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                      <input 
                        type="text" 
                        autoFocus={!transferEmail}
                        className="w-full bg-dark-950 border border-dark-800 rounded-xl p-4 pl-12 text-white focus:border-gold-500 outline-none transition-all placeholder:text-zinc-700 font-medium"
                        placeholder="Nome ou e-mail do destinatário..."
                        value={searchTerm || transferEmail}
                        onChange={e => {
                          setSearchTerm(e.target.value);
                          setTransferEmail(e.target.value);
                        }}
                        required
                      />
                   </div>
                   
                   {/* Search Results Dropdown */}
                   {searchTerm && (
                     <div className="absolute top-full left-0 right-0 bg-dark-950 border border-dark-800 rounded-xl mt-2 max-h-48 overflow-y-auto z-50 shadow-2xl animate-in slide-in-from-top-2">
                        {filteredDirectory.length === 0 ? (
                          <p className="p-4 text-xs text-zinc-500 italic text-center">Nenhum usuário encontrado na base de dados.</p>
                        ) : (
                          filteredDirectory.map(u => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => { selectRecipient(u.email); setTransferEmail(u.email); setSearchTerm(''); }}
                              className="w-full text-left p-3 hover:bg-dark-800 flex items-center justify-between border-b border-dark-900 last:border-0"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-dark-900 flex items-center justify-center text-zinc-500"><UserIcon size={14}/></div>
                                <div>
                                  <p className="text-sm font-bold text-white">{u.name}</p>
                                  <p className="text-[10px] text-zinc-500">{u.email}</p>
                                </div>
                              </div>
                              {u.kycVerified && <CheckCircle size={14} className="text-gold-500" />}
                            </button>
                          ))
                        )}
                     </div>
                   )}
                </div>

                <div className="bg-dark-950 p-6 rounded-2xl border border-dark-800">
                   <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-3 block text-center">Quanto deseja enviar?</label>
                   <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl font-bold text-gold-500">{CURRENCY_SYMBOL}</span>
                      <input 
                        type="number" 
                        autoFocus={!!transferEmail}
                        className="bg-transparent text-center text-4xl font-mono font-bold text-white outline-none w-full max-w-[200px]"
                        placeholder="0,00"
                        value={transferValue}
                        onChange={e => setTransferValue(e.target.value)}
                        required
                      />
                   </div>
                   <div className="flex justify-center mt-4">
                      <div className="px-3 py-1 bg-dark-900 rounded-full border border-dark-800 text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">
                        Saldo Disponível: {CURRENCY_SYMBOL} {user.balanceFiat.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                   </div>
                </div>
                
                <button 
                  type="submit" 
                  disabled={transferLoading || !transferEmail}
                  className="w-full bg-gold-500 text-black font-black py-5 rounded-2xl hover:bg-gold-400 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-3 shadow-xl shadow-gold-500/10 active:scale-95"
                >
                  {transferLoading ? <Loader2 className="animate-spin" /> : <>AUTORIZAR TRANSFERÊNCIA <ArrowRightLeft size={18} /></>}
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );

  const MarketView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
           <h3 className="text-xl font-bold text-white mb-4">Monitor de Rede MDC</h3>
           <MarketChart data={market.priceHistory} />
        </div>
      </div>
      <div className="space-y-6">
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Terminal de Negociação</h3>
          
          <div className="mb-4">
             <label className="text-xs text-zinc-400 uppercase font-bold">Volume (MDC)</label>
             <input 
               type="number" 
               value={tradeAmount}
               onChange={e => setTradeAmount(e.target.value)}
               className="w-full bg-dark-950 border border-dark-800 rounded-lg p-3 text-white mt-1 focus:border-gold-500 outline-none font-mono"
               placeholder="0.00"
             />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-dark-950 p-3 rounded-lg border border-dark-800">
               <p className="text-xs text-zinc-500">Cotação</p>
               <p className="font-mono text-zinc-200">{CURRENCY_SYMBOL} {(parseFloat(tradeAmount || '0') * market.currentPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-dark-950 p-3 rounded-lg border border-dark-800">
               <p className="text-xs text-zinc-500">Disponível</p>
               <p className="font-mono text-zinc-200">{CURRENCY_SYMBOL} {user.balanceFiat.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          {error && <div className="mb-4 p-3 bg-red-900/20 border border-red-900/50 text-red-400 text-sm rounded-lg flex items-center gap-2"><AlertCircle size={16}/>{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-900/20 border border-green-900/50 text-green-400 text-sm rounded-lg">{success}</div>}

          <div className="grid grid-cols-2 gap-3">
             <button onClick={() => handleTrade('buy')} className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-colors">
               COMPRAR
             </button>
             <button onClick={() => handleTrade('sell')} className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-colors">
               VENDER
             </button>
          </div>
        </div>
      </div>
    </div>
  );

  const NotificationsView = () => (
    <div className="max-w-2xl mx-auto space-y-4">
      <h3 className="text-2xl font-bold text-white mb-6">Central de Alertas</h3>
      {user.notifications.length === 0 ? (
        <p className="text-zinc-500 text-center py-10">Nenhuma notificação na rede.</p>
      ) : (
        user.notifications.map(n => (
          <div key={n.id} className={`p-4 rounded-xl border transition-all ${n.read ? 'bg-dark-900 border-dark-800' : 'bg-gold-500/5 border-gold-500 shadow-[0_0_15px_-5px_rgba(245,158,11,0.2)]'}`}>
            <h4 className="font-bold text-white">{n.title}</h4>
            <p className="text-zinc-300 text-sm mt-1">{n.message}</p>
            <p className="text-xs text-zinc-500 mt-2 text-right">{new Date(n.timestamp).toLocaleString('pt-BR')}</p>
          </div>
        ))
      )}
    </div>
  );

  switch (currentView) {
    case 'dashboard': return <Overview />;
    case 'market': return <MarketView />;
    case 'ranking': return <RankingPanel />;
    case 'staking': return <StakingPanel />;
    case 'settings': return <SettingsPanel />;
    case 'notifications': return <NotificationsView />;
    default: return <Overview />;
  }
};

export default Dashboard;
