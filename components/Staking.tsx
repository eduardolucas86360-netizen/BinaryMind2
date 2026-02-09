
import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { startStaking } from '../services/api';
import { KycStatus } from '../types';
import { Lock, ShieldAlert, Timer, PlusCircle } from 'lucide-react';
import { CRYPTO_SYMBOL } from '../constants';

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
      setMsg({ type: 'error', text: 'Protocolo KYC pendente. Verifique sua identidade nas configurações para desbloquear rendimentos.' });
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
      setMsg({ type: 'success', text: `Rendimento ativado com sucesso para ${val} ${CRYPTO_SYMBOL}.` });
      setAmount('');
      refreshUser();
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const getRewardText = (hours: number) => {
    if (hours === 24) return '5%'; 
    if (hours === 72) return '8%';
    if (hours === 168) return '16%';
    return '0%';
  };

  return (
    <div className="max-w-lg mx-auto space-y-8 animate-in fade-in duration-700 pb-24">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-white tracking-tighter italic">Investimentos</h2>
        <p className="text-gray-400 text-sm">Aloque seus ativos {CRYPTO_SYMBOL} para render automaticamente com segurança.</p>
      </div>

      <div className="space-y-6">
        {/* Create Stake Form */}
        <div className="bg-[#111111] border border-[#1c1c1c] rounded-3xl p-6 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <PlusCircle className="text-nuPurple" /> Nova Alocação
          </h3>
          
          {user.kycStatus !== KycStatus.VERIFIED && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-200 text-xs mb-6 font-bold">
              <ShieldAlert size={18} /> Verificação de identidade necessária
            </div>
          )}

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">Valor do aporte</label>
              <div className="relative">
                 <input 
                  type="number" 
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-black border border-[#1c1c1c] rounded-2xl p-4 text-white font-black text-2xl focus:border-nuPurple outline-none transition-all"
                  placeholder="0,00"
                  disabled={loading}
                 />
                 <span className="absolute right-4 top-5 text-nuPurple font-bold">{CRYPTO_SYMBOL}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">Tempo de maturação</label>
              <div className="grid grid-cols-3 gap-2">
                {[24, 72, 168].map(h => (
                  <button
                    key={h}
                    onClick={() => setPeriod(h)}
                    className={`py-3 rounded-2xl border text-[10px] font-black uppercase transition-all flex flex-col items-center justify-center ${
                      period === h 
                      ? 'bg-nuPurple text-white border-nuPurple shadow-lg' 
                      : 'bg-black border-[#1c1c1c] text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <span>{h < 48 ? '24h' : h < 100 ? '3 dias' : '7 dias'}</span>
                    <span className={`text-[8px] mt-0.5 ${period === h ? 'text-white/80' : 'text-nuPurple'}`}>+{getRewardText(h)} yield</span>
                  </button>
                ))}
              </div>
            </div>

            {msg.text && (
              <div className={`text-xs font-bold p-4 rounded-2xl border animate-in zoom-in ${msg.type === 'error' ? 'text-red-400 bg-red-950/20 border-red-900/30' : 'text-green-400 bg-green-950/20 border-green-900/30'}`}>
                {msg.text}
              </div>
            )}

            <button 
              onClick={handleStake}
              disabled={loading || user.kycStatus !== KycStatus.VERIFIED}
              className="w-full bg-nuPurple hover:bg-nuPurple-hover text-white font-black py-5 rounded-full transition-all shadow-xl active:scale-95 uppercase text-xs tracking-widest disabled:opacity-30"
            >
              {loading ? 'Processando...' : 'Confirmar Investimento'}
            </button>
          </div>
        </div>

        {/* Active Stakes */}
        <div className="bg-[#111111] border border-[#1c1c1c] rounded-3xl p-6 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Timer className="text-nuPurple" /> Contratos Ativos
          </h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
            {user.staking.filter(s => s.active).length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                 <Lock size={32} className="text-gray-700 mb-2" />
                 <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Nenhuma alocação ativa</p>
              </div>
            ) : (
              user.staking.filter(s => s.active).map(s => (
                <div key={s.id} className="bg-black border border-[#1c1c1c] rounded-2xl p-5 hover:border-nuPurple/30 transition-colors shadow-inner">
                  <div className="flex justify-between items-start mb-3">
                     <span className="text-white font-black text-lg">{s.amount.toLocaleString()} <span className="text-nuPurple text-sm">{CRYPTO_SYMBOL}</span></span>
                     <span className="text-[10px] font-black text-gray-400 bg-[#111111] px-3 py-1 rounded-full border border-[#1c1c1c] uppercase tracking-tighter">
                       Termo: {s.durationHours}h
                     </span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase mb-4">
                    <span className="text-green-500">Rendimento: +{s.potentialReward.toFixed(3)}</span>
                    <span>Vence em: {new Date(s.startDate + s.durationHours * 3600000).toLocaleDateString()}</span>
                  </div>
                  <div className="w-full bg-[#111111] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-nuPurple h-full transition-all duration-1000" 
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
