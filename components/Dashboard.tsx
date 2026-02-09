
import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../App';
import { CURRENCY_SYMBOL, CRYPTO_SYMBOL } from '../constants';
import { MarketChart } from './Market'; 
import StakingPanel from './Staking';
import SettingsPanel from './Settings';
import RankingPanel from './Ranking';
import { 
  Wallet, TrendingUp, History, Lock, AlertCircle, Eye, EyeOff, Send, QrCode, 
  Barcode, ArrowRightLeft, User as UserIcon, X, Trophy, Search, CheckCircle, Loader2, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { buyCrypto, sellCrypto, transferFiat, getPublicDirectory } from '../services/api';

const Dashboard: React.FC<{ currentView: string, setView: (v: string) => void }> = ({ currentView, setView }) => {
  const { user, market, refreshUser, privacyMode, togglePrivacy } = useContext(AppContext);
  const [tradeAmount, setTradeAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferEmail, setTransferEmail] = useState('');
  const [transferValue, setTransferValue] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [directory, setDirectory] = useState<any[]>([]);

  useEffect(() => {
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
      setError('Quantidade inválida. Por favor, insira um valor numérico positivo.');
      return;
    }
    try {
      if (type === 'buy') await buyCrypto(user.id, val, market.currentPrice);
      else await sellCrypto(user.id, val, market.currentPrice);
      setTradeAmount('');
      refreshUser();
      setSuccess('Ordem de mercado executada e registrada na rede.');
    } catch (err: any) { setError(err.message); }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferLoading(true);
    try {
      await transferFiat(user.id, transferEmail, parseFloat(transferValue));
      alert("Transferência enviada e validada pelos nós da rede.");
      setShowTransferModal(false);
      setTransferEmail('');
      setTransferValue('');
      refreshUser();
    } catch (err: any) { alert(err.message); }
    finally { setTransferLoading(false); }
  }

  const MaskedValue = ({ value, isCrypto = false, prefix = '' }: { value: number, isCrypto?: boolean, prefix?: string }) => {
    if (privacyMode) return <span className="bg-dark-800 text-transparent rounded animate-pulse select-none">••••••</span>;
    if (isCrypto) return <span className="font-mono">{value.toLocaleString('pt-BR', { minimumFractionDigits: 4 })}</span>;
    return <span className="font-mono">{prefix} {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>;
  };

  const Overview = () => (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Premium Glass Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-dark-900 to-black border border-dark-800 p-8 rounded-[2rem] shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10">
           <TrendingUp size={120} />
        </div>
        
        <div className="flex justify-between items-start mb-12">
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gold-500 flex items-center justify-center text-black shadow-[0_0_30px_-5px_rgba(245,158,11,0.4)]">
                <UserIcon size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Membro Prime</h2>
                <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest">{user.name}</p>
              </div>
           </div>
           <button onClick={togglePrivacy} className="p-3 bg-dark-800/50 hover:bg-dark-800 text-gold-500 rounded-2xl transition-all">
             {privacyMode ? <EyeOff size={22} /> : <Eye size={22} />}
           </button>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] mb-4">Total Patrimonial Ledger</p>
          <div className="flex items-baseline gap-3">
             <h1 className="text-6xl font-black text-white tracking-tighter">
               <MaskedValue value={user.balanceFiat} prefix={CURRENCY_SYMBOL} />
             </h1>
          </div>
          <div className="flex items-center gap-4 pt-6">
             <div className="flex items-center gap-2 bg-green-500/10 text-green-500 px-3 py-1.5 rounded-xl border border-green-500/20 text-[10px] font-black">
                <ArrowUpRight size={14} /> + 0.24% HOJE
             </div>
             <div className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest">
               Liquidez Imediata Ativa
             </div>
          </div>
        </div>
      </div>

      {/* Grid de Ativos Digitais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-dark-900/50 backdrop-blur-md border border-dark-800 p-6 rounded-[1.5rem] hover:border-gold-500/30 transition-all group">
            <div className="flex justify-between items-center mb-6">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold-500/10 text-gold-500 flex items-center justify-center border border-gold-500/20 group-hover:scale-110 transition-transform">
                    <TrendingUp size={20} />
                  </div>
                  <h3 className="font-black text-white uppercase tracking-widest text-xs">BinaryMind Coin (MDC)</h3>
               </div>
               <span className="text-[10px] bg-dark-800 px-2 py-1 rounded-lg text-zinc-400 font-mono">TAXA FIXA</span>
            </div>
            <p className="text-3xl font-black text-white mb-2 tracking-tighter">
              <MaskedValue value={user.balanceCrypto} isCrypto />
            </p>
            <p className="text-[10px] text-zinc-500 font-mono uppercase">Equivalente: {CURRENCY_SYMBOL} {(user.balanceCrypto * market.currentPrice).toLocaleString()}</p>
         </div>

         <div className="bg-dark-900/50 backdrop-blur-md border border-dark-800 p-6 rounded-[1.5rem] hover:border-blue-500/30 transition-all group">
            <div className="flex justify-between items-center mb-6">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                    <Barcode size={20} />
                  </div>
                  <h3 className="font-black text-white uppercase tracking-widest text-xs">Crédito Disponível</h3>
               </div>
            </div>
            <p className="text-3xl font-black text-white mb-2 tracking-tighter">
              <MaskedValue value={user.creditCard.limit} prefix={CURRENCY_SYMBOL} />
            </p>
            <div className="w-full bg-dark-800 h-1 rounded-full overflow-hidden mt-4">
               <div className="bg-blue-500 h-full w-[15%]" />
            </div>
         </div>
      </div>

      {/* Ações Rápidas */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
         {[
           { icon: QrCode, label: 'Pix', color: 'text-gold-500' },
           { icon: Send, label: 'Enviar', color: 'text-blue-400' },
           { icon: Lock, label: 'Stake', color: 'text-purple-400' },
           { icon: Trophy, label: 'Elite', color: 'text-zinc-100' },
           { icon: TrendingUp, label: 'Trade', color: 'text-green-400' }
         ].map((action, i) => (
           <button 
            key={i} 
            onClick={() => {
              if (action.label === 'Enviar') setShowTransferModal(true);
              else if (action.label === 'Trade') setView('market');
              else if (action.label === 'Stake') setView('staking');
              else if (action.label === 'Elite') setView('ranking');
            }}
            className="flex flex-col items-center gap-3 min-w-[100px] p-6 bg-dark-900 border border-dark-800 rounded-3xl hover:bg-dark-800 hover:border-zinc-600 transition-all group active:scale-95"
           >
              <div className={`${action.color} group-hover:scale-125 transition-transform`}>
                <action.icon size={28} />
              </div>
              <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">{action.label}</span>
           </button>
         ))}
      </div>

      {/* Histórico Ledger */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] ml-2">Fluxo de Caixa Auditado</h3>
        <div className="bg-dark-900 border border-dark-800 rounded-[2rem] overflow-hidden">
          {user.transactions.length === 0 ? (
            <div className="p-20 text-center text-zinc-700 italic text-sm">Nenhum evento registrado.</div>
          ) : (
            user.transactions.slice(0, 5).map(tx => (
              <div key={tx.id} className="flex justify-between items-center p-6 border-b border-dark-800 last:border-0 hover:bg-dark-800/30 transition-colors">
                 <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${tx.amountFiat && tx.amountFiat > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                       {tx.type.includes('IN') ? <ArrowUpRight size={20}/> : <ArrowDownRight size={20}/>}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{tx.description}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">{new Date(tx.timestamp).toLocaleString()}</p>
                    </div>
                 </div>
                 <div className="text-right">
                   <p className={`font-mono text-sm font-black ${tx.type.includes('IN') ? 'text-green-500' : 'text-zinc-400'}`}>
                     {tx.type.includes('IN') ? '+' : '-'} {CURRENCY_SYMBOL} {(tx.amountFiat || 0).toLocaleString()}
                   </p>
                   <p className="text-[9px] text-zinc-700 uppercase font-mono">{tx.id}</p>
                 </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Transferencia */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-dark-900 border border-dark-800 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative">
             <button onClick={() => setShowTransferModal(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors"><X size={28}/></button>
             <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-8 italic">Transferência Global</h2>
             <form onSubmit={handleTransfer} className="space-y-6">
                <div>
                   <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-2 block">Identificador de Rede</label>
                   <input 
                    type="email" 
                    className="w-full bg-dark-950 border border-dark-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-gold-500" 
                    placeholder="nome@binarymind.com" 
                    value={transferEmail}
                    onChange={e => setTransferEmail(e.target.value)}
                    required
                   />
                </div>
                <div>
                   <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-2 block">Montante (B$)</label>
                   <input 
                    type="number" 
                    className="w-full bg-dark-950 border border-dark-800 rounded-2xl p-4 text-white font-mono text-3xl font-black outline-none focus:border-gold-500" 
                    placeholder="0.00" 
                    value={transferValue}
                    onChange={e => setTransferValue(e.target.value)}
                    required
                   />
                </div>
                <button type="submit" disabled={transferLoading} className="w-full bg-gold-500 text-black font-black py-5 rounded-2xl hover:bg-gold-400 transition-all shadow-xl shadow-gold-500/10">
                   {transferLoading ? 'VALIDANDO BLOCO...' : 'CONFIRMAR ENVIO'}
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );

  const MarketView = () => (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-dark-900 border border-dark-800 p-8 rounded-[2.5rem]">
           <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Exchange Hub</h3>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Volume Real-Time: MDC/B$</p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-black ${market.trend === 'BULLISH' ? 'text-green-500' : 'text-red-500'}`}>
                  {CURRENCY_SYMBOL} {market.currentPrice.toLocaleString()}
                </p>
                <p className="text-[10px] text-zinc-500 font-mono">COTAÇÃO ATUAL</p>
              </div>
           </div>
           <MarketChart data={market.priceHistory} />
        </div>

        <div className="bg-dark-900 border border-dark-800 p-8 rounded-[2.5rem] flex flex-col justify-between">
           <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-8 italic">Terminal</h3>
              <div className="space-y-6">
                <div>
                   <label className="text-[10px] text-zinc-500 font-black uppercase mb-2 block">Quantidade MDC</label>
                   <input 
                    type="number" 
                    value={tradeAmount}
                    onChange={e => setTradeAmount(e.target.value)}
                    className="w-full bg-dark-950 border border-dark-800 rounded-2xl p-4 text-white font-mono text-2xl font-bold outline-none focus:border-gold-500"
                   />
                </div>
                <div className="bg-dark-950 p-4 rounded-2xl border border-dark-800">
                   <p className="text-[10px] text-zinc-500 uppercase font-black mb-1">Custo/Ganho Estimado</p>
                   <p className="text-xl font-mono font-black text-white">
                     {CURRENCY_SYMBOL} {(parseFloat(tradeAmount || '0') * market.currentPrice).toLocaleString()}
                   </p>
                </div>
                {error && <p className="text-xs text-red-500 font-bold bg-red-950/20 p-2 rounded border border-red-900/30">{error}</p>}
                {success && <p className="text-xs text-green-500 font-bold bg-green-950/20 p-2 rounded border border-green-900/30">{success}</p>}
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-4 mt-8">
              <button onClick={() => handleTrade('buy')} className="bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-green-600/10">COMPRAR</button>
              <button onClick={() => handleTrade('sell')} className="bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-red-600/10">VENDER</button>
           </div>
        </div>
      </div>
    </div>
  );

  switch (currentView) {
    case 'dashboard': return <Overview />;
    case 'market': return <MarketView />;
    case 'ranking': return <RankingPanel />;
    case 'staking': return <StakingPanel />;
    case 'settings': return <SettingsPanel />;
    default: return <Overview />;
  }
};

export default Dashboard;
