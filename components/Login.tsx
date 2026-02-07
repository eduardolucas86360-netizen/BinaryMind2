
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
        if (name.trim().length < 3) throw new Error("Nome muito curto.");
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
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-gold-500/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[100px]"></div>

      <div className="w-full max-w-md bg-dark-900/50 backdrop-blur-xl border border-dark-800 rounded-3xl p-8 shadow-2xl relative z-10 transition-all duration-300">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-gold-500/5 rounded-2xl mb-4 border border-gold-500/20 shadow-lg shadow-gold-500/5">
            <Logo className="text-gold-500 w-16 h-16" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Binary<span className="text-gold-500">Mind</span></h1>
          <p className="text-zinc-500 text-sm mt-2">
            {isRegistering ? 'Crie sua conta digital de alta segurança' : 'Portal de Acesso Core Banking'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
             <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <label className="text-xs font-semibold text-zinc-400 ml-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-dark-950 border border-dark-800 text-white p-3 rounded-xl mt-1 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-all"
                  placeholder="Seu nome"
                  required
                />
             </div>
          )}

          <div>
             <label className="text-xs font-semibold text-zinc-400 ml-1">Identificador (E-mail)</label>
             <input 
               type="email" 
               value={email}
               onChange={e => setEmail(e.target.value)}
               className="w-full bg-dark-950 border border-dark-800 text-white p-3 rounded-xl mt-1 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-all"
               placeholder="nome@empresa.com"
               required
             />
          </div>
          <div>
             <label className="text-xs font-semibold text-zinc-400 ml-1">Código de Acesso (Senha)</label>
             <input 
               type="password" 
               value={password}
               onChange={e => setPassword(e.target.value)}
               className="w-full bg-dark-950 border border-dark-800 text-white p-3 rounded-xl mt-1 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-all"
               required
             />
          </div>

          {error && <div className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded-lg">{error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gold-500 hover:bg-gold-400 text-black font-bold py-3.5 rounded-xl transition-all flex items-center justify-center space-x-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <span>{isRegistering ? 'Abrir Conta Digital' : 'Autenticar'}</span>}
            {!loading && (isRegistering ? <UserPlus size={18} /> : <ArrowRight size={18} />)}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-dark-800 text-center">
           <p className="text-xs text-zinc-500 mb-1">
             {isRegistering ? 'Já possui registro no core?' : 'Ainda não é cliente VIP?'}
           </p>
           <button 
             onClick={toggleMode}
             className="text-sm font-bold text-gold-500 hover:underline hover:text-gold-400 transition-colors"
           >
             {isRegistering ? 'Voltar para Login' : 'Solicitar Abertura de Conta'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
