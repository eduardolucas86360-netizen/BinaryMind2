
import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { User, KycStatus } from '../types';
import { CheckCircle, Clock, XCircle, Monitor, Sun, Moon, Type, Eye, Loader2 } from 'lucide-react';
import { submitKyc } from '../services/api';

const SettingsPanel: React.FC = () => {
  const { user, setUser, refreshUser } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('prefs');

  // KYC State
  const [kycName, setKycName] = useState('');
  const [kycDoc, setKycDoc] = useState('');
  const [kycLoading, setKycLoading] = useState(false);

  if (!user) return null;

  const updateSettings = (key: keyof typeof user.settings, val: any) => {
    const updatedUser = { ...user, settings: { ...user.settings, [key]: val } };
    setUser(updatedUser);
    
    const DB_KEY = 'binarymind_ledger_v1';
    localStorage.setItem(DB_KEY, JSON.stringify(
      JSON.parse(localStorage.getItem(DB_KEY) || '[]').map((u: User) => u.id === user.id ? updatedUser : u)
    ));
  };

  const handleKycSubmit = async () => {
    if (!kycName.trim() || !kycDoc.trim()) {
      alert("Falha na submissão: Dados insuficientes. Preencha nome e documento para análise de compliance.");
      return;
    }
    setKycLoading(true);
    try {
      await submitKyc(user.id, { fullName: kycName, docId: kycDoc });
      alert("Documentação enviada para análise de conformidade financeira.");
      refreshUser();
    } catch (e: any) {
      alert("Erro na submissão neural: " + e.message);
    } finally {
      setKycLoading(false);
    }
  };

  const KycBadge = ({ status }: { status: KycStatus }) => {
    switch(status) {
      case KycStatus.VERIFIED: return <span className="flex items-center gap-1 text-green-500 font-bold text-xs"><CheckCircle size={14}/> Verificado</span>;
      case KycStatus.PENDING: return <span className="flex items-center gap-1 text-yellow-500 font-bold text-xs"><Clock size={14}/> Em Análise de Risco</span>;
      default: return <span className="flex items-center gap-1 text-red-500 font-bold text-xs"><XCircle size={14}/> Não Identificado</span>;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex border-b border-dark-800">
        <button onClick={() => setActiveTab('prefs')} className={`px-6 py-3 border-b-2 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'prefs' ? 'border-gold-500 text-gold-500' : 'border-transparent text-zinc-500'}`}>Preferências</button>
        <button onClick={() => setActiveTab('kyc')} className={`px-6 py-3 border-b-2 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'kyc' ? 'border-gold-500 text-gold-500' : 'border-transparent text-zinc-500'}`}>Compliance & KYC</button>
      </div>

      {activeTab === 'prefs' && (
        <div className="space-y-6">
           <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2"><Monitor size={16}/> Visualização</h3>
              <div className="grid grid-cols-3 gap-3">
                 <button 
                  onClick={() => updateSettings('theme', 'binary')}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${user.settings.theme === 'binary' ? 'bg-gold-500/10 border-gold-500 text-gold-500' : 'bg-dark-950 border-dark-800 text-zinc-500'}`}
                 >
                   <div className="w-3 h-3 rounded-full bg-zinc-900 border border-gold-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                   <span className="text-[10px] font-bold">Binary</span>
                 </button>
                 <button 
                  onClick={() => updateSettings('theme', 'dark')}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${user.settings.theme === 'dark' ? 'bg-zinc-800 border-zinc-400 text-white' : 'bg-dark-950 border-dark-800 text-zinc-500'}`}
                 >
                   <Moon size={14} />
                   <span className="text-[10px] font-bold">Escuro</span>
                 </button>
                 <button 
                  onClick={() => updateSettings('theme', 'light')}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${user.settings.theme === 'light' ? 'bg-white text-black border-zinc-200' : 'bg-dark-950 border-dark-800 text-zinc-500'}`}
                 >
                   <Sun size={14} />
                   <span className="text-[10px] font-bold">Claro</span>
                 </button>
              </div>
           </div>

           <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-2">Acessibilidade Neural</h3>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-dark-800 rounded-lg"><Eye size={18} className="text-zinc-400"/></div>
                   <div>
                     <p className="text-sm font-bold text-white">Alto Contraste</p>
                     <p className="text-[10px] text-zinc-500">Otimizar legibilidade para análise técnica rápida.</p>
                   </div>
                </div>
                <button 
                  onClick={() => updateSettings('highContrast', !user.settings.highContrast)}
                  className={`w-12 h-6 rounded-full transition-all relative ${user.settings.highContrast ? 'bg-gold-500' : 'bg-dark-800'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${user.settings.highContrast ? 'left-7 shadow-lg' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-dark-800 rounded-lg"><Type size={18} className="text-zinc-400"/></div>
                   <div>
                     <p className="text-sm font-bold text-white">Escala de Fonte</p>
                     <p className="text-[10px] text-zinc-500">Expandir dimensões de texto globalmente.</p>
                   </div>
                </div>
                <button 
                  onClick={() => updateSettings('largeText', !user.settings.largeText)}
                  className={`w-12 h-6 rounded-full transition-all relative ${user.settings.largeText ? 'bg-gold-500' : 'bg-dark-800'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${user.settings.largeText ? 'left-7 shadow-lg' : 'left-1'}`}></div>
                </button>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'kyc' && (
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-xl space-y-6">
           <div>
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-2">Protocolo KYC (Know Your Customer)</h3>
              <div className="flex items-center gap-2">
                 <span className="text-[10px] text-zinc-500 font-bold">STATUS ATUAL:</span>
                 <KycBadge status={user.kycStatus} />
              </div>
           </div>
           
           {user.kycStatus === KycStatus.UNVERIFIED ? (
             <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
               <p className="text-xs text-zinc-400 leading-relaxed italic">
                 Para conformidade com regulações internacionais de ativos digitais, é mandatória a identificação para desbloquear limites operacionais de alta liquidez.
               </p>
               <input 
                 type="text" 
                 placeholder="Nome Completo (Conforme Identificação Civil)" 
                 value={kycName}
                 onChange={e => setKycName(e.target.value)}
                 className="w-full bg-dark-950 border border-dark-800 p-4 rounded-xl text-white font-bold focus:border-gold-500 outline-none transition-all placeholder:text-zinc-700 text-sm" 
               />
               <input 
                 type="text" 
                 placeholder="Número de Documento Oficial (CPF/RG/Passaporte)" 
                 value={kycDoc}
                 onChange={e => setKycDoc(e.target.value)}
                 className="w-full bg-dark-950 border border-dark-800 p-4 rounded-xl text-white font-bold focus:border-gold-500 outline-none transition-all placeholder:text-zinc-700 text-sm" 
               />
               <button 
                 onClick={handleKycSubmit}
                 disabled={kycLoading}
                 className="w-full bg-gold-500 text-black font-black py-4 rounded-xl hover:bg-gold-400 flex items-center justify-center gap-2 transition-all shadow-lg text-xs uppercase tracking-widest active:scale-95"
               >
                 {kycLoading ? <Loader2 className="animate-spin" size={18}/> : 'Iniciar Validação de Identidade'}
               </button>
             </div>
           ) : user.kycStatus === KycStatus.PENDING ? (
             <div className="p-5 bg-yellow-950/20 border border-yellow-900/40 rounded-xl text-yellow-500 text-xs font-bold flex items-center gap-4">
               <Clock size={24} className="animate-pulse" />
               <div className="space-y-1">
                 <p className="uppercase tracking-tighter">Documentação sob Análise</p>
                 <p className="text-[10px] opacity-70 font-normal">Nossa equipe de compliance está validando seus dados. Tempo estimado: 24-48h.</p>
               </div>
             </div>
           ) : (
             <div className="p-5 bg-green-950/20 border border-green-900/40 rounded-xl text-green-500 text-xs font-bold flex items-center gap-4">
               <CheckCircle size={24} />
               <div className="space-y-1">
                 <p className="uppercase tracking-tighter">Conformidade Aprovada</p>
                 <p className="text-[10px] opacity-70 font-normal">Acesso irrestrito aos serviços de custódia e staking de elite.</p>
               </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;
