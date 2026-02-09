
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../App';
import { GoogleGenAI } from '@google/genai';
import { Sparkles, Send, BrainCircuit, Loader2, TrendingDown, ShieldCheck } from 'lucide-react';
import { CURRENCY_SYMBOL, CRYPTO_SYMBOL } from '../constants';

const AIAdvisor: React.FC = () => {
  const { user, market } = useContext(AppContext);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string}[]>([]);
  const [loading, setLoading] = useState(false);

  const askAI = async (customPrompt?: string) => {
    const textToSubmit = customPrompt || prompt;
    if (!textToSubmit.trim() || !user || !market) return;

    setLoading(true);
    const userMsg = { role: 'user' as const, content: textToSubmit };
    setMessages(prev => [...prev, userMsg]);
    setPrompt('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-lite-preview-02-05',
        contents: textToSubmit,
        config: {
          systemInstruction: `Você é o BinaryMind AI, um consultor financeiro de elite para um banco privado ultra-exclusivo. 
          Contexto do Usuário: Nome: ${user.name}, Saldo Fiat: ${CURRENCY_SYMBOL}${user.balanceFiat}, Saldo Crypto: ${user.balanceCrypto} ${CRYPTO_SYMBOL}.
          Contexto do Mercado: O preço atual do ${CRYPTO_SYMBOL} é ${CURRENCY_SYMBOL}${market.currentPrice}. A tendência é BEARISH (o mercado cai mais do que sobe).
          Estilo: Seja sofisticado, direto, técnico e use termos de finanças e tecnologia. Não use emojis em excesso. Fale em Português do Brasil.`,
        },
      });

      const aiMsg = { role: 'ai' as const, content: response.text || 'Lamento, ocorreu uma interrupção na conexão neural.' };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', content: 'Erro ao acessar o núcleo cognitivo. Verifique sua conexão de rede.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col space-y-6 animate-in fade-in duration-700">
      <div className="bg-gradient-to-r from-zinc-900 to-black border border-zinc-800 p-6 rounded-[2rem] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gold-500/20 rounded-2xl flex items-center justify-center text-gold-500 border border-gold-500/30">
            <BrainCircuit size={28} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white italic tracking-tighter">COGNITIVE ADVISOR</h2>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Powered by Gemini 2.0</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
          <ShieldCheck size={14} className="text-green-500" />
          <span className="text-[10px] font-black text-green-500">ENCRIPTADO</span>
        </div>
      </div>

      <div className="flex-1 bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 overflow-y-auto space-y-6 scrollbar-hide">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-40">
            <Sparkles size={48} className="text-gold-500" />
            <div className="max-w-xs">
              <p className="text-sm font-bold text-white mb-2 uppercase">Análise de Portfólio</p>
              <p className="text-xs text-zinc-500">O Advisor analisará seu patrimônio e as condições de mercado para sugerir as melhores ordens de trade.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <button onClick={() => askAI("Como devo me proteger nesta queda de mercado?")} className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-full text-[10px] font-black hover:border-gold-500 transition-all">ESTRATÉGIA BEARISH</button>
              <button onClick={() => askAI("Analise meu saldo atual.")} className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-full text-[10px] font-black hover:border-gold-500 transition-all">STATUS DE CONTA</button>
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
            <div className={`max-w-[80%] p-6 rounded-[2rem] text-sm leading-relaxed ${
              m.role === 'user' 
              ? 'bg-gold-500 text-black font-bold shadow-xl shadow-gold-500/10 rounded-tr-none' 
              : 'bg-zinc-800/80 text-zinc-100 border border-zinc-700 rounded-tl-none font-medium'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-zinc-800/80 p-6 rounded-[2rem] rounded-tl-none border border-zinc-700">
              <Loader2 className="animate-spin text-gold-500" />
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <input 
          type="text" 
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && askAI()}
          placeholder="Consultar BinaryMind AI..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-white font-bold outline-none focus:border-gold-500 pr-16 transition-all"
        />
        <button 
          onClick={() => askAI()}
          disabled={loading}
          className="absolute right-4 top-4 w-12 h-12 bg-gold-500 text-black rounded-2xl flex items-center justify-center hover:bg-gold-400 transition-all shadow-lg"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default AIAdvisor;
