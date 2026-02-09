
import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../App';
import { CURRENCY_SYMBOL, CRYPTO_SYMBOL } from '../constants';
import { MarketChart } from './Market'; 
import StakingPanel from './Staking';
import SettingsPanel from './Settings';
import RankingPanel from './Ranking';
import { 
  TrendingUp, Eye, EyeOff, Send, QrCode, 
  Barcode, User as UserIcon, X, Trophy, ArrowUpRight, ArrowDownRight, Zap, CreditCard, ChevronRight
} from 'lucide-react';
import { buyCrypto, sellCrypto, transferFiat } from '../services/api';

const Dashboard: React.FC<{ currentView: string, setView: (v: string) => void }> = ({ currentView, setView }) => {
  const { user, market, refreshUser, privacyMode, togglePrivacy } = useContext(AppContext);
  const [tradeAmount, setTradeAmount] = useState('');
  const [hoveredPrice, setHoveredPrice] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferEmail, setTransferEmail] = useState('');
  const [transferValue, setTransferValue] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);

  if (!user || !market) return null;

  const currentDisplayPrice = hoveredPrice || market.currentPrice;

  const handleTrade = async (type: 'buy' | 'sell') => {
    setError(''); setSuccess('');
    const val = parseFloat(tradeAmount);
    if (isNaN(val) || val <= 0) { setError('Valor inválido'); return; }
    try {
      if (type === 'buy') await buyCrypto(user.id, val, market.currentPrice);
      else await sellCrypto(user.id, val, market.currentPrice);
      setTradeAmount(''); refreshUser(); setSuccess('Ordem concluída.');
    } catch (err: any) { setError(err.message); }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferLoading(true);
    try {
      await transferFiat(user.id, transferEmail, parseFloat(transferValue));
      setShowTransferModal(false); setTransferEmail(''); setTransferValue(''); refreshUser();
      alert("Transferência enviada.");
    } catch (err: any) { alert(err.message); }
    finally { setTransferLoading(false); }
  }

  const MaskedValue = ({ value, isCrypto = false, prefix = '' }: { value: number, isCrypto?: boolean, prefix?: string }) => {
    if (privacyMode) return <span className="bg-zinc-800 text-transparent rounded px-2 select-none opacity-50">••••••</span>;
    return <span className="font-mono">{prefix} {value.toLocaleString('pt-BR', { minimumFractionDigits: isCrypto ? 4 : 2 })}</span>;
  };

  const Overview = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Luxury Obsidian Card */}
      <div className="relative group overflow-hidden bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border border-zinc-800 p-10 rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-gold-500/5 rounded-full blur-[100px] group-hover:bg-gold-500/10 transition-all duration-700"></div>
        
        <div className="flex justify-between items-start relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-gold-500 to-amber-700 flex items-center justify-center text-black shadow-[0_10px_30px_-5px_rgba(245,158,11,0.5)]">
              <Zap size={32} />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.4em] mb-1">Status da Conta</p>
              <h2 className="text-2xl font-black text-white italic tracking-tighter">ELITE OBSIDIAN</h2>
            </div>
          </div>
          <button onClick={togglePrivacy} className="w-12 h-12 flex items-center justify-center bg-zinc-800/30 hover:bg-zinc-800 rounded-2xl border border-zinc-700/50 transition-all">
            {privacyMode ? <EyeOff size={20} className="text-gold-500" /> : <Eye size={20} className="text-zinc-400" />}
          </button>
        </div>

        <div className="mt-16 space-y-4 relative z-10">
          <div className="flex flex-col">
            <span className="text-[11px] text-zinc-500 font-black uppercase tracking-[0.3em] mb-3">Patrimônio Ledger Bruto</span>
            <h1 className="text-7xl font-black text-white tracking-tighter transition-all duration-300">
              <MaskedValue value={user.balanceFiat} prefix={CURRENCY_SYMBOL} />
            </h1>
          </div>
          
          <div className="flex items-center gap-6 pt-8 border-t border-zinc-800/50">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
              <ArrowUpRight size={14} className="text-green-500" />
              <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">+12.4% APR</span>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest opacity-60">Sincronizado com Central Core</p>
          </div>
        </div>
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900/40 backdrop-blur-3xl border border-zinc-800 p-8 rounded-[2.5rem] hover:border-gold-500/40 transition-all duration-500">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gold-500/10 text-gold-500 flex items-center justify-center border border-gold-500/20">
                <TrendingUp size={24} />
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Digital Asset (MDC)</h3>
                <p className="text-[9px] text-zinc-600 font-mono">LIQUIDEZ ALTA</p>
              </div>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-black text-white tracking-tighter mb-2">
                <MaskedValue value={user.balanceCrypto} isCrypto />
              </p>
              <p className="text-[10px] text-zinc-500 font-mono uppercase">≈ {CURRENCY_SYMBOL} {(user.balanceCrypto * market.currentPrice).toLocaleString()}</p>
            </div>
            <ChevronRight className="text-zinc-800" size={32} />
          </div>
        </div>

        <div className="bg-zinc-900/40 backdrop-blur-3xl border border-zinc-800 p-8 rounded-[2.5rem] hover:border-blue-500/40 transition-all duration-500">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <CreditCard size={24} />
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Crédito Adicional</h3>
                <p className="text-[9px] text-zinc-600 font-mono">MASTER BLACK</p>
              </div>
            </div>
          </div>
          <p className="text-4xl font-black text-white tracking-tighter mb-2">
            <MaskedValue value={user.creditCard.limit} prefix={CURRENCY_SYMBOL} />
          </p>
          <div className="h-1.5 w-full bg-zinc-800 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-blue-500 w-[15%]" />
          </div>
        </div>
      </div>

      {/* Quick Access */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {[
          { icon: Send, label: 'Enviar', color: 'text-gold-500' },
          { icon: QrCode, label: 'Pix', color: 'text-zinc-100' },
          { icon: Trophy, label: 'Elite', color: 'text-blue-400' },
          { icon: Zap, label: 'Trade', color: 'text-purple-400' },
          { icon: Barcode, label: 'Boletos', color: 'text-zinc-500' }
        ].map((btn, i) => (
          <button key={i} onClick={() => {
            if (btn.label === 'Enviar') setShowTransferModal(true);
            else if (btn.label === 'Trade') setView('market');
            else if (btn.label === 'Elite') setView('ranking');
          }} className="flex flex-col items-center gap-4 min-w-[120px] p-8 bg-zinc-900/60 border border-zinc-800 rounded-[2rem] hover:bg-zinc-800 transition-all group active:scale-90">
            <div className={`${btn.color} group-hover:scale-110 transition-transform`}>
              <btn.icon size={32} />
            </div>
            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">{btn.label}</span>
          </button>
        ))}
      </div>

      {/* Transactions */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-[3rem] p-10">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.4em]">Audit Trail Ledger</h3>
          <button className="text-[10px] font-black text-gold-500 uppercase tracking-widest hover:underline">Ver Todos</button>
        </div>
        <div className="space-y-4">
          {user.transactions.slice(0, 4).map(tx => (
            <div key={tx.id} className="flex justify-between items-center p-6 bg-black/20 rounded-3xl border border-zinc-800/30 hover:border-zinc-700 transition-all">
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tx.type.includes('IN') ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {tx.type.includes('IN') ? <ArrowUpRight size={20}/> : <ArrowDownRight size={20}/>}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{tx.description}</p>
                  <p className="text-[10px] text-zinc-600 font-mono uppercase">{new Date(tx.timestamp).toLocaleString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-mono text-base font-black ${tx.type.includes('IN') ? 'text-green-500' : 'text-zinc-400'}`}>
                  {tx.type.includes('IN') ? '+' : '-'} {CURRENCY_SYMBOL} {(tx.amountFiat || 0).toLocaleString()}
                </p>
                <p className="text-[8px] text-zinc-800 font-mono uppercase tracking-tighter">{tx.id}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showTransferModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[300] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-[3rem] p-12 relative shadow-2xl">
            <button onClick={() => setShowTransferModal(false)} className="absolute top-10 right-10 text-zinc-600 hover:text-white"><X size={32}/></button>
            <h2 className="text-3xl font-black text-white italic tracking-tighter mb-10">TRANSFERÊNCIA</h2>
            <form onSubmit={handleTransfer} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[11px] text-zinc-500 font-black uppercase tracking-widest">Chave de Identificação</label>
                <input type="email" required className="w-full bg-black border border-zinc-800 rounded-2xl p-5 text-white font-bold outline-none focus:border-gold-500" placeholder="usuario@binary.com" value={transferEmail} onChange={e => setTransferEmail(e.target.value)}/>
              </div>
              <div className="space-y-3">
                <label className="text-[11px] text-zinc-500 font-black uppercase tracking-widest">Quantia (B$)</label>
                <input type="number" required className="w-full bg-black border border-zinc-800 rounded-2xl p-5 text-white font-mono text-4xl font-black outline-none focus:border-gold-500" placeholder="0.00" value={transferValue} onChange={e => setTransferValue(e.target.value)}/>
              </div>
              <button type="submit" disabled={transferLoading} className="w-full bg-gold-500 text-black font-black py-6 rounded-[1.5rem] hover:bg-gold-400 transition-all text-sm uppercase tracking-widest">
                {transferLoading ? 'VALIDANDO BLOCO...' : 'ASSINAR TRANSAÇÃO'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const MarketView = () => (
    <div className="space-y-10 animate-in fade-in duration-1000">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 bg-zinc-900/60 border border-zinc-800 p-10 rounded-[3.5rem] shadow-2xl">
          <div className="flex justify-between items-end mb-12">
            <div>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.4em] mb-2">Monitoramento de Fluxo</p>
              <h3 className="text-3xl font-black text-white italic tracking-tighter">EXCHANGE HUB</h3>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                {market.trend === 'BULLISH' ? <ArrowUpRight className="text-green-500" /> : <ArrowDownRight className="text-red-500" />}
                <p className={`text-4xl font-mono font-black ${market.trend === 'BULLISH' ? 'text-green-500' : 'text-red-500'} transition-all duration-300`}>
                  {CURRENCY_SYMBOL} {currentDisplayPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
                {hoveredPrice ? 'VALOR NO PONTO SELECIONADO' : 'COTAÇÃO EM TEMPO REAL'}
              </p>
            </div>
          </div>
          <MarketChart data={market.priceHistory} onHoverPrice={setHoveredPrice} />
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 p-10 rounded-[3.5rem] flex flex-col justify-between shadow-2xl">
          <div className="space-y-10">
            <h3 className="text-xl font-black text-white italic tracking-tighter">ORDEM DE MERCADO</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Quantidade MDC</label>
                <input type="number" value={tradeAmount} onChange={e => setTradeAmount(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl p-5 text-white font-mono text-2xl font-bold outline-none focus:border-gold-500" />
              </div>
              <div className="bg-black/40 p-5 rounded-2xl border border-zinc-800/50">
                <p className="text-[9px] text-zinc-600 uppercase font-black mb-1">Custo Estimado</p>
                <p className="text-2xl font-mono font-black text-white">
                  {CURRENCY_SYMBOL} {(parseFloat(tradeAmount || '0') * market.currentPrice).toLocaleString()}
                </p>
              </div>
              {error && <p className="text-xs text-red-500 font-bold bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</p>}
              {success && <p className="text-xs text-green-500 font-bold bg-green-500/10 p-3 rounded-xl border border-green-500/20">{success}</p>}
            </div>
          </div>
          <div className="space-y-4 mt-10">
            <button onClick={() => handleTrade('buy')} className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-5 rounded-2xl transition-all uppercase text-xs tracking-[0.2em] shadow-lg shadow-green-600/10">COMPRAR</button>
            <button onClick={() => handleTrade('sell')} className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-5 rounded-2xl transition-all uppercase text-xs tracking-[0.2em] shadow-lg shadow-red-600/10">VENDER</button>
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
