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
      setMsg({ type: 'error', text: 'Você deve completar o KYC para fazer staking.' });
      return;
    }

    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setMsg({ type: 'error', text: 'Quantidade inválida.' });
      return;
    }

    setLoading(true);
    try {
      await startStaking(user.id, val, period);
      setMsg({ type: 'success', text: `Staking realizado: ${val} ${CRYPTO_SYMBOL}` });
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
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white">Ganhe Renda Passiva</h2>
        <p className="text-zinc-400">Trave suas {CRYPTO_SYMBOL} para ganhar recompensas de alto rendimento.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Create Stake Form */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Lock className="text-gold-500" /> Novo Staking
          </h3>
          
          {user.kycStatus !== KycStatus.VERIFIED && (
            <div className="bg-red-900/20 border border-red-800 p-3 rounded-lg flex items-center gap-3 text-red-200 text-sm mb-4">
              <ShieldAlert /> Verificação KYC Necessária
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400">Quantidade para travar</label>
              <div className="relative">
                 <input 
                  type="number" 
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-dark-950 border border-dark-800 rounded-lg p-3 text-white mt-1 font-mono focus:border-gold-500 outline-none"
                  placeholder="0.00"
                  disabled={loading}
                 />
                 <span className="absolute right-3 top-4 text-zinc-500 text-sm">{CRYPTO_SYMBOL}</span>
              </div>
            </div>

            <div>
              <label className="text-sm text-zinc-400">Duração do Bloqueio</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {[24, 72, 168].map(h => (
                  <button
                    key={h}
                    onClick={() => setPeriod(h)}
                    className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                      period === h 
                      ? 'bg-gold-500 text-black border-gold-500' 
                      : 'bg-dark-950 border-dark-800 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    {h < 48 ? '24 Horas' : h < 100 ? '3 Dias' : '7 Dias'}
                    <div className="text-[10px] opacity-70">Rendimento {getRewardText(h)}</div>
                  </button>
                ))}
              </div>
            </div>

            {msg.text && (
              <div className={`text-sm p-2 rounded ${msg.type === 'error' ? 'text-red-400 bg-red-900/10' : 'text-green-400 bg-green-900/10'}`}>
                {msg.text}
              </div>
            )}

            <button 
              onClick={handleStake}
              disabled={loading || user.kycStatus !== KycStatus.VERIFIED}
              className="w-full bg-gold-500 text-black font-bold py-3 rounded-xl hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processando...' : 'Confirmar Staking'}
            </button>
          </div>
        </div>

        {/* Active Stakes */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Timer className="text-gold-500" /> Posições Ativas
          </h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {user.staking.filter(s => s.active).length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-8">Nenhuma posição ativa.</p>
            ) : (
              user.staking.filter(s => s.active).map(s => (
                <div key={s.id} className="bg-dark-950 border border-dark-800 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                     <span className="text-gold-500 font-mono font-bold">{s.amount} {CRYPTO_SYMBOL}</span>
                     <span className="text-xs text-zinc-500 bg-dark-800 px-2 py-1 rounded">
                       Travado por {s.durationHours}h
                     </span>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>Recompensa: +{s.potentialReward.toFixed(3)}</span>
                    <span>Termina em: {new Date(s.startDate + s.durationHours * 3600000).toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="w-full bg-dark-800 h-1.5 rounded-full mt-3 overflow-hidden">
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