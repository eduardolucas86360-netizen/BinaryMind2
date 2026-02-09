
import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { startStaking } from '../services/api';
import { KycStatus } from '../types';
import { Lock, ShieldAlert, Timer, Sparkles } from 'lucide-react';
import { CRYPTO_SYMBOL, STAKING_YIELD_RATES } from '../constants';

const StakingPanel: React.FC = () => {
  const { user, refreshUser } = useContext(AppContext);
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<number>(24);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  if (!user) return null;

  const handleStake = async () => {
    setMsg({ type: '', text: '' });
    if (user.kycStatus !== KycStatus.VERIFIED) {
      setMsg({ type: 'error', text: 'Protocolo KYC incompleto. Verificação mandatória.' });
      return;
    }

    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setMsg({ type: 'error', text: 'Quantidade de ativos MDC inválida.' });
      return;
    }

    setLoading(true);
    try {
      await startStaking(user.id, val, period);
      setMsg({ type: 'success', text: `Custódia estabelecida: ${val} ${CRYPTO_SYMBOL}` });
      setAmount('');
      refreshUser();
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const getRewardPercent = (hours: number) => {
    const rate = (STAKING_YIELD_RATES as any)[hours] || 0;
    return `${(rate * 100).toFixed(0)}%`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-1000">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gold-500/10 border border-gold-500/20 rounded-full text-gold-500 text-[10px] font-black uppercase tracking-widest mb-4">
           <Sparkles size={14} /> Alto Rendimento Certificado
        </div>
        <h2 className="text-4xl font-black text-white italic tracking-tighter">OBSIDIAN YIELD STAKING</h2>
        <p className="text-zinc-500 text-sm max-w-xl mx-auto">Imobilize seus ativos MDC na infraestrutura central para assegurar provisões de liquidez e recompensas exponenciais.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Create Stake Form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Lock size={120} />
          </div>
          
          <h3 className="text-xl font-black text-white uppercase tracking-tighter italic mb-8 flex items-center gap-3">
            <Lock className="text-gold-500" /> ALOCAR ATIVOS
          </h3>
          
          {user.kycStatus !== KycStatus.VERIFIED && (
            <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl flex items-center gap-4 text-red-500 text-xs font-bold mb-8">
              <ShieldAlert size={24} /> 
              <span>Verificação de Conformidade KYC Mandatória para operações de Staking.</span>
            </div>
          )}

          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Montante para Bloqueio</label>
              <div className="relative">
                 <input 
                  type="number" 
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-2xl p-5 text-white font-mono text-3xl font-black focus:border-gold-500 outline-none transition-all"
                  placeholder="0.00"
                  disabled={loading}
                 />
                 <span className="absolute right-5 top-7 text-zinc-600 font-mono font-bold">{CRYPTO_SYMBOL}</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Maturação Temporal</label>
              <div className="grid grid-cols-3 gap-3">
                {[24, 72, 168].map(h => (
                  <button
                    key={h}
                    onClick={() => setPeriod(h)}
                    className={`py-4 rounded-2xl border flex flex-col items-center gap-1 transition-all duration-300 ${
                      period === h 
                      ? 'bg-gold-500 text-black border-gold-500 shadow-lg shadow-gold-500/20 scale-105' 
                      : 'bg-black border-zinc-800 text-zinc-500 hover:border-zinc-600'
                    }`}
                  >
                    <span className="text-xs font-black uppercase">{h < 48 ? '24h' : h < 100 ? '3 Dias' : '7 Dias'}</span>
                    <span className={`text-[10px] font-mono ${period === h ? 'text-black/70' : 'text-gold-500/70'}`}>+{getRewardPercent(h)}</span>
                  </button>
                ))}
              </div>
            </div>

            {msg.text && (
              <div className={`text-xs font-bold p-4 rounded-2xl animate-in fade-in zoom-in ${msg.type === 'error' ? 'text-red-500 bg-red-500/10 border border-red-500/20' : 'text-green-500 bg-green-500/10 border border-green-500/20'}`}>
                {msg.text}
              </div>
            )}

            <button 
              onClick={handleStake}
              disabled={loading || user.kycStatus !== KycStatus.VERIFIED}
              className="w-full bg-gold-500 text-black font-black py-6 rounded-2xl hover:bg-gold-400 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-xl shadow-gold-500/10 text-sm uppercase tracking-widest active:scale-95"
            >
              {loading ? 'AUTENTICANDO BLOCO...' : 'ASSINAR CONTRATO DE CUSTÓDIA'}
            </button>
          </div>
        </div>

        {/* Active Stakes */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 shadow-2xl">
          <h3 className="text-xl font-black text-white uppercase tracking-tighter italic mb-8 flex items-center gap-3">
            <Timer className="text-gold-500" /> POSIÇÕES VIGENTES
          </h3>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 scrollbar-hide">
            {user.staking.filter(s => s.active).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-30 grayscale">
                <Lock size={48} className="mb-4" />
                <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">Nenhuma alocação detectada</p>
              </div>
            ) : (
              user.staking.filter(s => s.active).map(s => (
                <div key={s.id} className="bg-black border border-zinc-800 p-6 rounded-[2rem] hover:border-zinc-700 transition-all">
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <p className="text-[9px] text-zinc-600 font-mono uppercase mb-1">IDENTIFICADOR: {s.id.slice(-6)}</p>
                        <p className="text-2xl font-mono font-black text-gold-500 tracking-tighter">{s.amount.toLocaleString()} {CRYPTO_SYMBOL}</p>
                     </div>
                     <span className="text-[10px] font-black text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800 uppercase tracking-widest">
                       {s.durationHours}H TERM
                     </span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">
                    <span>Yield: +{s.potentialReward.toFixed(3)}</span>
                    <span>Finalização: {new Date(s.startDate + s.durationHours * 3600000).toLocaleDateString()}</span>
                  </div>
                  <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-gold-600 to-gold-400 h-full transition-all duration-1000" 
                      style={{ width: `${Math.min(100, ((Date.now() - s.startDate) / (s.durationHours * 3600000)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StakingPanel;
