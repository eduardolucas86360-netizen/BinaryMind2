
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
    loadData();
  };

  const handleApproveKyc = async (targetId: string) => {
    if (!user) return;
    await adminApproveKyc(user.id, targetId);
    loadData();
  };

  const handleSaveBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingUser) return;
    await adminAdjustBalance(user.id, editingUser.id, parseFloat(editBalances.fiat), parseFloat(editBalances.crypto));
    setEditingUser(null);
    if (editingUser.id === user.id) refreshUser();
    loadData();
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
    loadData();
  };

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
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-8 animate-in fade-in">
        <div className="p-8 bg-nuPurple/10 rounded-full border border-nuPurple/20 shadow-2xl">
          <ShieldCheck size={72} className="text-nuPurple" />
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Área de Segurança</h2>
          <p className="text-gray-500 text-xs mt-2 font-mono uppercase tracking-widest">Acesso restrito ao Core Banking</p>
        </div>
        <div onClick={() => setTwoFACode(generatedCode)} className="bg-[#111111] border border-[#1c1c1c] p-8 rounded-3xl text-center cursor-pointer hover:border-nuPurple transition-all group shadow-xl">
           <p className="text-[10px] text-gray-500 mb-3 uppercase font-black tracking-widest group-hover:text-nuPurple transition-colors">Token Gerado (Clique para preencher)</p>
           <p className="text-5xl font-mono font-black text-white tracking-[0.2em]">{generatedCode}</p>
        </div>
        <form onSubmit={handle2FASubmit} className="flex gap-3 w-full max-w-xs">
          <input type="text" maxLength={4} value={twoFACode} onChange={e => setTwoFACode(e.target.value)} className="w-full bg-black border border-[#1c1c1c] p-5 rounded-2xl text-white text-center font-mono text-xl focus:border-nuPurple outline-none transition-all" placeholder="0000" />
          <button type="submit" className="bg-nuPurple text-white px-8 rounded-2xl font-black uppercase text-xs shadow-lg hover:bg-nuPurple-hover transition-all active:scale-95">Entrar</button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-[#1c1c1c] pb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-nuPurple rounded-2xl">
            <ShieldCheck className="text-white" size={32}/>
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tighter italic flex items-center gap-3">
              Admin Control
              <span className="flex items-center gap-1.5 bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-[10px] font-black border border-green-500/20">
                <Activity size={12} className="animate-pulse" /> LIVE
              </span>
            </h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mt-1">BinaryMind Ledger V1 Management</p>
          </div>
        </div>
        <div className="flex bg-[#111111] p-1.5 rounded-2xl border border-[#1c1c1c] shadow-md">
          <button onClick={() => setActiveTab('users')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${activeTab === 'users' ? 'bg-nuPurple text-white' : 'text-gray-500 hover:text-white'}`}>Clientes</button>
          <button onClick={() => setActiveTab('audit')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${activeTab === 'audit' ? 'bg-nuPurple text-white' : 'text-gray-500 hover:text-white'}`}>Logs</button>
          <button onClick={() => setActiveTab('system')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${activeTab === 'system' ? 'bg-nuPurple text-white' : 'text-gray-500 hover:text-white'}`}>Sistema</button>
        </div>
      </div>

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="font-bold text-white text-sm uppercase tracking-widest flex items-center gap-3">Registros <span className="bg-nuPurple/10 text-nuPurple px-3 py-0.5 rounded-full text-[11px]">{users.length}</span></h3>
            <button onClick={() => setShowCreateModal(true)} className="bg-nuPurple hover:bg-nuPurple-hover text-white px-6 py-3 rounded-full font-black text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95"><UserPlus size={18}/> Novo Cliente</button>
          </div>
          <div className="bg-[#111111] border border-[#1c1c1c] rounded-[2rem] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black text-gray-500 uppercase font-black tracking-widest border-b border-[#1c1c1c]">
                  <tr>
                    <th className="p-6">Titular</th>
                    <th className="p-6">E-mail</th>
                    <th className="p-6">Saldos</th>
                    <th className="p-6">Estado</th>
                    <th className="p-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c1c1c]">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-nuPurple/10 rounded-full flex items-center justify-center text-nuPurple font-bold">{u.name.charAt(0)}</div>
                          <span className="font-bold text-white">{u.name}</span>
                        </div>
                      </td>
                      <td className="p-6 text-gray-500 font-mono">{u.email}</td>
                      <td className="p-6">
                        <div className="font-mono">
                          <p className="text-white font-bold">{CURRENCY_SYMBOL} {u.balanceFiat.toLocaleString()}</p>
                          <p className="text-nuPurple text-[10px] font-black">{u.balanceCrypto} {CRYPTO_SYMBOL}</p>
                        </div>
                      </td>
                      <td className="p-6">
                        {u.isBlocked ? (
                          <span className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full font-black uppercase text-[9px] border border-red-500/20">Suspenso</span>
                        ) : (
                          <span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full font-black uppercase text-[9px] border border-green-500/20">Ativo</span>
                        )}
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex justify-end gap-3">
                          <button onClick={() => { setEditingUser(u); setEditBalances({ fiat: u.balanceFiat.toString(), crypto: u.balanceCrypto.toString() }); }} className="bg-nuPurple text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase shadow-md hover:bg-nuPurple-hover transition-all">Saldos</button>
                          <button onClick={() => toggleBlockUser(u)} className={`${u.isBlocked ? 'bg-green-500 hover:bg-green-400' : 'bg-red-600 hover:bg-red-500'} text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase shadow-md transition-all`}>
                            {u.isBlocked ? 'Reativar' : 'Bloquear'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-[#111111] border border-[#1c1c1c] rounded-[2rem] p-8 shadow-xl">
          <h3 className="font-black text-white mb-8 uppercase tracking-widest text-sm flex items-center gap-3"><FileText size={20} className="text-nuPurple"/> Registro de Auditoria</h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-4 scrollbar-hide">
            {audits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center opacity-20">
                <FileText size={48} />
                <p className="text-xs uppercase font-black mt-4">Nenhum evento registrado no Ledger</p>
              </div>
            ) : audits.map(log => (
              <div key={log.id} className="p-5 bg-black border border-[#1c1c1c] rounded-[1.5rem] flex justify-between items-center group hover:border-nuPurple/30 transition-all">
                <div>
                  <p className="text-nuPurple font-black text-[11px] uppercase tracking-widest">{log.action}</p>
                  <p className="text-gray-300 text-sm mt-1.5">{log.details}</p>
                </div>
                <span className="text-[10px] text-gray-600 font-mono font-bold">{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#111111] border border-[#1c1c1c] rounded-[2rem] p-8 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 text-red-500 mb-6">
                <ServerCrash size={24}/>
                <h3 className="font-black uppercase text-sm tracking-widest">Painel de Crise</h3>
              </div>
              <p className="text-gray-500 text-xs mb-8 leading-relaxed font-bold uppercase tracking-widest opacity-60">Resetar permanentemente todas as tabelas e usuários do sistema BinaryMind.</p>
            </div>
            <button onClick={() => { if(confirm("DESEJA APAGAR TUDO?")) factoryResetSystem(); }} className="w-full bg-red-600 hover:bg-red-700 text-white p-5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95">
              <RefreshCw size={20} /> RESET INFRAESTRUTURA
            </button>
          </div>
          <div className="bg-[#111111] border border-[#1c1c1c] rounded-[2rem] p-8 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 text-nuPurple mb-6">
                <Database size={24}/>
                <h3 className="font-black uppercase text-sm tracking-widest">Exportação Central</h3>
              </div>
              <p className="text-gray-500 text-xs mb-8 leading-relaxed font-bold uppercase tracking-widest opacity-60">Gerar snapshot completo do banco de dados para backup administrativo offline.</p>
            </div>
            <button onClick={handleDownloadDump} className="w-full bg-nuPurple hover:bg-nuPurple-hover text-white p-5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95">
              <Download size={20} /> BAIXAR CORE DUMP
            </button>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/98 z-[300] flex items-center justify-center p-4 backdrop-blur-3xl animate-in zoom-in duration-200">
          <div className="bg-[#111111] border border-[#1c1c1c] rounded-[2.5rem] w-full max-w-md p-10 relative shadow-2xl">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"><X size={32}/></button>
            <h3 className="text-2xl font-black text-white mb-8 tracking-tighter italic">Novo Registro</h3>
            <form onSubmit={handleCreateUser} className="space-y-5">
              <input required type="text" placeholder="Nome do Titular" className="w-full bg-black border border-[#1c1c1c] p-5 rounded-2xl text-white font-bold outline-none focus:border-nuPurple transition-all" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
              <input required type="email" placeholder="E-mail de rede" className="w-full bg-black border border-[#1c1c1c] p-5 rounded-2xl text-white font-bold outline-none focus:border-nuPurple transition-all" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
              <input required type="text" placeholder="Senha inicial" className="w-full bg-black border border-[#1c1c1c] p-5 rounded-2xl text-white font-bold outline-none focus:border-nuPurple transition-all" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
              <div className="bg-black border border-[#1c1c1c] p-4 rounded-2xl">
                <label className="text-[10px] text-gray-500 uppercase font-black mb-1 block">Saldo Inicial ({CURRENCY_SYMBOL})</label>
                <input required type="number" step="0.01" className="bg-transparent text-white text-3xl font-mono font-black outline-none w-full" value={newUser.initialBalance} onChange={e => setNewUser({...newUser, initialBalance: parseFloat(e.target.value)})} />
              </div>
              <button type="submit" className="w-full bg-nuPurple text-white p-5 rounded-full font-black uppercase text-sm mt-4 shadow-xl active:scale-95">Injetar na Rede</button>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 bg-black/98 z-[300] flex items-center justify-center p-4 backdrop-blur-3xl animate-in zoom-in duration-200">
          <div className="bg-[#111111] border border-[#1c1c1c] rounded-[2.5rem] w-full max-w-md p-10 relative shadow-2xl">
            <button onClick={() => setEditingUser(null)} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"><X size={32}/></button>
            <h3 className="text-2xl font-black text-white mb-2 tracking-tighter italic">Editar Ativos</h3>
            <p className="text-[10px] text-nuPurple mb-10 font-black uppercase tracking-widest">Titular: {editingUser.name}</p>
            <form onSubmit={handleSaveBalance} className="space-y-8">
              <div className="bg-black p-5 rounded-[2rem] border border-[#1c1c1c]">
                <label className="text-[10px] text-gray-500 uppercase font-black mb-2 block">Saldo em Conta ({CURRENCY_SYMBOL})</label>
                <input type="number" step="0.01" className="bg-transparent text-white text-4xl font-mono font-black outline-none w-full" value={editBalances.fiat} onChange={e => setEditBalances({...editBalances, fiat: e.target.value})} />
              </div>
              <div className="bg-black p-5 rounded-[2rem] border border-[#1c1c1c]">
                <label className="text-[10px] text-gray-500 uppercase font-black mb-2 block">Saldo em Ativos ({CRYPTO_SYMBOL})</label>
                <input type="number" step="0.0001" className="bg-transparent text-white text-4xl font-mono font-black outline-none w-full" value={editBalances.crypto} onChange={e => setEditBalances({...editBalances, crypto: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-white text-black p-5 rounded-full font-black uppercase text-sm shadow-xl active:scale-95">Gravar Alterações</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
