import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../App';
import { getAdminData, adminUpdateUser, adminAdjustBalance, factoryResetSystem, adminCreateUser, generateSystemDump, adminApproveKyc } from '../services/api';
import { User, AuditLog, KycStatus } from '../types';
import { ShieldCheck, Search, AlertTriangle, CheckCircle, XCircle, FileText, Database, UserPlus, X, Wallet, Coins, Download, Clock, ServerCrash, RefreshCw, Copy } from 'lucide-react';
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
    // Generate simple code on mount
    setGeneratedCode(Math.floor(1000 + Math.random() * 9000).toString());
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await getAdminData();
    setUsers(data.users);
    setAudits(data.audits);
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated]);

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
      loadData();
    }
  };

  const handleApproveKyc = async (targetId: string) => {
    if (!user) return;
    try {
      await adminApproveKyc(user.id, targetId);
      loadData();
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
      alert("Entrada inválida. Insira valores numéricos.");
      return;
    }

    try {
      await adminAdjustBalance(user.id, editingUser.id, newFiat, newCrypto);
      setEditingUser(null);
      loadData();
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
      loadData();
    } catch (error: any) {
      alert("Erro ao criar registro: " + error.message);
    }
  };

  const handleFactoryReset = async () => {
    if(window.confirm("ATENÇÃO: Operação Destrutiva.\n\nIsso irá apagar todo o banco de dados e restaurar as configurações de fábrica. Confirmar?")) {
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
    link.download = `binarymind_core_dump_${new Date().getTime()}.json`;
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
          <p className="text-zinc-400 text-sm mt-2 max-w-md">
            Ambiente de Gestão de Riscos e Compliance. Autenticação multifator obrigatória.
          </p>
        </div>
        
        <div 
          onClick={handleAutoFill2FA}
          className="bg-dark-900 border border-gold-500/30 p-6 rounded-lg text-center w-full max-w-sm cursor-pointer hover:bg-dark-800 transition-colors group"
          title="Clique para preencher"
        >
           <p className="text-xs text-gold-500 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
             Token de Segurança (OTP) <Copy size={12} className="opacity-0 group-hover:opacity-100 transition-opacity"/>
           </p>
           <p className="text-4xl font-mono font-bold text-white tracking-[0.2em]">{generatedCode}</p>
        </div>

        <form onSubmit={handle2FASubmit} className="flex gap-2 w-full max-w-sm">
          <input 
            type="text" 
            value={twoFACode}
            onChange={e => setTwoFACode(e.target.value)}
            className="flex-1 bg-dark-950 border border-dark-800 p-3 rounded text-white text-center font-mono focus:border-gold-500 outline-none"
            placeholder="Inserir Token"
            maxLength={4}
          />
          <button type="submit" className="bg-gold-500 text-black px-6 py-3 rounded font-bold hover:bg-gold-400 uppercase tracking-wide text-sm">
            Acessar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative pb-20">
      <div className="flex justify-between items-center border-b border-dark-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2"><ShieldCheck className="text-red-500"/> Backoffice Administrativo</h2>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider">Nível de Acesso: Root / SuperAdmin</p>
        </div>
        <div className="flex bg-dark-900 p-1 rounded-lg border border-dark-800">
          <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-dark-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}>Clientes</button>
          <button onClick={() => setActiveTab('audit')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'audit' ? 'bg-dark-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}>Compliance Logs</button>
          <button onClick={() => setActiveTab('system')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'system' ? 'bg-dark-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}>Sistema</button>
        </div>
      </div>

      {activeTab === 'users' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Base de Clientes</h3>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-gold-500 hover:bg-gold-400 text-black font-bold py-2 px-4 rounded-lg flex items-center gap-2 text-sm transition-colors"
            >
              <UserPlus size={18} /> Novo Registro
            </button>
          </div>

          <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden shadow-lg">
            <table className="w-full text-left border-collapse">
              <thead className="bg-dark-950 text-xs uppercase text-zinc-500 tracking-wider">
                <tr>
                  <th className="p-4">Identificação</th>
                  <th className="p-4">Credenciais</th>
                  <th className="p-4">Posição Financeira</th>
                  <th className="p-4">Status & Compliance</th>
                  <th className="p-4 text-right">Controles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-dark-800/50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-white flex items-center gap-2">
                        {u.name}
                        {u.id === user?.id && <span className="text-[10px] bg-gold-500 text-black px-1.5 rounded font-bold uppercase">Sessão Atual</span>}
                      </p>
                      <p className="text-xs text-zinc-500 font-mono mt-0.5">UID: {u.id}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-zinc-300">{u.email}</p>
                      <span className="text-[10px] bg-dark-800 px-2 py-0.5 rounded border border-dark-700 uppercase">{u.role}</span>
                    </td>
                    <td className="p-4 text-sm font-mono text-zinc-300">
                      <div className="flex flex-col">
                        <span>Fiat: {CURRENCY_SYMBOL} {u.balanceFiat.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span className="text-gold-500">Ativos: {u.balanceCrypto.toFixed(4)} {CRYPTO_SYMBOL}</span>
                      </div>
                    </td>
                    <td className="p-4">
                       <div className="flex flex-col gap-1.5">
                          {u.isBlocked 
                            ? <span className="text-red-500 text-xs flex items-center gap-1 font-semibold"><XCircle size={12}/> Bloqueio Administrativo</span> 
                            : <span className="text-green-500 text-xs flex items-center gap-1 font-semibold"><CheckCircle size={12}/> Operacional</span>
                          }
                          {u.kycStatus === KycStatus.PENDING && (
                             <span className="text-yellow-500 text-xs flex items-center gap-1 font-bold animate-pulse"><Clock size={12}/> KYC Pendente</span>
                          )}
                          {u.kycStatus === KycStatus.VERIFIED && (
                             <span className="text-blue-400 text-[10px] flex items-center gap-1"><ShieldCheck size={10}/> Verificado</span>
                          )}
                       </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {u.kycStatus === KycStatus.PENDING && (
                          <button 
                            onClick={() => handleApproveKyc(u.id)}
                            className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 hover:bg-yellow-500/20 text-xs px-3 py-1.5 rounded transition-colors font-medium"
                          >
                            Aprovar KYC
                          </button>
                        )}

                        <button 
                          onClick={() => openBalanceModal(u)} 
                          className="text-blue-400 bg-blue-900/10 border border-blue-900/30 hover:bg-blue-900/20 text-xs px-3 py-1.5 rounded transition-colors"
                        >
                          Ajuste Contábil
                        </button>
                        
                        {u.id !== user?.id && (
                           <button onClick={() => toggleBlockUser(u)} className={`${u.isBlocked ? 'text-green-400 bg-green-900/10 border-green-900/30' : 'text-red-400 bg-red-900/10 border-red-900/30'} text-xs px-3 py-1.5 border rounded transition-colors`}>
                             {u.isBlocked ? 'Desbloquear' : 'Bloquear'}
                           </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'audit' && (
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
           <h3 className="font-bold mb-4 flex items-center gap-2 text-white"><FileText size={18}/> Logs de Auditoria & Compliance</h3>
           <div className="space-y-0 divide-y divide-dark-800 max-h-[600px] overflow-y-auto pr-2 border border-dark-800 rounded-lg">
             {audits.map(log => (
               <div key={log.id} className="p-4 hover:bg-dark-800/50 transition-colors">
                 <div className="flex justify-between items-start mb-1">
                   <span className="text-xs font-mono text-gold-500">{log.action}</span>
                   <span className="text-xs text-zinc-500">{new Date(log.timestamp).toLocaleString('pt-BR')}</span>
                 </div>
                 <p className="text-sm text-zinc-200">{log.details}</p>
                 <div className="flex gap-4 text-xs text-zinc-500 mt-2 font-mono">
                   <span>ID: {log.id}</span>
                   <span>Operador: {log.adminId}</span>
                   {log.targetUserId && <span>Alvo: {log.targetUserId}</span>}
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-red-500"><ServerCrash size={18}/> Zona de Perigo / Manutenção</h3>
            <div className="bg-red-900/10 border border-red-900/30 p-4 rounded-lg mb-6">
               <p className="text-red-200 text-sm font-semibold mb-1">Factory Reset (Hard Reset)</p>
               <p className="text-zinc-400 text-xs">
                 Esta ação irá limpar permanentemente todas as tabelas de banco de dados (Usuários, Transações, Logs) e restaurar o estado inicial do sistema. 
                 Utilize apenas para fins de manutenção crítica ou reinicialização de ambiente.
               </p>
            </div>
            <button 
              onClick={handleFactoryReset}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} /> Executar Reset de Fábrica
            </button>
          </div>

          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-blue-400"><Database size={18}/> Backup & Exportação de Dados</h3>
            <p className="text-zinc-400 text-sm mb-6">
              Gera um dump completo do banco de dados em formato JSON criptografado (simulado). 
              Essencial para auditorias externas e backup frio.
            </p>
            <div className="bg-dark-950 p-4 rounded-lg border border-dark-800 mb-6">
               <div className="flex justify-between text-xs text-zinc-500 mb-1">
                 <span>Status do Banco</span>
                 <span className="text-green-500">Online</span>
               </div>
               <div className="flex justify-between text-xs text-zinc-500">
                 <span>Tamanho Estimado</span>
                 <span>~2.4 MB</span>
               </div>
            </div>
            <button 
              onClick={handleDownloadDump}
              className="w-full bg-blue-900/50 hover:bg-blue-900 text-blue-200 border border-blue-800 px-6 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
            >
              <Download size={18} /> Baixar Core Dump
            </button>
          </div>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
           <div className="bg-dark-900 border border-dark-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white"
              >
                <X size={24} />
              </button>
              
              <h3 className="text-xl font-bold text-white mb-6">Cadastro Manual (Backoffice)</h3>
              
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-400 uppercase font-bold">Nome Legal</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full bg-dark-950 border border-dark-800 rounded-lg p-3 text-white mt-1 focus:border-gold-500 outline-none"
                    value={newUser.name}
                    onChange={e => setNewUser({...newUser, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 uppercase font-bold">E-mail Corporativo/Pessoal</label>
                  <input 
                    type="email" 
                    required 
                    className="w-full bg-dark-950 border border-dark-800 rounded-lg p-3 text-white mt-1 focus:border-gold-500 outline-none"
                    value={newUser.email}
                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 uppercase font-bold">Senha Temporária</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full bg-dark-950 border border-dark-800 rounded-lg p-3 text-white mt-1 focus:border-gold-500 outline-none"
                    value={newUser.password}
                    onChange={e => setNewUser({...newUser, password: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 uppercase font-bold">Aporte Inicial ({CURRENCY_SYMBOL})</label>
                  <input 
                    type="number" 
                    required 
                    className="w-full bg-dark-950 border border-dark-800 rounded-lg p-3 text-white mt-1 font-mono focus:border-gold-500 outline-none"
                    value={newUser.initialBalance}
                    onChange={e => setNewUser({...newUser, initialBalance: parseFloat(e.target.value)})}
                  />
                </div>
                
                <div className="pt-4">
                  <button type="submit" className="w-full bg-gold-500 text-black font-bold py-3 rounded-xl hover:bg-gold-400 transition-colors">
                    Registrar Cliente
                  </button>
                </div>
              </form>
           </div>
        </div>
      )}

      {/* Adjust Balance Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
           <div className="bg-dark-900 border border-dark-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
              <button 
                onClick={() => setEditingUser(null)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white"
              >
                <X size={24} />
              </button>
              
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Wallet className="text-blue-400" /> Ajuste de Ledger
              </h3>
              <p className="text-sm text-zinc-400 mb-6 border-b border-dark-800 pb-4">
                Conta Alvo: <span className="text-white font-mono">{editingUser.id}</span>
                <br/>Titular: <span className="text-white">{editingUser.name}</span>
              </p>
              
              <form onSubmit={handleSaveBalance} className="space-y-6">
                
                {/* Fiat Edit */}
                <div className="bg-dark-950 p-4 rounded-xl border border-dark-800">
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-1 uppercase">
                      <Wallet size={12}/> Fiat ({CURRENCY_SYMBOL})
                    </label>
                    <span className="text-xs text-zinc-500">Saldo Atual: {editingUser.balanceFiat.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <input 
                    type="number" 
                    step="0.01"
                    required 
                    className="w-full bg-dark-900 border border-dark-800 rounded-lg p-3 text-white font-mono text-lg focus:border-blue-500 outline-none transition-colors"
                    value={editBalances.fiat}
                    onChange={e => setEditBalances({...editBalances, fiat: e.target.value})}
                  />
                </div>

                {/* Crypto Edit */}
                <div className="bg-dark-950 p-4 rounded-xl border border-dark-800">
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-bold text-gold-500 flex items-center gap-1 uppercase">
                      <Coins size={12}/> Ativos ({CRYPTO_SYMBOL})
                    </label>
                    <span className="text-xs text-zinc-500">Saldo Atual: {editingUser.balanceCrypto.toFixed(4)}</span>
                  </div>
                  <input 
                    type="number" 
                    step="0.0001"
                    required 
                    className="w-full bg-dark-900 border border-dark-800 rounded-lg p-3 text-white font-mono text-lg focus:border-gold-500 outline-none transition-colors"
                    value={editBalances.crypto}
                    onChange={e => setEditBalances({...editBalances, crypto: e.target.value})}
                  />
                </div>
                
                <div className="pt-2">
                  <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-500 transition-colors uppercase tracking-wide text-sm">
                    Confirmar Alterações
                  </button>
                </div>
              </form>
           </div>
        </div>
      )}

    </div>
  );
};

export default AdminPanel;