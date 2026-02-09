
import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { CURRENCY_SYMBOL, CRYPTO_SYMBOL } from '../constants';
import { MarketChart } from './Market'; 
import StakingPanel from './Staking';
import SettingsPanel from './Settings';
import RankingPanel from './Ranking';
import AIAdvisor from './AIAdvisor';
import { 
  Eye, EyeOff, Send, QrCode, TrendingUp, Lock, ChevronRight, 
  Wallet, DollarSign, BrainCircuit, Trophy, PlusCircle, Smartphone, X
} from 'lucide-react';
import { buyCrypto, sellCrypto, transferFiat } from '../services/api';

const Dashboard: React.FC<{ currentView: string, setView: (v: string) => void }> = ({ currentView, setView }) => {
  const { user, market, refreshUser, privacyMode, togglePrivacy } = useContext(AppContext);
  const [tradeAmount, setTradeAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferEmail, setTransferEmail] = useState('');
  const [transferValue, setTransferValue] = useState('');

  if (!user || !market) return null;

  const handleTrade = async (type: 'buy' | 'sell') => {
    setError('');
    const val = parseFloat(tradeAmount);
    if (isNaN(val) || val <= 0) {
      setError('Valor inválido.');
      return;
    }
    try {
      if (type === 'buy') await buyCrypto(user.id, val, market.currentPrice);
      else await sellCrypto(user.id, val, market.currentPrice);
      setTradeAmount('');
      refreshUser();
      setSuccess('Ordem executada com sucesso.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) { setError(err.message); }
  };

  const MaskedValue = ({ value, isCrypto = false, prefix = '' }: { value: number, isCrypto?: boolean, prefix?: string }) => {
    if (privacyMode) return <span className="bg-nuPurple/20 text-transparent rounded px-2 select-none">••••••</span>;
    if (isCrypto) return <span>{value.toLocaleString('pt-BR', { minimumFractionDigits: 4 })}</span>;
    return <span>{prefix} {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>;
  };

  const Overview = () => (
    <div className="space-y-6 max-w-lg mx-auto pb-24 animate-in fade-in slide-in-from-bottom-2">
      {/* Header Profile */}
      <div className="flex justify-between items-center mb-6 px-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-nuPurple flex items-center justify-center text-white font-bold text-lg shadow-lg">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <p className="text-xl font-bold text-white">Olá, {user.name.split(' ')[0]}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={togglePrivacy} className="p-3 text-white hover:bg-white/10 rounded-full transition-all">
            {privacyMode ? <EyeOff size={24} /> : <Eye size={24} />}
          </button>
          <button className="p-3 text-white hover:bg-white/10 rounded-full transition-all">
            <PlusCircle size={24} />
          </button>
        </div>
      </div>

      {/* Conta Card */}
      <div className="bg-[#111111] p-6 rounded-3xl group cursor-pointer hover:bg-[#1a1a1a] transition-colors border border-[#1c1c1c] shadow-md">
        <div className="flex justify-between items-center mb-4">
          <p className="font-bold text-white text-lg">Conta</p>
          <ChevronRight size={20} className="text-gray-600 group-hover:text-nuPurple transition-colors" />
        </div>
        <p className="text-3xl font-black text-white">
          <MaskedValue value={user.balanceFiat} prefix={CURRENCY_SYMBOL} />
        </p>
      </div>

      {/* Action Buttons Horizontal */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-1">
        {[
          { icon: QrCode, label: 'Área Pix' },
          { icon: Send, label: 'Transferir' },
          { icon: Smartphone, label: 'Recarga' },
          { icon: Wallet, label: 'Depositar' },
          { icon: DollarSign, label: 'Pagar' }
        ].map((btn, i) => (
          <div key={i} className="flex flex-col items-center gap-2 min-w-[80px]">
            <button 
              onClick={() => btn.label === 'Transferir' && setShowTransferModal(true)}
              className="w-16 h-16 bg-[#111111] rounded-full flex items-center justify-center text-white hover:bg-[#222222] border border-[#1c1c1c] transition-all active:scale-90"
            >
              <btn.icon size={26} />
            </button>
            <span className="text-[11px] font-bold text-gray-300">{btn.label}</span>
          </div>
        ))}
      </div>

      {/* Ativos Card (Investimentos) */}
      <div className="bg-[#111111] p-6 rounded-3xl border border-[#1c1c1c] shadow-md">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
             <TrendingUp className="text-nuPurple" size={24} />
             <p className="font-bold text-white text-lg">Investimentos MDC</p>
          </div>
          <ChevronRight size={20} className="text-gray-600" />
        </div>
        <div className="space-y-1">
          <p className="text-gray-400 text-xs uppercase font-bold tracking-widest">Saldo total em ativos</p>
          <p className="text-2xl font-black text-white">
            <MaskedValue value={user.balanceCrypto} isCrypto /> <span className="text-sm font-bold opacity-40">{CRYPTO_SYMBOL}</span>
          </p>
        </div>
        
        <div className="mt-6 pt-6 border-t border-[#1c1c1c]">
           <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Cotação Atual</p>
                <p className="text-lg font-mono font-black text-white">{CURRENCY_SYMBOL} {market.currentPrice.toLocaleString()}</p>
              </div>
              <button 
                onClick={() => setView('market')} 
                className="bg-nuPurple hover:bg-nuPurple-hover text-white px-5 py-2.5 rounded-full font-bold text-xs shadow-lg transition-all active:scale-95"
              >
                Negociar
              </button>
           </div>
           <div className="bg-black/20 rounded-2xl p-2 border border-[#1c1c1c]">
              <MarketChart data={market.priceHistory} />
           </div>
        </div>
      </div>

      {/* Meus Cartões */}
      <div className="bg-[#111111] p-6 rounded-3xl border border-[#1c1c1c] flex items-center gap-4 hover:bg-[#1a1a1a] transition-colors cursor-pointer">
         <div className="p-2 bg-nuPurple/10 rounded-lg">
           <Smartphone className="text-nuPurple" />
         </div>
         <p className="font-bold text-white">Meus cartões virtuais</p>
      </div>

      {/* Advisor Shortcut */}
      <div 
        className="bg-[#111111] p-6 rounded-3xl border border-[#1c1c1c] cursor-pointer hover:bg-[#1a1a1a] transition-all group" 
        onClick={() => setView('ai_advisor')}
      >
         <div className="flex gap-4">
            <div className="w-12 h-12 bg-nuPurple/10 rounded-2xl flex items-center justify-center text-nuPurple group-hover:scale-110 transition-transform">
               <BrainCircuit />
            </div>
            <div>
               <p className="font-bold text-white">NuAdvisor AI</p>
               <p className="text-xs text-gray-500">Consultoria inteligente para sua carteira MDC.</p>
            </div>
         </div>
      </div>

      {showTransferModal && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in slide-in-from-bottom duration-300">
          <div className="bg-[#111111] border-t sm:border border-[#1c1c1c] w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-10 pb-20 sm:pb-10 relative shadow-2xl">
             <button onClick={() => setShowTransferModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors">
               <X size={32}/>
             </button>
             <h2 className="text-2xl font-black text-white mb-10">Qual o valor da transferência?</h2>
             <form onSubmit={async (e) => {
               e.preventDefault();
               try {
                 await transferFiat(user.id, transferEmail, parseFloat(transferValue));
                 setShowTransferModal(false);
                 refreshUser();
                 setTransferEmail('');
                 setTransferValue('');
                 alert("Transferência realizada com sucesso.");
               } catch (err: any) { alert(err.message); }
             }} className="space-y-8">
                <div className="relative">
                  <span className="absolute left-0 bottom-4 text-4xl font-black text-nuPurple">{CURRENCY_SYMBOL}</span>
                  <input 
                    type="number" 
                    required
                    autoFocus
                    placeholder="0,00"
                    className="w-full bg-transparent text-white font-black text-5xl outline-none border-b border-nuPurple/30 focus:border-nuPurple py-4 pl-14 transition-all"
                    value={transferValue}
                    onChange={e => setTransferValue(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Destinatário</label>
                  <input 
                    type="email" 
                    required
                    placeholder="E-mail na rede BinaryMind"
                    className="w-full bg-black border border-[#1c1c1c] rounded-2xl p-5 text-white outline-none focus:border-nuPurple transition-all"
                    value={transferEmail}
                    onChange={e => setTransferEmail(e.target.value)}
                  />
                </div>
                <button type="submit" className="w-full bg-nuPurple hover:bg-nuPurple-hover text-white font-black py-5 rounded-full text-lg shadow-xl shadow-nuPurple/20 transition-all active:scale-95">
                   Confirmar transferência
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );

  const MarketView = () => (
    <div className="max-w-lg mx-auto space-y-6 animate-in fade-in pb-24">
       <div className="flex items-center gap-4 mb-4">
          <button onClick={() => setView('dashboard')} className="p-3 bg-[#111111] rounded-full text-nuPurple hover:bg-[#1a1a1a] transition-all">
            <ChevronRight className="rotate-180" size={24} />
          </button>
          <h2 className="text-2xl font-black text-white tracking-tighter">Trade Center</h2>
       </div>

       <div className="bg-[#111111] p-6 rounded-3xl border border-[#1c1c1c] shadow-lg">
          <div className="flex justify-between items-start mb-10">
             <div>
                <p className="text-gray-500 text-xs font-bold uppercase mb-1 tracking-widest">Cotação MDC</p>
                <p className="text-4xl font-black text-white">{CURRENCY_SYMBOL} {market.currentPrice.toLocaleString()}</p>
             </div>
             <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${market.trend === 'BULLISH' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                {market.trend}
             </div>
          </div>
          <div className="bg-black/30 rounded-2xl p-4">
            <MarketChart data={market.priceHistory} />
          </div>
       </div>

       <div className="bg-[#111111] p-8 rounded-3xl border border-[#1c1c1c] space-y-6 shadow-lg">
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-500 uppercase px-1 tracking-widest">Quanto você deseja negociar?</label>
            <div className="relative">
              <input 
                type="number" 
                value={tradeAmount}
                onChange={e => setTradeAmount(e.target.value)}
                className="w-full bg-black border border-[#1c1c1c] rounded-2xl p-5 text-white font-black text-4xl outline-none focus:border-nuPurple transition-all"
                placeholder="0,00"
              />
              <span className="absolute right-5 bottom-6 text-xl font-bold text-nuPurple">{CRYPTO_SYMBOL}</span>
            </div>
          </div>
          
          <div className="flex justify-between text-sm font-bold text-gray-400 px-1 border-b border-[#1c1c1c] pb-4">
             <span>Custo estimado:</span>
             <span className="text-white">{CURRENCY_SYMBOL} {(parseFloat(tradeAmount || '0') * market.currentPrice).toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <button onClick={() => handleTrade('buy')} className="bg-nuPurple hover:bg-nuPurple-hover text-white font-black py-5 rounded-full text-sm shadow-lg transition-all active:scale-95">COMPRAR</button>
             <button onClick={() => handleTrade('sell')} className="bg-white hover:bg-gray-100 text-black font-black py-5 rounded-full text-sm shadow-lg transition-all active:scale-95">VENDER</button>
          </div>
          
          {error && <p className="text-center text-red-500 text-xs font-bold animate-pulse">{error}</p>}
          {success && <p className="text-center text-green-500 text-xs font-bold">{success}</p>}
       </div>
    </div>
  );

  switch (currentView) {
    case 'dashboard': return <Overview />;
    case 'market': return <MarketView />;
    case 'ranking': return <RankingPanel />;
    case 'staking': return <StakingPanel />;
    case 'settings': return <SettingsPanel />;
    case 'ai_advisor': return <AIAdvisor />;
    default: return <Overview />;
  }
};

export default Dashboard;
