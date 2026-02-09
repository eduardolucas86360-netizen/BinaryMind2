
import React, { useEffect, useState, useContext } from 'react';
import { getRankings } from '../services/api';
import { AppContext } from '../App';
import { Trophy, Medal, Wallet, Loader2 } from 'lucide-react';
import { CURRENCY_SYMBOL, CRYPTO_SYMBOL } from '../constants';

const RankingPanel: React.FC = () => {
  const { user, privacyMode } = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  const [rankings, setRankings] = useState<any[]>([]);

  useEffect(() => {
    getRankings().then(data => {
      setRankings(data.balanceRanking);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-in fade-in">
      <h2 className="text-2xl font-black text-white px-2">Comunidade Elite</h2>
      
      <div className="bg-[#111111] rounded-3xl border border-[#1c1c1c] overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-nuPurple" /></div>
        ) : (
          <div className="divide-y divide-[#1c1c1c]">
            {rankings.map((item, i) => (
              <div key={i} className={`p-5 flex justify-between items-center ${item.userId === user?.id ? 'bg-nuPurple/5' : ''}`}>
                <div className="flex items-center gap-4">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${i < 3 ? 'bg-nuPurple text-white' : 'bg-gray-900 text-gray-500'}`}>{i + 1}</span>
                  <div>
                    <p className="font-bold text-white text-sm">{item.displayName}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Investidor</p>
                  </div>
                </div>
                <p className="font-mono font-black text-white">{privacyMode && item.userId !== user?.id ? '••••' : `${item.value.toFixed(2)} ${CRYPTO_SYMBOL}`}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RankingPanel;
