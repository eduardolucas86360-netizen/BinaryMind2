
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
    const allUsers = JSON.parse(localStorage.getItem(DB_KEY) || '[]');
    localStorage.setItem(DB_KEY, JSON.stringify(
      allUsers.map((u: User) => u.id === user.id ? updatedUser : u)
    ));
    window.dispatchEvent(new Event('storage_update'));
  };

  const handleKycSubmit = async () => {
    if (!kycName.trim() || !kycDoc.trim()) {
      alert("Por favor, preencha todos os campos para validação.");
      return;
    }
    setKycLoading(true);
    try {
      await submitKyc(user.id, { fullName: kycName, docId: kycDoc });
      alert("Documentação enviada com sucesso. Aguarde a análise.");
      refreshUser();
    } catch (e: any) {
      alert("Erro ao enviar documentos: " + e.message);
    } finally {
      setKycLoading(false);
    }
  };

  const KycBadge = ({ status }: { status: KycStatus }) => {
    switch(status) {
      case KycStatus.VERIFIED: return <span className="flex items-center gap-1 text-green-500 font-bold text-xs"><CheckCircle size={14}/> Verificado</span>;
      case KycStatus.PENDING: return <span className="flex items-center gap-1 text-yellow-500 font-bold text-xs"><Clock size={14}/> Em análise</span>;
      default: return <span className="flex items-center gap-1 text-red-500 font-bold text-xs"><XCircle size={14}/> Não identificado</span>;
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-in fade-in duration-500 pb-24">
      <div className="flex border-b border-[#1c1c1c] overflow-x-auto scrollbar-hide">
        <button onClick={() => setActiveTab('prefs')} className={`px-6 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === 'prefs' ? 'border-nuPurple text-nuPurple' : 'border-transparent text-gray-500'}`}>Preferências</button>
        <button onClick={() => setActiveTab('kyc')} className={`px-6 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === 'kyc' ? 'border-nuPurple text-nuPurple' : 'border-transparent text-gray-500'}`}>Segurança & KYC</button>
      </div>

      {activeTab === 'prefs' && (
        <div className="space-y-6">
           <div className="bg-[#111111] border border-[#1c1c1c] rounded-3xl p-6 shadow-lg">
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2"><Monitor size={16} className="text-nuPurple"/> Interface</h3>
              <div className="grid grid-cols-2 gap-3">
                 <button 
                  onClick={() => updateSettings('theme', 'dark')}
                  className={`p-5 rounded-2xl border flex flex-col items-center gap-3 transition-all ${user.settings.theme === 'dark' ? 'bg-nuPurple/10 border-nuPurple text-nuPurple' : 'bg-black border-[#1c1c1c] text-gray-500'}`}
                 >
                   <Moon size={20} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Escuro</span>
                 </button>
                 <button 
                  onClick={() => updateSettings('theme', 'light')}
                  className={`p-5 rounded-2xl border flex flex-col items-center gap-3 transition-all ${user.settings.theme === 'light' ? 'bg-white text-black border-white' : 'bg-black border-[#1c1c1c] text-gray-500'}`}
                 >
                   <Sun size={20} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Claro</span>
                 </button>
              </div>
           </div>

           <div className="bg-[#111111] border border-[#1c1c1c] rounded-3xl p-6 space-y-6 shadow-lg">
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-2">Acessibilidade</h3>
              
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-black rounded-2xl border border-[#1c1c1c] group-hover:border-nuPurple/30 transition-all"><Eye size={20} className="text-gray-400"/></div>
                   <div>
                     <p className="text-sm font-bold text-white">Alto Contraste</p>
                     <p className="text-[10px] text-gray-500">Aumentar visibilidade de elementos.</p>
                   </div>
                </div>
                <button 
                  onClick={() => updateSettings('highContrast', !user.settings.highContrast)}
                  className={`w-14 h-7 rounded-full transition-all relative ${user.settings.highContrast ? 'bg-nuPurple' : 'bg-[#1c1c1c]'}`}
                >
                  <div className={`absolute top-1.5 w-4 h-4 rounded-full bg-white transition-all ${user.settings.highContrast ? 'left-8 shadow-lg' : 'left-2'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-black rounded-2xl border border-[#1c1c1c] group-hover:border-nuPurple/30 transition-all"><Type size={20} className="text-gray-400"/></div>
                   <div>
                     <p className="text-sm font-bold text-white">Texto Ampliado</p>
                     <p className="text-[10px] text-gray-500">Melhorar leitura de dados técnicos.</p>
                   </div>
                </div>
                <button 
                  onClick={() => updateSettings('largeText', !user.settings.largeText)}
                  className={`w-14 h-7 rounded-full transition-all relative ${user.settings.largeText ? 'bg-nuPurple' : 'bg-[#1c1c1c]'}`}
                >
                  <div className={`absolute top-1.5 w-4 h-4 rounded-full bg-white transition-all ${user.settings.largeText ? 'left-8 shadow-lg' : 'left-2'}`}></div>
                </button>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'kyc' && (
        <div className="bg-[#111111] border border-[#1c1c1c] rounded-3xl p-6 shadow-xl space-y-8">
           <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Protocolo KYC</h3>
              <KycBadge status={user.kycStatus} />
           </div>
           
           {user.kycStatus === KycStatus.UNVERIFIED ? (
             <div className="space-y-5 animate-in fade-in slide-in-from-top-2">
               <div className="p-4 bg-nuPurple/5 border border-nuPurple/20 rounded-2xl text-nuPurple text-xs leading-relaxed italic">
                 A identificação é obrigatória para desbloquear limites operacionais elevados e ferramentas de staking avançadas.
               </div>
               <div className="space-y-4">
                 <input 
                   type="text" 
                   placeholder="Nome completo conforme ID" 
                   value={kycName}
                   onChange={e => setKycName(e.target.value)}
                   className="w-full bg-black border border-[#1c1c1c] p-4 rounded-2xl text-white font-bold focus:border-nuPurple outline-none transition-all placeholder:text-gray-600 text-sm" 
                 />
                 <input 
                   type="text" 
                   placeholder="Documento (CPF ou Passaporte)" 
                   value={kycDoc}
                   onChange={e => setKycDoc(e.target.value)}
                   className="w-full bg-black border border-[#1c1c1c] p-4 rounded-2xl text-white font-bold focus:border-nuPurple outline-none transition-all placeholder:text-gray-600 text-sm" 
                 />
               </div>
               <button 
                 onClick={handleKycSubmit}
                 disabled={kycLoading}
                 className="w-full bg-nuPurple hover:bg-nuPurple-hover text-white font-black py-5 rounded-full flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 disabled:opacity-50"
               >
                 {kycLoading ? <Loader2 className="animate-spin" size={20}/> : 'Enviar para verificação'}
               </button>
             </div>
           ) : user.kycStatus === KycStatus.PENDING ? (
             <div className="p-8 bg-yellow-500/5 border border-yellow-500/20 rounded-3xl text-yellow-500 flex flex-col items-center gap-4 text-center">
               <Clock size={40} className="animate-pulse" />
               <div className="space-y-2">
                 <p className="font-black uppercase tracking-widest">Análise em andamento</p>
                 <p className="text-xs opacity-70">Nossa equipe está validando seus documentos. Isso pode levar até 24 horas.</p>
               </div>
             </div>
           ) : (
             <div className="p-8 bg-green-500/5 border border-green-500/20 rounded-3xl text-green-500 flex flex-col items-center gap-4 text-center">
               <CheckCircle size={40} />
               <div className="space-y-2">
                 <p className="font-black uppercase tracking-widest">Verificação Concluída</p>
                 <p className="text-xs opacity-70">Sua conta está totalmente operacional com limites de elite.</p>
               </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;
