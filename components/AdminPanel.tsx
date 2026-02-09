
import React, { useContext, useState, useEffect, useCallback } from 'react';
import { AppContext } from '../App';
import { getAdminData, adminUpdateUser, adminAdjustBalance, factoryResetSystem, adminCreateUser, generateSystemDump, adminApproveKyc } from '../services/api';
import { User, AuditLog, KycStatus } from '../types';
import { ShieldCheck, UserPlus, X, Wallet, Download, RefreshCw, Activity, CheckCircle, XCircle, Clock, AlertTriangle, FileText, ServerCrash, Database } from 'lucide-react';
import { CURRENCY_SYMBOL, CRYPTO_SYMBOL } from '../constants';

const AdminPanel: React.FC = () => {
  const { user, refreshUser } = useContext(AppContext);
  const [users, setUsers] = useState<User[]>([]);
  const [audits, setAudits] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'audit' | 'system'>('users');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', initialBalance: 0 });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editBalances, setEditBalances] = useState({ fiat: '', crypto: '' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  const loadData = useCallback(async () => {
    const data = await getAdminData();
    setUsers(data.users);
    setAudits(data.audits);
  }, []);

  useEffect(() => {
    setGeneratedCode(Math.floor(1000 + Math.random() * 9000).toString());
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      // ESCUTA EM TEMPO REAL: Qualquer mudança no banco reflete aqui na hora
      window.addEventListener('storage_update', loadData);
      window.addEventListener('storage', loadData); 
      return () => {
        window.removeEventListener('storage_update', loadData);
        window.removeEventListener('storage', loadData);
      };
    }
  }, [isAuthenticated, loadData]);

  const handle2FASubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFACode === generatedCode) setIsAuthenticated(true);
    else alert("Token Administrativo Inválido");
  };

  const toggleBlockUser = async (u: User) => {
    if (!user) return;
    await adminUpdateUser(user.id, u.id, { isBlocked: !u.isBlocked });
  };

  const handleApproveKyc = async (targetId: string) => {
    if (!user) return;
    await adminApproveKyc(user.id, targetId);
  };

  const handleSaveBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingUser) return;
    await adminAdjustBalance(user.id, editingUser.id, parseFloat(editBalances.fiat), parseFloat(editBalances.crypto));
    setEditingUser(null);
    if (editingUser.id === user.id) refreshUser();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await adminCreateUser(user.id, {
      name: newUser.name,
      email: newUser.email,
      passwordHash: newUser.password,
      balanceFiat: newUser.initialBalance
    });
    setShowCreateModal(false);
    setNewUser({ name: '', email: '', password: '', initialBalance: 0 });
  };

  // Fix: Added handleDownloadDump to provide the Core Dump download functionality
  const handleDownloadDump = () => {
    const data = generateSystemDump();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `binarymind_core_dump_${new Date().toISOString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-8">
        <div className="p-6 bg-red-500/10 rounded-full border border-red-500/20">
          <ShieldCheck size={64} className="text-red-500" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Área de Segurança Máxima</h2>
          <p className="text-zinc-500 text-xs mt-2 font-mono">INSIRA O TOKEN DE ACESSO CENTRAL</p>
        </div>
        <div onClick={() => setTwoFACode(generatedCode)} className="bg-dark-900 border border-dark-800 p-6 rounded-2xl text-center cursor-pointer hover:border-gold-500 transition-all group">
           <p className="text-[10px] text-zinc-500 mb-2 uppercase font-bold group-hover:text-gold-500">Token Gerado (Clique para preencher)</p>
           <p className="text-4xl font-mono font-bold text-white tracking-widest">{generatedCode}</p>
        </div>
        <form onSubmit={handle2FASubmit} className="flex gap-2 w-full max-w-xs">
          <input type="text" maxLength={4} value={twoFACode} onChange={e => setTwoFACode(e.target.value)} className="w-full bg-dark-950 border border-dark-800 p-4 rounded-xl text-white text-center font-mono focus:border-gold-500 outline-none" placeholder="OTP" />
          <button type="submit" className="bg-gold-500 text-black px-6 rounded-xl font-black uppercase text-xs">Entrar</button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-dark-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-black text-white uppercase flex items-center gap-2">
              <ShieldCheck className="text-red-500"/> Central de Comando
            </h2>
            <div className="flex items-center gap-1.5 bg-green-500/10 text-green-500 px-2 py-0.5 rounded text-[10px] font-black border border-green-500/20">
              <Activity size={12} className="animate-pulse" /> LIVE STREAM
            </div>
          </div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Monitoramento de Ledger e Auditoria em Tempo Real</p>
        </div>
        <div className="flex bg-dark-900 p-1 rounded-xl border border-dark-800">
          <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'users' ? 'bg-dark-800 text-gold-500' : 'text-zinc-500'}`}>Clientes</button>
          <button onClick={() => setActiveTab('audit')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'audit' ? 'bg-dark-800 text-gold-500' : 'text-zinc-500'}`}>Logs</button>
          <button onClick={() => setActiveTab('system')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'system' ? 'bg-dark-800 text-gold-500' : 'text-zinc-500'}`}>Sistema</button>
        </div>
      </div>

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white text-sm uppercase tracking-widest flex items-center gap-2">Registros Ativos <span className="bg-dark-800 text-zinc-500 px-2 rounded-full text-[10px]">{users.length}</span></h3>
            <button onClick={() => setShowCreateModal(true)} className="bg-gold-500 text-black p-2 rounded-lg font-bold text-xs flex items-center gap-2"><UserPlus size={16}/> CADASTRAR CLIENTE</button>
          </div>
          <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden shadow-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-dark-950 text-zinc-500 uppercase font-black tracking-widest">
                <tr>
                  <th className="p-4">Usuário</th>
                  <th className="p-4">Identificador</th>
                  <th className="p-4">Patrimônio</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Controle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-dark-800/30 transition-colors">
                    <td className="p-4 font-bold text-white">{u.name}</td>
                    <td className="p-4 text-zinc-500 font-mono">{u.email}</td>
                    <td className="p-4 font-mono">
                      <p className="text-zinc-300">{CURRENCY_SYMBOL} {u.balanceFiat.toLocaleString()}</p>
                      <p className="text-gold-500 text-[10px]">{u.balanceCrypto} {CRYPTO_SYMBOL}</p>
                    </td>
                    <td className="p-4">
                      {u.isBlocked ? <span className="text-red-500 font-bold uppercase text-[9px]">Suspenso</span> : <span className="text-green-500 font-bold uppercase text-[9px]">Operacional</span>}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setEditingUser(u); setEditBalances({ fiat: u.balanceFiat.toString(), crypto: u.balanceCrypto.toString() }); }} className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-1 rounded text-[9px] font-bold">EDITAR</button>
                        <button onClick={() => toggleBlockUser(u)} className={`${u.isBlocked ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'} px-2 py-1 rounded text-[9px] font-bold border ${u.isBlocked ? 'border-green-500/20' : 'border-red-500/20'}`}>
                          {u.isBlocked ? 'REATIVAR' : 'SUSPENDER'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
          <h3 className="font-bold text-white mb-6 uppercase tracking-widest text-sm flex items-center gap-2"><FileText size={18}/> Auditoria Global</h3>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {audits.length === 0 ? <p className="text-center text-zinc-600 py-10 italic">Nenhum log registrado.</p> : audits.map(log => (
              <div key={log.id} className="p-3 bg-dark-950 border border-dark-800 rounded-xl flex justify-between items-start">
                <div>
                  <p className="text-gold-500 font-black text-[10px] uppercase">{log.action}</p>
                  <p className="text-zinc-300 text-xs mt-1">{log.details}</p>
                </div>
                <span className="text-[9px] text-zinc-600 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
            <h3 className="font-bold text-red-500 mb-4 uppercase text-xs flex items-center gap-2"><ServerCrash size={16}/> Terminal de Emergência</h3>
            <p className="text-zinc-500 text-[10px] mb-6 leading-relaxed">Apagar todos os dados do banco e reinicializar as tabelas de sistema.</p>
            <button onClick={factoryResetSystem} className="w-full bg-red-600 hover:bg-red-700 text-white p-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2">
              <RefreshCw size={18} /> RESETAR INFRAESTRUTURA (FULL WIPE)
            </button>
          </div>
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
            <h3 className="font-bold text-blue-400 mb-4 uppercase text-xs flex items-center gap-2"><Database size={16}/> Backup Ledger</h3>
            <p className="text-zinc-500 text-[10px] mb-6 leading-relaxed">Baixar o estado atual do banco de dados em formato JSON para análise off-site.</p>
            <button onClick={handleDownloadDump} className="w-full bg-blue-900/30 hover:bg-blue-900/50 text-blue-200 border border-blue-800/50 p-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2">
              <Download size={18} /> DOWNLOAD CORE DUMP
            </button>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 backdrop-blur-xl animate-in zoom-in duration-200">
          <div className="bg-dark-900 border border-dark-800 rounded-3xl w-full max-w-md p-8 relative shadow-2xl">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white"><X size={24}/></button>
            <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tighter">Injetar Novo Usuário</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <input required type="text" placeholder="NOME COMPLETO" className="w-full bg-dark-950 border border-dark-800 p-4 rounded-xl text-white font-bold outline-none focus:border-gold-500" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
              <input required type="email" placeholder="E-MAIL" className="w-full bg-dark-950 border border-dark-800 p-4 rounded-xl text-white font-bold outline-none focus:border-gold-500" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
              <input required type="text" placeholder="SENHA" className="w-full bg-dark-950 border border-dark-800 p-4 rounded-xl text-white font-bold outline-none focus:border-gold-500" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
              <input required type="number" placeholder="SALDO INICIAL FIAT" className="w-full bg-dark-950 border border-dark-800 p-4 rounded-xl text-white font-bold outline-none focus:border-gold-500" value={newUser.initialBalance} onChange={e => setNewUser({...newUser, initialBalance: parseFloat(e.target.value)})} />
              <button type="submit" className="w-full bg-gold-500 text-black p-4 rounded-xl font-black uppercase text-xs mt-4">Validar e Registrar</button>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 backdrop-blur-xl animate-in zoom-in duration-200">
          <div className="bg-dark-900 border border-dark-800 rounded-3xl w-full max-w-md p-8 relative shadow-2xl">
            <button onClick={() => setEditingUser(null)} className="absolute top-6 right-6 text-zinc-500 hover:text-white"><X size={24}/></button>
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">Ajuste de Ativos</h3>
            <p className="text-[10px] text-zinc-500 mb-8 font-mono">USUÁRIO: {editingUser.name}</p>
            <form onSubmit={handleSaveBalance} className="space-y-6">
              <div className="bg-dark-950 p-4 rounded-2xl border border-dark-800">
                <label className="text-[10px] text-zinc-500 uppercase font-black mb-2 block">Saldo Fiat ({CURRENCY_SYMBOL})</label>
                <input type="number" step="0.01" className="bg-transparent text-white text-3xl font-mono font-bold outline-none w-full" value={editBalances.fiat} onChange={e => setEditBalances({...editBalances, fiat: e.target.value})} />
              </div>
              <div className="bg-dark-950 p-4 rounded-2xl border border-dark-800">
                <label className="text-[10px] text-zinc-500 uppercase font-black mb-2 block">Saldo Crypto ({CRYPTO_SYMBOL})</label>
                <input type="number" step="0.0001" className="bg-transparent text-white text-3xl font-mono font-bold outline-none w-full" value={editBalances.crypto} onChange={e => setEditBalances({...editBalances, crypto: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-xl font-black uppercase text-xs">Salvar Alterações</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
