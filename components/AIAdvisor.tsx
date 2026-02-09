
import React, { useState, useContext, useEffect, useRef } from 'react';
import { AppContext } from '../App';
import { GoogleGenAI } from '@google/genai';
import { Sparkles, Send, BrainCircuit, Loader2, ShieldCheck } from 'lucide-react';
import { CURRENCY_SYMBOL, CRYPTO_SYMBOL } from '../constants';

const AIAdvisor: React.FC = () => {
  const { user, market } = useContext(AppContext);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

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
        model: 'gemini-3-flash-preview',
        contents: textToSubmit,
        config: {
          systemInstruction: `Você é o BinaryMind AI, um consultor financeiro de elite para um banco privado ultra-exclusivo. 
          Contexto do Usuário: Nome: ${user.name}, Saldo Fiat: ${CURRENCY_SYMBOL}${user.balanceFiat.toLocaleString()}, Saldo Crypto: ${user.balanceCrypto} ${CRYPTO_SYMBOL}.
          Contexto do Mercado: O preço atual do ${CRYPTO_SYMBOL} é ${CURRENCY_SYMBOL}${market.currentPrice.toLocaleString()}. A tendência atual é predominantemente BEARISH (o mercado cai agressivamente).
          Estilo: Seja sofisticado, técnico, direto e use vocabulário de alta finanças. Fale em Português do Brasil.`,
        },
      });

      const aiMsg = { role: 'ai' as const, content: response.text || 'O núcleo cognitivo não retornou uma resposta válida.' };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', content: 'Erro ao acessar o núcleo cognitivo de elite. Verifique sua conexão ou tente novamente mais tarde.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col space-y-6 animate-in fade-in duration-700">
      <div className="bg-gradient-to-r from-zinc-900 to-black border border-zinc-800 p-6 rounded-[2rem] flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gold-500/20 rounded-2xl flex items-center justify-center text-gold-500 border border-gold-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <BrainCircuit size={28} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white italic tracking-tighter">COGNITIVE ADVISOR</h2>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Quantum Engine: Gemini 3.0</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
          <ShieldCheck size={14} className="text-green-500" />
          <span className="text-[10px] font-black text-green-500">CANAL ENCRIPTADO</span>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 overflow-y-auto space-y-6 scrollbar-hide shadow-inner"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-40">
            <Sparkles size={48} className="text-gold-500 animate-pulse" />
            <div className="max-w-xs">
              <p className="text-sm font-bold text-white mb-2 uppercase tracking-widest">Protocolo de Consulta</p>
              <p className="text-xs text-zinc-500 font-medium">O Advisor analisará seu portfólio e as tendências Bearish para sugerir estratégias de mitigação de risco.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <button onClick={() => askAI("Analise o risco atual do meu portfólio MDC.")} className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-full text-[10px] font-black hover:border-gold-500 transition-all hover:text-white uppercase tracking-tighter">RISCO DE PORTFÓLIO</button>
              <button onClick={() => askAI("Como o mercado bearish afeta meu capital fiat?")} className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-full text-[10px] font-black hover:border-gold-500 transition-all hover:text-white uppercase tracking-tighter">IMPACTO BEARISH</button>
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[85%] p-6 rounded-[2rem] text-sm leading-relaxed ${
              m.role === 'user' 
              ? 'bg-gold-500 text-black font-bold shadow-xl shadow-gold-500/10 rounded-tr-none' 
              : 'bg-zinc-800/80 text-zinc-100 border border-zinc-700 rounded-tl-none font-medium shadow-lg'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800/80 p-6 rounded-[2rem] rounded-tl-none border border-zinc-700 shadow-lg">
              <Loader2 className="animate-spin text-gold-500" />
            </div>
          </div>
        )}
      </div>

      <div className="relative pb-4">
        <input 
          type="text" 
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && askAI()}
          placeholder="Consultar Inteligência Central..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-white font-bold outline-none focus:border-gold-500 pr-16 transition-all shadow-xl"
        />
        <button 
          onClick={() => askAI()}
          disabled={loading || !prompt.trim()}
          className="absolute right-4 top-4 w-12 h-12 bg-gold-500 text-black rounded-2xl flex items-center justify-center hover:bg-gold-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg active:scale-90"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default AIAdvisor;
