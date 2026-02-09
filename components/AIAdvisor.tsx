
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
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const askAI = async (customPrompt?: string) => {
    const textToSubmit = customPrompt || prompt;
    if (!textToSubmit.trim() || !user || !market) return;

    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: textToSubmit }]);
    setPrompt('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: textToSubmit,
        config: {
          systemInstruction: `Você é o NuAdvisor da BinaryMind. Um assistente amigável, inteligente e direto. Ajude ${user.name} com seus investimentos de ${user.balanceCrypto} MDC. Mercado: ${CURRENCY_SYMBOL}${market.currentPrice}.`,
        },
      });
      setMessages(prev => [...prev, { role: 'ai', content: response.text || 'Sem resposta.' }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Erro no servidor.' }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-lg mx-auto h-[calc(100vh-200px)] flex flex-col space-y-4 animate-in fade-in">
      <div className="bg-nuPurple p-6 rounded-[2rem] text-white flex items-center justify-between shadow-xl">
         <div className="flex items-center gap-3">
            <BrainCircuit size={32} />
            <div>
               <h2 className="font-black italic text-lg">NuAdvisor</h2>
               <p className="text-[10px] font-bold opacity-70">INTELIGÊNCIA BINARYMIND</p>
            </div>
         </div>
      </div>

      <div ref={scrollRef} className="flex-1 bg-[#111111] border border-[#1c1c1c] rounded-[2rem] p-6 overflow-y-auto space-y-4 scrollbar-hide">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${m.role === 'user' ? 'bg-nuPurple text-white' : 'bg-[#1c1c1c] text-white'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <Loader2 className="animate-spin text-nuPurple" />}
      </div>

      <div className="relative">
        <input type="text" value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && askAI()} placeholder="Mande uma mensagem..." className="w-full bg-[#111111] border border-[#1c1c1c] rounded-full p-5 text-white outline-none focus:border-nuPurple" />
        <button onClick={() => askAI()} className="absolute right-4 top-4 text-nuPurple"><Send size={24} /></button>
      </div>
    </div>
  );
};

export default AIAdvisor;
