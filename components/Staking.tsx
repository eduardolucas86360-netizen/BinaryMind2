
import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { startStaking } from '../services/api';
import { KycStatus } from '../types';
import { Lock, ShieldAlert, Timer } from 'lucide-react';
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
      setMsg({ type: 'error', text: 'Protocolo KYC pendente. Verifique sua identidade nas configurações para desbloquear staking.' });
      return;
    }

    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setMsg({ type: 'error', text: 'Quantidade de ativos MDC inválida. Insira um valor positivo para bloqueio.' });
      return;
    }

    setLoading(true);
    try {
      await startStaking(user.id, val, period);
      setMsg({ type: 'success', text: `Custódia estabelecida com sucesso: ${val} ${CRYPTO_SYMBOL} alocados.` });
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
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white uppercase tracking-tighter italic">Renda Passiva Obsidian</h2>
        <p className="text-zinc-400">Aloque seus ativos {CRYPTO_SYMBOL} para prover liquidez e receber dividendos de alto rendimento.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Create Stake Form */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-tight">
            <Lock className="text-gold-500" /> Nova Alocação
          </h3>
          
          {user.kycStatus !== KycStatus.VERIFIED && (
            <div className="bg-red-900/10 border border-red-800/30 p-3 rounded-lg flex items-center gap-3 text-red-200 text-xs mb-4 font-bold">
              <ShieldAlert size={18} /> Verificação de Identidade Obrigatória
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Quantidade para Custódia</label>
              <div className="relative">
                 <input 
                  type="number" 
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-dark-950 border border-dark-800 rounded-lg p-3 text-white mt-1 font-mono focus:border-gold-500 outline-none transition-all"
                  placeholder="0.00"
                  disabled={loading}
                 />
                 <span className="absolute right-3 top-4 text-zinc-500 text-sm font-bold">{CRYPTO_SYMBOL}</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Maturação do Bloqueio</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {[24, 72, 168].map(h => (
                  <button
                    key={h}
                    onClick={() => setPeriod(h)}
                    className={`py-2 rounded-lg border text-[10px] font-black uppercase transition-all ${
                      period === h 
                      ? 'bg-gold-500 text-black border-gold-500 shadow-lg' 
                      : 'bg-dark-950 border-dark-800 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    {h < 48 ? '24 Horas' : h < 100 ? '3 Dias' : '7 Dias'}
                    <div className="text-[8px] opacity-70">+{getRewardText(h)} Yield</div>
                  </button>
                ))}
              </div>
            </div>

            {msg.text && (
              <div className={`text-xs font-bold p-3 rounded-xl border animate-in zoom-in ${msg.type === 'error' ? 'text-red-400 bg-red-950/20 border-red-900/30' : 'text-green-400 bg-green-950/20 border-green-900/30'}`}>
                {msg.text}
              </div>
            )}

            <button 
              onClick={handleStake}
              disabled={loading || user.kycStatus !== KycStatus.VERIFIED}
              className="w-full bg-gold-500 text-black font-black py-4 rounded-xl hover:bg-gold-400 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-xl active:scale-95 uppercase text-xs tracking-widest"
            >
              {loading ? 'Processando Contrato...' : 'Confirmar Alocação de Ativos'}
            </button>
          </div>
        </div>

        {/* Active Stakes */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-tight">
            <Timer className="text-gold-500" /> Contratos Vigentes
          </h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
            {user.staking.filter(s => s.active).length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center opacity-30 grayscale">
                 <Lock size={32} className="mb-2" />
                 <p className="text-zinc-500 text-[10px] font-black uppercase">Nenhuma alocação detectada</p>
              </div>
            ) : (
              user.staking.filter(s => s.active).map(s => (
                <div key={s.id} className="bg-dark-950 border border-dark-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                     <span className="text-gold-500 font-mono font-black">{s.amount.toLocaleString()} {CRYPTO_SYMBOL}</span>
                     <span className="text-[10px] font-black text-zinc-500 bg-dark-800 px-2 py-1 rounded border border-zinc-700 uppercase">
                       {s.durationHours}H TERM
                     </span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                    <span>Reward: +{s.potentialReward.toFixed(3)}</span>
                    <span>Maturidade: {new Date(s.startDate + s.durationHours * 3600000).toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="w-full bg-dark-800 h-1 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="bg-gold-500 h-full transition-all duration-1000" 
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
