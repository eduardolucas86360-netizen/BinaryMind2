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
    
    // Key corrected to match TBL_USERS in api.ts
    const DB_KEY = 'binarymind_ledger_v1';
    localStorage.setItem(DB_KEY, JSON.stringify(
      JSON.parse(localStorage.getItem(DB_KEY) || '[]').map((u: User) => u.id === user.id ? updatedUser : u)
    ));
  };

  const handleKycSubmit = async () => {
    if (!kycName || !kycDoc) {
      alert("Todos os campos são obrigatórios para validação.");
      return;
    }
    setKycLoading(true);
    try {
      await submitKyc(user.id, { fullName: kycName, docId: kycDoc });
      alert("Documentação enviada para análise de compliance.");
      refreshUser();
    } catch (e: any) {
      alert("Erro na submissão: " + e.message);
    } finally {
      setKycLoading(false);
    }
  };

  const KycBadge = ({ status }: { status: KycStatus }) => {
    switch(status) {
      case KycStatus.VERIFIED: return <span className="flex items-center gap-1 text-green-500"><CheckCircle size={16}/> Verificado</span>;
      case KycStatus.PENDING: return <span className="flex items-center gap-1 text-yellow-500"><Clock size={16}/> Em Análise</span>;
      default: return <span className="flex items-center gap-1 text-red-500"><XCircle size={16}/> Não Verificado</span>;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex border-b border-dark-800">
        <button onClick={() => setActiveTab('prefs')} className={`px-4 py-2 border-b-2 ${activeTab === 'prefs' ? 'border-gold-500 text-gold-500' : 'border-transparent text-zinc-500'}`}>Preferências</button>
        <button onClick={() => setActiveTab('kyc')} className={`px-4 py-2 border-b-2 ${activeTab === 'kyc' ? 'border-gold-500 text-gold-500' : 'border-transparent text-zinc-500'}`}>Segurança & KYC</button>
      </div>

      {activeTab === 'prefs' && (
        <div className="space-y-6">
           <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Monitor size={18}/> Tema da Interface</h3>
              <div className="grid grid-cols-3 gap-3">
                 <button 
                  onClick={() => updateSettings('theme', 'binary')}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 ${user.settings.theme === 'binary' ? 'bg-gold-500/10 border-gold-500 text-gold-500' : 'bg-dark-950 border-dark-800 text-zinc-400'}`}
                 >
                   <div className="w-4 h-4 rounded-full bg-zinc-900 border border-gold-500"></div>
                   Binary
                 </button>
                 <button 
                  onClick={() => updateSettings('theme', 'dark')}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 ${user.settings.theme === 'dark' ? 'bg-zinc-800 border-white text-white' : 'bg-dark-950 border-dark-800 text-zinc-400'}`}
                 >
                   <Moon size={16} />
                   Escuro
                 </button>
                 <button 
                  onClick={() => updateSettings('theme', 'light')}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 ${user.settings.theme === 'light' ? 'bg-white text-black border-zinc-200' : 'bg-dark-950 border-dark-800 text-zinc-400'}`}
                 >
                   <Sun size={16} />
                   Claro
                 </button>
              </div>
           </div>

           <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-white mb-2">Acessibilidade</h3>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-dark-800 rounded-lg"><Eye size={18} className="text-zinc-400"/></div>
                   <div>
                     <p className="font-medium text-white">Modo Alto Contraste</p>
                     <p className="text-xs text-zinc-500">Melhora a legibilidade para deficientes visuais</p>
                   </div>
                </div>
                <button 
                  onClick={() => updateSettings('highContrast', !user.settings.highContrast)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${user.settings.highContrast ? 'bg-gold-500' : 'bg-dark-800'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${user.settings.highContrast ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-dark-800 rounded-lg"><Type size={18} className="text-zinc-400"/></div>
                   <div>
                     <p className="font-medium text-white">Texto Maior</p>
                     <p className="text-xs text-zinc-500">Aumenta o tamanho da fonte globalmente</p>
                   </div>
                </div>
                <button 
                  onClick={() => updateSettings('largeText', !user.settings.largeText)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${user.settings.largeText ? 'bg-gold-500' : 'bg-dark-800'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${user.settings.largeText ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'kyc' && (
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
           <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-bold text-white text-lg">Know Your Customer (KYC)</h3>
                <p className="text-zinc-400 text-sm">Status Atual: <KycBadge status={user.kycStatus} /></p>
              </div>
           </div>
           
           {user.kycStatus === KycStatus.UNVERIFIED ? (
             <div className="space-y-4">
               <p className="text-sm text-zinc-300">
                 Para cumprir com as regulações vigentes, é necessário fornecer identificação válida para desbloquear limites operacionais de DeFi.
               </p>
               <input 
                 type="text" 
                 placeholder="Nome Completo (conforme documento)" 
                 value={kycName}
                 onChange={e => setKycName(e.target.value)}
                 className="w-full bg-dark-950 border border-dark-800 p-3 rounded-lg text-white focus:border-gold-500 outline-none" 
               />
               <input 
                 type="text" 
                 placeholder="Número do Documento (CPF/RG/Passaporte)" 
                 value={kycDoc}
                 onChange={e => setKycDoc(e.target.value)}
                 className="w-full bg-dark-950 border border-dark-800 p-3 rounded-lg text-white focus:border-gold-500 outline-none" 
               />
               <button 
                 onClick={handleKycSubmit}
                 disabled={kycLoading}
                 className="w-full bg-gold-500 text-black font-bold py-3 rounded-xl hover:bg-gold-400 flex items-center justify-center gap-2 transition-colors"
               >
                 {kycLoading ? <Loader2 className="animate-spin"/> : 'Enviar para Análise'}
               </button>
             </div>
           ) : user.kycStatus === KycStatus.PENDING ? (
             <div className="p-4 bg-yellow-900/10 border border-yellow-900/30 rounded-lg text-yellow-400 text-sm flex items-center gap-3">
               <Clock size={20} />
               Documentação recebida. Aguardando validação pela equipe de compliance.
             </div>
           ) : (
             <div className="p-4 bg-green-900/10 border border-green-900/30 rounded-lg text-green-400 text-sm flex items-center gap-3">
               <CheckCircle size={20} />
               Conta verificada. Você possui acesso irrestrito aos produtos de investimento.
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;