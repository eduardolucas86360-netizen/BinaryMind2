
import React, { useEffect, useState, useContext } from 'react';
import { getRankings } from '../services/api';
import { AppContext } from '../App';
import { Trophy, Medal, TrendingUp, Wallet, Loader2 } from 'lucide-react';
import { CURRENCY_SYMBOL, CRYPTO_SYMBOL } from '../constants';

const RankingPanel: React.FC = () => {
  const { user, privacyMode } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState<'balance' | 'volume'>('balance');
  const [loading, setLoading] = useState(true);
  const [rankings, setRankings] = useState<{
    balanceRanking: any[];
    volumeRanking: any[];
  }>({ balanceRanking: [], volumeRanking: [] });

  const loadRankings = async () => {
    setLoading(true);
    try {
      const data = await getRankings();
      setRankings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRankings();
  }, []);

  const currentList = activeTab === 'balance' ? rankings.balanceRanking : rankings.volumeRanking;

  const RankIcon = ({ pos }: { pos: number }) => {
    if (pos === 1) return <Trophy className="text-gold-500" size={20} />;
    if (pos === 2) return <Medal className="text-zinc-300" size={20} />;
    if (pos === 3) return <Medal className="text-amber-600" size={20} />;
    return <span className="text-xs font-bold text-zinc-500 w-5 text-center">{pos}</span>;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="p-3 bg-gold-500/10 rounded-2xl mb-4">
          <Trophy className="text-gold-500 w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-white">Ranking de Elite</h2>
        <p className="text-zinc-400 text-sm">Os maiores investidores e traders da BinaryMind</p>
      </div>

      <div className="flex bg-dark-900 p-1 rounded-xl border border-dark-800 mb-6">
        <button 
          onClick={() => setActiveTab('balance')} 
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'balance' ? 'bg-dark-800 text-gold-500 shadow-sm' : 'text-zinc-500 hover:text-white'}`}
        >
          <Wallet size={16} /> Maiores Saldos
        </button>
        <button 
          onClick={() => setActiveTab('volume')} 
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'volume' ? 'bg-dark-800 text-gold-500 shadow-sm' : 'text-zinc-500 hover:text-white'}`}
        >
          <TrendingUp size={16} /> Volume de Trade
        </button>
      </div>

      <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4 text-zinc-500">
            <Loader2 className="animate-spin text-gold-500" />
            <span className="text-xs uppercase tracking-widest">Sincronizando Ledger...</span>
          </div>
        ) : (
          <div className="divide-y divide-dark-800">
            {currentList.length === 0 ? (
              <p className="p-10 text-center text-zinc-500">Nenhum dado disponível.</p>
            ) : (
              currentList.map((item) => (
                <div 
                  key={item.userId} 
                  className={`flex items-center justify-between p-4 hover:bg-dark-800/50 transition-colors ${item.userId === user?.id ? 'bg-gold-500/5 border-l-4 border-gold-500' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <RankIcon pos={item.position} />
                    <div>
                      <p className="font-bold text-white flex items-center gap-2">
                        {item.displayName}
                        {item.userId === user?.id && <span className="text-[10px] bg-gold-500 text-black px-1.5 rounded font-black uppercase">VOCÊ</span>}
                      </p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">Membro Verificado</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-zinc-300">
                      {privacyMode && item.userId !== user?.id ? '••••••' : (
                        activeTab === 'balance' 
                          ? `${item.value.toFixed(2)} ${CRYPTO_SYMBOL}` 
                          : `${CURRENCY_SYMBOL} ${item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      )}
                    </p>
                    <p className="text-[10px] text-zinc-600 uppercase">Performance Total</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="bg-dark-900/30 border border-dark-800/50 p-4 rounded-xl">
        <p className="text-xs text-zinc-500 text-center italic">
          Os dados de volume são baseados no histórico total de transações desde a abertura da conta. 
          O ranking é atualizado em tempo real a cada validação de bloco.
        </p>
      </div>
    </div>
  );
};

export default RankingPanel;
