
import React, { useState, useContext } from 'react';
import { login, registerUser } from '../services/api';
import { AppContext } from '../App';
import { ArrowRight, Loader2, UserPlus } from 'lucide-react';
import { Logo } from './Logo';

const Login: React.FC = () => {
  const { refreshUser } = useContext(AppContext);
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isRegistering) {
        if (name.trim().length < 3) {
          throw new Error("Identificação insuficiente. O nome do titular deve possuir no mínimo 3 caracteres.");
        }
        await registerUser(name, email, password);
      } else {
        await login(email, password);
      }
      await refreshUser();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setName('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-gold-500/5 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/5 rounded-full blur-[100px]"></div>

      <div className="w-full max-w-md bg-dark-900/40 backdrop-blur-3xl border border-dark-800 rounded-[2.5rem] p-10 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] relative z-10 transition-all duration-300">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-5 bg-gold-500/10 rounded-3xl mb-6 border border-gold-500/20 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
            <Logo className="text-gold-500 w-12 h-12" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter italic">BINARY<span className="text-gold-500">MIND</span></h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-3 opacity-60">
            {isRegistering ? 'Estabelecer Nova Conexão' : 'Portal de Acesso Core Banking'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isRegistering && (
             <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Identificação do Titular</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-dark-950 border border-dark-800 text-white p-4 rounded-2xl mt-1 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30 outline-none transition-all font-bold placeholder:text-zinc-800"
                  placeholder="Nome Completo"
                  required
                />
             </div>
          )}

          <div>
             <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Credencial de Rede (E-mail)</label>
             <input 
               type="email" 
               value={email}
               onChange={e => setEmail(e.target.value)}
               className="w-full bg-dark-950 border border-dark-800 text-white p-4 rounded-2xl mt-1 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30 outline-none transition-all font-bold placeholder:text-zinc-800"
               placeholder="nome@servidor.com"
               required
             />
          </div>
          <div>
             <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Criptografia de Acesso (Senha)</label>
             <input 
               type="password" 
               value={password}
               onChange={e => setPassword(e.target.value)}
               className="w-full bg-dark-950 border border-dark-800 text-white p-4 rounded-2xl mt-1 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30 outline-none transition-all font-bold"
               required
             />
          </div>

          {error && (
            <div className="text-red-500 text-[10px] font-black uppercase text-center bg-red-950/20 border border-red-900/30 p-3 rounded-xl animate-in shake duration-300 tracking-tight leading-3">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gold-500 hover:bg-gold-400 text-black font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-gold-500/10 active:scale-95 text-xs uppercase tracking-widest"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <span>{isRegistering ? 'Validar Abertura de Conta' : 'Autenticar Acesso Core'}</span>}
            {!loading && (isRegistering ? <UserPlus size={18} /> : <ArrowRight size={18} />)}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-dark-800 text-center">
           <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mb-2">
             {isRegistering ? 'Já possui registro ativo no core?' : 'Ainda não é um membro VIP?'}
           </p>
           <button 
             onClick={toggleMode}
             className="text-xs font-black text-gold-500 hover:text-gold-400 transition-all uppercase tracking-widest"
           >
             {isRegistering ? 'Retornar ao Login' : 'Solicitar Abertura de Conta Digital'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
