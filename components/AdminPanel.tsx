
import React, { useContext, useState, useEffect, useCallback } from 'react';
import { AppContext } from '../App';
import { getAdminData, adminUpdateUser, adminAdjustBalance, factoryResetSystem, adminCreateUser, generateSystemDump, adminApproveKyc } from '../services/api';
import { User, AuditLog, KycStatus } from '../types';
import { ShieldCheck, Search, AlertTriangle, CheckCircle, XCircle, FileText, Database, UserPlus, X, Wallet, Coins, Download, Clock, ServerCrash, RefreshCw, Copy, Activity } from 'lucide-react';
import { CURRENCY_SYMBOL, CRYPTO_SYMBOL } from '../constants';

const AdminPanel: React.FC = () => {
  const { user, refreshUser } = useContext(AppContext);
  const [users, setUsers] = useState<User[]>([]);
  const [audits, setAudits] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'audit' | 'system'>('users');
  
  // State for Create User Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', initialBalance: 0 });

  // State for Balance Adjustment Modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editBalances, setEditBalances] = useState({ fiat: '', crypto: '' });

  // 2FA Simulation State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  useEffect(() => {
    setGeneratedCode(Math.floor(1000 + Math.random() * 9000).toString());
  }, []);

  const loadData = useCallback(async () => {
    const data = await getAdminData();
    setUsers(data.users);
    setAudits(data.audits);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      
      // ESCUTA EM TEMPO REAL: Atualiza o painel sempre que o banco de dados mudar
      window.addEventListener('storage_update', loadData);
      window.addEventListener('storage', loadData); // Sincronização entre abas
      
      return () => {
        window.removeEventListener('storage_update', loadData);
        window.removeEventListener('storage', loadData);
      };
    }
  }, [isAuthenticated, loadData]);

  const handle2FASubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFACode === generatedCode) {
      setIsAuthenticated(true);
    } else {
      alert("Erro de Autenticação: Token inválido.");
    }
  };

  const handleAutoFill2FA = () => {
    setTwoFACode(generatedCode);
  };

  const toggleBlockUser = async (u: User) => {
    if (!user) return;
    if (window.confirm(`Confirma alteração de status de bloqueio para ${u.email}?`)) {
      await adminUpdateUser(user.id, u.id, { isBlocked: !u.isBlocked });
      // loadData será chamado automaticamente via evento storage_update
    }
  };

  const handleApproveKyc = async (targetId: string) => {
    if (!user) return;
    try {
      await adminApproveKyc(user.id, targetId);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const openBalanceModal = (u: User) => {
    setEditingUser(u);
    setEditBalances({
      fiat: u.balanceFiat.toString(),
      crypto: u.balanceCrypto.toString()
    });
  };

  const handleSaveBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingUser) return;

    const newFiat = parseFloat(editBalances.fiat);
    const newCrypto = parseFloat(editBalances.crypto);

    if (isNaN(newFiat) || isNaN(newCrypto)) {
      alert("Entrada inválida.");
      return;
    }

    try {
      await adminAdjustBalance(user.id, editingUser.id, newFiat, newCrypto);
      setEditingUser(null);
      if (editingUser.id === user.id) refreshUser();
    } catch (error: any) {
      alert("Falha na operação: " + error.message);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await adminCreateUser(user.id, {
        name: newUser.name,
        email: newUser.email,
        passwordHash: newUser.password,
        balanceFiat: newUser.initialBalance
      });
      setShowCreateModal(false);
      setNewUser({ name: '', email: '', password: '', initialBalance: 0 });
    } catch (error: any) {
      alert("Erro ao criar registro: " + error.message);
    }
  };

  const handleFactoryReset = async () => {
    if(window.confirm("ATENÇÃO: Operação Destrutiva. Confirmar?")) {
      await factoryResetSystem();
      window.location.reload();
    }
  };

  const handleDownloadDump = () => {
    const jsonString = generateSystemDump();
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `binarymind_dump_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-6">
        <ShieldCheck size={64} className="text-gold-500" />
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white uppercase tracking-wider">Acesso Restrito</h2>
          <p className="text-zinc-400 text-sm mt-2 max-w-md">Autenticação multifator obrigatória para administradores.</p>
        </div>
        
        <div onClick={handleAutoFill2FA} className="bg-dark-900 border border-gold-500/30 p-6 rounded-lg text-center w-full max-w-sm cursor-pointer hover:bg-dark-800 transition-colors group">
           <p className="text-xs text-gold-500 uppercase tracking-widest mb-2">Token Administrativo (Clique p/ copiar)</p>
           <p className="text-4xl font-mono font-bold text-white tracking-[0.2em]">{generatedCode}</p>
        </div>

        <form onSubmit={handle2FASubmit} className="flex gap-2 w-full max-w-sm">
          <input 
            type="text" 
            value={twoFACode}
            onChange={e => setTwoFACode(e.target.value)}
            className="flex-1 bg-dark-950 border border-dark-800 p-3 rounded text-white text-center font-mono focus:border-gold-500 outline-none"
            placeholder="OTP"
            maxLength={4}
          />
          <button type="submit" className="bg-gold-500 text-black px-6 py-3 rounded font-bold hover:bg-gold-400 text-sm">Acessar</button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative pb-20 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-dark-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="text-red-500"/> Painel de Controle
            </h2>
            <div className="flex items-center gap-1.5 bg-green-500/10 text-green-500 px-2 py-0.5 rounded text-[10px] font-bold border border-green-500/20">
              <Activity size={10} className="animate-pulse" /> MONITORAMENTO LIVE
            </div>
          </div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Interface de Gestão Centralizada em Tempo Real</p>
        </div>
        <div className="flex bg-dark-900 p-1 rounded-lg border border-dark-800">
          <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-dark-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}>Clientes</button>
          <button onClick={() => setActiveTab('audit')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'audit' ? 'bg-dark-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}>Auditoria</button>
          <button onClick={() => setActiveTab('system')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'system' ? 'bg-dark-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}>Sistema</button>
        </div>
      </div>

      {activeTab === 'users' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">Base de Dados de Clientes <span className="text-xs bg-dark-800 text-zinc-500 px-2 py-0.5 rounded-full">{users.length} contas</span></h3>
            <button onClick={() => setShowCreateModal(true)} className="bg-gold-500 hover:bg-gold-400 text-black font-bold py-2 px-4 rounded-lg flex items-center gap-2 text-sm transition-colors">
              <UserPlus size={18} /> Novo Registro
            </button>
          </div>

          <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-dark-950 text-[10px] uppercase text-zinc-500 tracking-wider">
                  <tr>
                    <th className="p-4">Identificação</th>
                    <th className="p-4">Conta</th>
                    <th className="p-4">Patrimônio</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {users.length === 0 ? (
                    <tr><td colSpan={5} className="p-10 text-center text-zinc-600 italic">Nenhum registro no servidor.</td></tr>
                  ) : (
                    users.map(u => (
                      <tr key={u.id} className="hover:bg-dark-800/30 transition-colors animate-in slide-in-from-left-2 duration-300">
                        <td className="p-4">
                          <p className="font-bold text-white flex items-center gap-2">{u.name}</p>
                          <p className="text-[10px] text-zinc-500 font-mono">UID: {u.id}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-zinc-300">{u.email}</p>
                          <span className="text-[9px] bg-dark-800 px-1.5 py-0.5 rounded border border-dark-700 uppercase font-bold text-zinc-400">{u.role}</span>
                        </td>
                        <td className="p-4 text-xs font-mono">
                          <p className="text-zinc-300">{CURRENCY_SYMBOL} {u.balanceFiat.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          <p className="text-gold-500">{u.balanceCrypto.toFixed(4)} {CRYPTO_SYMBOL}</p>
                        </td>
                        <td className="p-4">
                           <div className="flex flex-col gap-1">
                              {u.isBlocked 
                                ? <span className="text-red-500 text-[10px] flex items-center gap-1 font-bold uppercase"><XCircle size={10}/> Suspenso</span> 
                                : <span className="text-green-500 text-[10px] flex items-center gap-1 font-bold uppercase"><CheckCircle size={10}/> Ativo</span>
                              }
                              {u.kycStatus === KycStatus.PENDING && (
                                 <span className="text-yellow-500 text-[10px] flex items-center gap-1 font-bold animate-pulse"><Clock size={10}/> KYC Pendente</span>
                              )}
                           </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            {u.kycStatus === KycStatus.PENDING && (
                              <button onClick={() => handleApproveKyc(u.id)} className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 hover:bg-yellow-500/20 text-[10px] px-2 py-1 rounded font-bold transition-all">VALIDAR</button>
                            )}
                            <button onClick={() => openBalanceModal(u)} className="text-blue-400 bg-blue-900/10 border border-blue-900/20 hover:bg-blue-900/20 text-[10px] px-2 py-1 rounded font-bold transition-all">AJUSTE</button>
                            {u.id !== user?.id && (
                               <button onClick={() => toggleBlockUser(u)} className={`${u.isBlocked ? 'text-green-400 bg-green-900/10 border-green-900/20' : 'text-red-400 bg-red-900/10 border-red-900/20'} text-[10px] px-2 py-1 rounded font-bold border transition-all`}>
                                 {u.isBlocked ? 'LIBERAR' : 'BLOQUEAR'}
                               </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'audit' && (
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-2xl">
           <div className="flex justify-between items-center mb-6">
             <h3 className="font-bold text-white flex items-center gap-2"><FileText size={18}/> Histórico de Eventos do Sistema</h3>
             <div className="text-[10px] text-zinc-500 font-mono">ÚLTIMA ATUALIZAÇÃO: {new Date().toLocaleTimeString()}</div>
           </div>
           <div className="space-y-0 divide-y divide-dark-800 max-h-[600px] overflow-y-auto border border-dark-800 rounded-xl bg-dark-950/50">
             {audits.length === 0 ? (
               <p className="p-10 text-center text-zinc-600 italic">Nenhum evento auditado.</p>
             ) : (
               audits.map(log => (
                 <div key={log.id} className="p-4 hover:bg-dark-800/30 transition-colors animate-in slide-in-from-bottom-2">
                   <div className="flex justify-between items-start mb-1">
                     <span className="text-[10px] font-bold text-gold-500 bg-gold-500/10 px-1.5 py-0.5 rounded border border-gold-500/20">{log.action}</span>
                     <span className="text-[10px] text-zinc-500 font-mono">{new Date(log.timestamp).toLocaleString('pt-BR')}</span>
                   </div>
                   <p className="text-sm text-zinc-300 mt-2">{log.details}</p>
                   <div className="flex gap-4 text-[9px] text-zinc-600 mt-3 font-mono uppercase tracking-tighter">
                     <span>OPERADOR: {log.adminId}</span>
                     {log.targetUserId && <span>ALVO: {log.targetUserId}</span>}
                   </div>
                 </div>
               ))
             )}
           </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-red-500 uppercase text-sm tracking-widest"><ServerCrash size={18}/> Procedimentos Críticos</h3>
            <div className="bg-red-900/10 border border-red-900/20 p-4 rounded-xl mb-6">
               <p className="text-red-400 text-xs font-black uppercase mb-2 flex items-center gap-2"><AlertTriangle size={14}/> Hard Reset do Servidor</p>
               <p className="text-zinc-500 text-[10px] leading-relaxed">
                 Atenção: Esta ação é irreversível. Todas as tabelas do LocalStorage serão eliminadas e o banco de dados retornará ao estado de fábrica. 
                 Sessões ativas serão invalidadas.
               </p>
            </div>
            <button onClick={handleFactoryReset} className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/10">
              <RefreshCw size={18} /> REINICIALIZAR INFRAESTRUTURA
            </button>
          </div>

          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-blue-400 uppercase text-sm tracking-widest"><Database size={18}/> Extração de Ledger</h3>
            <p className="text-zinc-500 text-[10px] mb-6 leading-relaxed">
              Exportação completa da base de dados (JSON). Utilizado para backups frios e auditorias de conformidade externa.
              A criptografia é simulada neste ambiente de testes.
            </p>
            <div className="bg-dark-950 p-4 rounded-xl border border-dark-800 mb-6 flex items-center justify-between">
               <div>
                 <p className="text-[10px] text-zinc-500 uppercase font-bold">Estado da Base</p>
                 <p className="text-xs text-green-500 font-mono">SAUDÁVEL / ONLINE</p>
               </div>
               <Activity size={24} className="text-zinc-800" />
            </div>
            <button onClick={handleDownloadDump} className="w-full bg-blue-900/30 hover:bg-blue-900/50 text-blue-200 border border-blue-800/50 px-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
              <Download size={18} /> GERAR CORE DUMP (JSON)
            </button>
          </div>
        </div>
      )}

      {/* Modais omitidos para brevidade, mas devem ser mantidos idênticos à lógica anterior com animações de fade-in */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[200] p-4 backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-dark-900 border border-dark-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl">
              <button onClick={() => setShowCreateModal(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white"><X size={24} /></button>
              <h3 className="text-xl font-bold text-white mb-6">Registro Manual de Cliente</h3>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <input type="text" required className="w-full bg-dark-950 border border-dark-800 rounded-xl p-4 text-white outline-none focus:border-gold-500 transition-all text-sm" placeholder="Nome Legal" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                <input type="email" required className="w-full bg-dark-950 border border-dark-800 rounded-xl p-4 text-white outline-none focus:border-gold-500 transition-all text-sm" placeholder="E-mail" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                <input type="text" required className="w-full bg-dark-950 border border-dark-800 rounded-xl p-4 text-white outline-none focus:border-gold-500 transition-all text-sm" placeholder="Senha Temporária" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                <input type="number" required className="w-full bg-dark-950 border border-dark-800 rounded-xl p-4 text-white outline-none focus:border-gold-500 transition-all text-sm font-mono" placeholder="Saldo Inicial" value={newUser.initialBalance} onChange={e => setNewUser({...newUser, initialBalance: parseFloat(e.target.value)})} />
                <button type="submit" className="w-full bg-gold-500 text-black font-bold py-4 rounded-xl hover:bg-gold-400 mt-4 uppercase text-xs tracking-widest">Registrar na Rede</button>
              </form>
           </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[200] p-4 backdrop-blur-md animate-in zoom-in duration-200">
           <div className="bg-dark-900 border border-dark-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl">
              <button onClick={() => setEditingUser(null)} className="absolute top-6 right-6 text-zinc-500 hover:text-white"><X size={24} /></button>
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><Wallet className="text-blue-400" /> Auditoria de Saldo</h3>
              <p className="text-[10px] text-zinc-500 mb-6 border-b border-dark-800 pb-4 font-mono uppercase tracking-widest">ID ALVO: {editingUser.id}</p>
              <form onSubmit={handleSaveBalance} className="space-y-6">
                <div className="bg-dark-950 p-4 rounded-2xl border border-dark-800">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase mb-2 block tracking-widest">Saldo Fiat ({CURRENCY_SYMBOL})</label>
                  <input type="number" step="0.01" required className="w-full bg-transparent text-white font-mono text-2xl outline-none" value={editBalances.fiat} onChange={e => setEditBalances({...editBalances, fiat: e.target.value})} />
                </div>
                <div className="bg-dark-950 p-4 rounded-2xl border border-dark-800">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase mb-2 block tracking-widest">Saldo Crypto ({CRYPTO_SYMBOL})</label>
                  <input type="number" step="0.0001" required className="w-full bg-transparent text-white font-mono text-2xl outline-none" value={editBalances.crypto} onChange={e => setEditBalances({...editBalances, crypto: e.target.value})} />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-500 uppercase text-xs tracking-widest">Confirmar Alterações Contábeis</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
