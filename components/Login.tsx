
import React, { useState, useContext } from 'react';
import { login, registerUser } from '../services/api';
import { AppContext } from '../App';
import { ArrowRight, Loader2 } from 'lucide-react';

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
      if (isRegistering) await registerUser(name, email, password);
      else await login(email, password);
      await refreshUser();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-black p-8">
      <div className="max-w-sm mx-auto w-full space-y-12">
        <div>
          <h1 className="text-4xl font-black text-white italic tracking-tighter">BINARY<span className="text-nuPurple">MIND</span></h1>
          <p className="text-gray-500 mt-2 font-bold uppercase tracking-widest text-[10px]">Financial Intelligence Core</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isRegistering && (
            <input type="text" placeholder="Nome completo" className="w-full bg-transparent border-b border-[#1c1c1c] p-4 text-white font-bold outline-none focus:border-nuPurple transition-all" value={name} onChange={e => setName(e.target.value)} required />
          )}
          <input type="email" placeholder="E-mail" className="w-full bg-transparent border-b border-[#1c1c1c] p-4 text-white font-bold outline-none focus:border-nuPurple transition-all" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Senha" className="w-full bg-transparent border-b border-[#1c1c1c] p-4 text-white font-bold outline-none focus:border-nuPurple transition-all" value={password} onChange={e => setPassword(e.target.value)} required />

          {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}

          <button type="submit" disabled={loading} className="w-full bg-nuPurple text-white font-black py-5 rounded-full flex items-center justify-center gap-3 shadow-xl shadow-nuPurple/10 hover:bg-nuPurple-hover transition-all">
            {loading ? <Loader2 className="animate-spin" /> : <span>{isRegistering ? 'Criar conta' : 'Entrar'}</span>}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <button onClick={() => setIsRegistering(!isRegistering)} className="w-full text-nuPurple font-bold text-sm">
          {isRegistering ? 'Já tenho uma conta' : 'Quero ser BinaryMind'}
        </button>
      </div>
    </div>
  );
};

export default Login;
