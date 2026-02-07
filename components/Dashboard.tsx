
import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { CURRENCY_SYMBOL, CRYPTO_SYMBOL } from '../constants';
import { MarketChart } from './Market'; 
import StakingPanel from './Staking';
import SettingsPanel from './Settings';
import RankingPanel from './Ranking';
import { 
  ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, History, 
  Lock, AlertCircle, Eye, EyeOff, Send, QrCode, 
  Smartphone, Barcode, ArrowRightLeft, User as UserIcon, X, Trophy
} from 'lucide-react';
import { buyCrypto, sellCrypto, transferFiat } from '../services/api';

const Dashboard: React.FC<{ currentView: string, setView: (v: string) => void }> = ({ currentView, setView }) => {
  const { user, market, refreshUser, privacyMode, togglePrivacy } = useContext(AppContext);
  const [tradeAmount, setTradeAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Transfer State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferEmail, setTransferEmail] = useState('');
  const [transferValue, setTransferValue] = useState('');

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
    setError('');
    const val = parseFloat(transferValue);
    if (isNaN(val) || val <= 0) {
      alert("Valor inválido");
      return;
    }
    try {
      await transferFiat(user.id, transferEmail, val);
      alert("Transferência enviada para processamento.");
      setShowTransferModal(false);
      setTransferEmail('');
      setTransferValue('');
      refreshUser();
    } catch (err: any) {
      alert(err.message);
    }
  }

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
          <div className="w-10 h-10 rounded-full bg-gold-500 text-black flex items-center justify-center font-bold">
            <UserIcon size={20} />
          </div>
          <span className="font-bold text-white">Olá, {user.name.split(' ')[0]}</span>
        </div>
        <button onClick={togglePrivacy} className="p-2 text-gold-500 hover:bg-dark-800 rounded-full transition-colors">
          {privacyMode ? <EyeOff size={24} /> : <Eye size={24} />}
        </button>
      </div>

      {/* Main Account Balance (Nubank Style) */}
      <div>
        <div className="flex items-center justify-between mb-2 px-2">
          <span className="text-lg font-bold text-white">Conta Corrente</span>
          <ArrowRightLeft size={16} className="text-zinc-500" />
        </div>
        <div className="text-3xl font-bold text-white px-2 mb-6 font-mono">
          <MaskedValue value={user.balanceFiat} prefix={CURRENCY_SYMBOL} />
        </div>

        {/* Quick Actions Carousel */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-2">
          <QuickActionButton icon={QrCode} label="Pix" onClick={() => setShowTransferModal(true)} />
          <QuickActionButton icon={Barcode} label="Pagar" onClick={() => alert("Serviço indisponível no momento. Tente novamente mais tarde.")} />
          <QuickActionButton icon={Send} label="Transferir" onClick={() => setShowTransferModal(true)} />
          <QuickActionButton icon={Trophy} label="Rankings" onClick={() => setView('ranking')} />
          <QuickActionButton icon={TrendingUp} label="Exchange" onClick={() => setView('market')} />
          <QuickActionButton icon={Lock} label="Staking" onClick={() => setView('staking')} />
        </div>
      </div>

      {/* Crypto / Investments Tile */}
      <div 
        className="bg-dark-900 border border-dark-800 rounded-2xl p-6 cursor-pointer hover:bg-dark-800 transition-colors"
        onClick={() => setView('market')}
      >
        <div className="flex justify-between items-start mb-4">
           <div className="flex items-center gap-2 text-white font-bold text-lg">
             <TrendingUp size={20} /> Ativos Digitais
           </div>
           <span className={`text-sm px-2 py-0.5 rounded ${market.trend === 'BULLISH' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
             {market.trend === 'BULLISH' ? '+' : '-'} {((market.priceHistory[market.priceHistory.length-1].price - market.priceHistory[0].price)/market.priceHistory[0].price * 100).toFixed(2)}%
           </span>
        </div>
        <div className="space-y-1">
           <p className="text-zinc-400 text-sm">Posição em MindCoin</p>
           <h3 className="text-2xl font-bold text-gold-500 font-mono">
             <MaskedValue value={user.balanceCrypto} isCrypto={true} /> <span className="text-sm">MDC</span>
           </h3>
           <p className="text-zinc-500 text-xs">
             ≈ <MaskedValue value={user.balanceCrypto * market.currentPrice} prefix={CURRENCY_SYMBOL} />
           </p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="border-t border-dark-800 pt-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">Extrato Recente</h3>
        <div className="space-y-4">
          {user.transactions.length === 0 ? (
            <p className="text-zinc-500 text-sm">Nenhuma movimentação registrada.</p>
          ) : (
            user.transactions.slice(0, 5).map(tx => (
              <div key={tx.id} className="flex justify-between items-center group">
                 <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-dark-800 text-zinc-400 group-hover:text-gold-500 transition-colors`}>
                      {tx.type.includes('BUY') ? <TrendingUp size={18}/> : 
                       tx.type.includes('TRANSFER') ? <ArrowRightLeft size={18}/> :
                       tx.type.includes('SELL') ? <Wallet size={18}/> : <History size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{tx.description}</p>
                      <p className="text-xs text-zinc-500">{new Date(tx.timestamp).toLocaleDateString('pt-BR')}</p>
                    </div>
                 </div>
                 <span className={`font-mono text-sm ${
                   tx.type === 'BUY' || tx.type === 'TRANSFER_OUT' ? 'text-zinc-400' : 'text-green-500'
                 }`}>
                   {tx.type === 'BUY' || tx.type === 'TRANSFER_OUT' ? '-' : '+'} <MaskedValue value={tx.amountFiat || 0} prefix={CURRENCY_SYMBOL} />
                 </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Transfer Modal (Pix Style) */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-dark-900 border border-dark-800 w-full max-w-md rounded-2xl p-6 relative shadow-2xl">
             <button onClick={() => setShowTransferModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={24}/></button>
             
             <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><QrCode className="text-gold-500"/> Área Pix</h3>
             
             <form onSubmit={handleTransfer} className="space-y-6">
                <div>
                   <label className="text-sm text-zinc-400 mb-2 block">Chave Pix (E-mail)</label>
                   <input 
                     type="email" 
                     className="w-full bg-dark-950 border border-dark-800 rounded-lg p-4 text-white focus:border-gold-500 outline-none"
                     placeholder="nome@email.com"
                     value={transferEmail}
                     onChange={e => setTransferEmail(e.target.value)}
                     required
                   />
                </div>
                <div>
                   <label className="text-sm text-zinc-400 mb-2 block">Valor</label>
                   <input 
                     type="number" 
                     className="w-full bg-dark-950 border border-dark-800 rounded-lg p-4 text-white focus:border-gold-500 outline-none font-mono text-xl"
                     placeholder="0.00"
                     value={transferValue}
                     onChange={e => setTransferValue(e.target.value)}
                     required
                   />
                   <p className="text-xs text-zinc-500 mt-2">Saldo disponível: {CURRENCY_SYMBOL} {user.balanceFiat.toLocaleString('pt-BR')}</p>
                </div>
                
                <button type="submit" className="w-full bg-gold-500 text-black font-bold py-4 rounded-xl hover:bg-gold-400 flex items-center justify-center gap-2">
                  Confirmar Transferência <ArrowRightLeft size={18} />
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
           <h3 className="text-xl font-bold text-white mb-4">MDC Market Data</h3>
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
      <h3 className="text-2xl font-bold text-white mb-6">Central de Notificações</h3>
      {user.notifications.length === 0 ? (
        <p className="text-zinc-500 text-center py-10">Nenhuma notificação não lida.</p>
      ) : (
        user.notifications.map(n => (
          <div key={n.id} className={`p-4 rounded-xl border ${n.read ? 'bg-dark-900 border-dark-800' : 'bg-dark-800 border-gold-500/50'}`}>
            <h4 className="font-bold text-white">{n.title}</h4>
            <p className="text-zinc-300 text-sm mt-1">{n.message}</p>
            <p className="text-xs text-zinc-500 mt-2 text-right">{new Date(n.timestamp).toLocaleDateString('pt-BR')} {new Date(n.timestamp).toLocaleTimeString('pt-BR')}</p>
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
