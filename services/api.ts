
import { 
  User, UserRole, KycStatus, MarketData, TrendType, Transaction, 
  AuditLog, TransactionType, StakingPosition 
} from '../types';
import { 
  INITIAL_MARKET_CAP_PRICE, MAX_VOLATILITY_INDEX, MARKET_UPDATE_INTERVAL_MS, 
  NETWORK_LATENCY_MS, STAKING_YIELD_RATES 
} from '../constants';

/**
 * BINARYMIND CORE BANKING ENGINE
 * Este arquivo atua como o Back-end e a Camada de Dados (Database).
 * As informações são persistidas no LocalStorage do navegador.
 */

const TBL_USERS = 'binarymind_ledger_v1';
const TBL_MARKET = 'binarymind_market_v1';
const TBL_AUDIT = 'binarymind_audit_v1';
const TBL_SESSION = 'binarymind_auth_token';

// --- DATABASE ENGINE (INTERNAL) ---

const getTable = <T>(key: string, defaultVal: T): T => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultVal;
};

const commitTable = (key: string, val: any) => {
  localStorage.setItem(key, JSON.stringify(val));
};

const networkDelay = () => new Promise(resolve => setTimeout(resolve, NETWORK_LATENCY_MS));

// --- INITIALIZATION ---

export const initializeDB = () => {
  let users = getTable<User[]>(TBL_USERS, []);

  // Se o banco estiver vazio, criamos os administradores e o mercado inicial
  if (users.length === 0) {
    const admins: User[] = [
      {
        id: 'adm-001',
        name: 'Eduardo Lucas',
        email: 'eduardolucas86360@gmail.com',
        passwordHash: 'Edubr123@',
        role: UserRole.ADMIN,
        balanceFiat: 1000000.00,
        balanceCrypto: 1000,
        creditCard: { limit: 50000, invoice: 0, dueDate: Date.now() },
        kycStatus: KycStatus.VERIFIED,
        transactions: [],
        staking: [],
        notifications: [],
        achievements: [],
        settings: { theme: 'binary', highContrast: false, largeText: false },
        isBlocked: false
      },
      {
        id: 'adm-002',
        name: 'BinaryMind Admin',
        email: 'BinaryMind@gmail.com',
        passwordHash: '010010',
        role: UserRole.ADMIN,
        balanceFiat: 1000000.00,
        balanceCrypto: 1000,
        creditCard: { limit: 50000, invoice: 0, dueDate: Date.now() },
        kycStatus: KycStatus.VERIFIED,
        transactions: [],
        staking: [],
        notifications: [],
        achievements: [],
        settings: { theme: 'binary', highContrast: false, largeText: false },
        isBlocked: false
      }
    ];
    commitTable(TBL_USERS, admins);
  }

  const market = getTable<MarketData | null>(TBL_MARKET, null);
  if (!market) {
    const initialMarket: MarketData = {
      currentPrice: INITIAL_MARKET_CAP_PRICE,
      lastUpdated: Date.now(),
      trend: TrendType.SIDEWAYS,
      priceHistory: [{ time: Date.now(), price: INITIAL_MARKET_CAP_PRICE }]
    };
    commitTable(TBL_MARKET, initialMarket);
  }
};

// --- API SERVICES ---

export const initializeBankingCore = () => {
  // Motor de serviços em background (Market, Staking, etc)
  setInterval(async () => {
    await runMarketEngine();
  }, 30000); // Atualiza mercado a cada 30s
};

export const login = async (email: string, password: string): Promise<User> => {
  await networkDelay();
  const users = getTable<User[]>(TBL_USERS, []);
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === password);
  
  if (!user) throw new Error("Credenciais inválidas.");
  if (user.isBlocked) throw new Error("Conta bloqueada pela administração.");
  
  localStorage.setItem(TBL_SESSION, user.id);
  return user;
};

export const registerUser = async (name: string, email: string, passwordHash: string) => {
  await networkDelay();
  const users = getTable<User[]>(TBL_USERS, []);
  if (users.find(u => u.email === email)) throw new Error("E-mail já cadastrado.");

  const newUser: User = {
    id: `u-${Date.now()}`,
    name,
    email,
    passwordHash,
    role: UserRole.USER,
    balanceFiat: 0,
    balanceCrypto: 0,
    creditCard: { limit: 0, invoice: 0, dueDate: 0 },
    kycStatus: KycStatus.UNVERIFIED,
    transactions: [],
    staking: [],
    notifications: [],
    achievements: [],
    settings: { theme: 'binary', highContrast: false, largeText: false },
    isBlocked: false
  };

  users.push(newUser);
  commitTable(TBL_USERS, users);
  localStorage.setItem(TBL_SESSION, newUser.id);
  return newUser;
};

export const getCurrentUser = async (): Promise<User | null> => {
  const id = localStorage.getItem(TBL_SESSION);
  if (!id) return null;
  const users = getTable<User[]>(TBL_USERS, []);
  return users.find(u => u.id === id) || null;
};

export const logout = async () => {
  localStorage.removeItem(TBL_SESSION);
};

export const runMarketEngine = async (): Promise<MarketData> => {
  const market = getTable<MarketData>(TBL_MARKET, {} as any);
  const now = Date.now();

  const volatility = (Math.random() * 0.04) - 0.02; // +/- 2%
  market.currentPrice = Number((market.currentPrice * (1 + volatility)).toFixed(2));
  market.lastUpdated = now;
  market.priceHistory.push({ time: now, price: market.currentPrice });
  
  if (market.priceHistory.length > 50) market.priceHistory.shift();
  
  commitTable(TBL_MARKET, market);
  return market;
};

// --- ADMIN & LEDGER SERVICES ---

export const getAdminData = async () => {
  await networkDelay();
  const users = getTable<User[]>(TBL_USERS, []);
  const audits = getTable<AuditLog[]>(TBL_AUDIT, []);
  return { users, audits };
};

export const adminAdjustBalance = async (adminId: string, targetId: string, fiat: number, crypto: number) => {
  await networkDelay();
  const users = getTable<User[]>(TBL_USERS, []);
  const idx = users.findIndex(u => u.id === targetId);
  if (idx === -1) throw new Error("Usuário não encontrado.");

  users[idx].balanceFiat = fiat;
  users[idx].balanceCrypto = crypto;

  const audits = getTable<AuditLog[]>(TBL_AUDIT, []);
  audits.unshift({
    id: `audit-${Date.now()}`,
    timestamp: Date.now(),
    adminId,
    action: 'BALANCE_ADJUST',
    targetUserId: targetId,
    details: `Ajuste manual: Fiat ${fiat}, Crypto ${crypto}`
  });

  commitTable(TBL_USERS, users);
  commitTable(TBL_AUDIT, audits);
  return users;
};

export const adminCreateUser = async (adminId: string, data: { name: string, email: string, passwordHash: string, balanceFiat: number }) => {
  await networkDelay();
  const users = getTable<User[]>(TBL_USERS, []);
  if (users.find(u => u.email.toLowerCase() === data.email.toLowerCase())) throw new Error("E-mail já cadastrado.");

  const newUser: User = {
    id: `u-${Date.now()}`,
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
    role: UserRole.USER,
    balanceFiat: data.balanceFiat,
    balanceCrypto: 0,
    creditCard: { limit: 0, invoice: 0, dueDate: 0 },
    kycStatus: KycStatus.UNVERIFIED,
    transactions: [],
    staking: [],
    notifications: [],
    achievements: [],
    settings: { theme: 'binary', highContrast: false, largeText: false },
    isBlocked: false
  };

  users.push(newUser);
  commitTable(TBL_USERS, users);

  const audits = getTable<AuditLog[]>(TBL_AUDIT, []);
  audits.unshift({
    id: `audit-${Date.now()}`,
    timestamp: Date.now(),
    adminId,
    action: 'USER_CREATE',
    targetUserId: newUser.id,
    details: `Criação manual de conta para ${data.email} com saldo ${data.balanceFiat}`
  });
  commitTable(TBL_AUDIT, audits);
  return newUser;
};

export const adminUpdateUser = async (adminId: string, targetId: string, updates: Partial<User>) => {
  const users = getTable<User[]>(TBL_USERS, []);
  const idx = users.findIndex(u => u.id === targetId);
  users[idx] = { ...users[idx], ...updates };
  commitTable(TBL_USERS, users);
  return users;
};

export const adminApproveKyc = async (adminId: string, targetId: string) => {
  const users = getTable<User[]>(TBL_USERS, []);
  const idx = users.findIndex(u => u.id === targetId);
  users[idx].kycStatus = KycStatus.VERIFIED;
  
  // Opcional: Notificar o usuário que ele foi aprovado
  users[idx].notifications.unshift({
    id: `kyc-approved-${Date.now()}`,
    title: '✅ KYC Aprovado',
    message: 'Sua conta foi verificada com sucesso. Todos os limites foram liberados.',
    timestamp: Date.now(),
    read: false
  });

  commitTable(TBL_USERS, users);
};

export const factoryResetSystem = () => {
  localStorage.clear();
  initializeDB();
};

export const generateSystemDump = () => {
  return JSON.stringify({
    users: getTable(TBL_USERS, []),
    market: getTable(TBL_MARKET, {}),
    audits: getTable(TBL_AUDIT, [])
  }, null, 2);
};

// --- RANKING SERVICES ---

export const getRankings = async () => {
  await networkDelay();
  const users = getTable<User[]>(TBL_USERS, []);
  
  const balanceRanking = [...users]
    .sort((a, b) => b.balanceCrypto - a.balanceCrypto)
    .map((u, index) => ({
      position: index + 1,
      displayName: u.name.split(' ')[0] + (u.name.split(' ').length > 1 ? ` ${u.name.split(' ')[1][0]}.` : ''),
      value: u.balanceCrypto,
      userId: u.id
    }));

  const volumeRanking = users.map(u => {
    const totalVolume = u.transactions
      .filter(tx => tx.type === TransactionType.BUY || tx.type === TransactionType.SELL)
      .reduce((acc, tx) => acc + (tx.amountFiat || 0), 0);
    
    return {
      userId: u.id,
      displayName: u.name.split(' ')[0] + (u.name.split(' ').length > 1 ? ` ${u.name.split(' ')[1][0]}.` : ''),
      value: totalVolume
    };
  })
  .sort((a, b) => b.value - a.value)
  .map((u, index) => ({
    position: index + 1,
    ...u
  }));

  return { balanceRanking, volumeRanking };
};

// Outros métodos delegados para simplificar
export const transferFiat = async (senderId: string, email: string, amount: number) => {
  const users = getTable<User[]>(TBL_USERS, []);
  const senderIdx = users.findIndex(u => u.id === senderId);
  const recIdx = users.findIndex(u => u.email === email);
  if (recIdx === -1) throw new Error("Destinatário não existe.");
  if (users[senderIdx].balanceFiat < amount) throw new Error("Saldo insuficiente.");

  users[senderIdx].balanceFiat -= amount;
  users[recIdx].balanceFiat += amount;
  
  const tx = { id: `tx-${Date.now()}`, timestamp: Date.now(), amountFiat: amount, description: `Transferência para ${email}` };
  users[senderIdx].transactions.unshift({ ...tx, type: TransactionType.TRANSFER_OUT, userId: senderId });
  users[recIdx].transactions.unshift({ ...tx, type: TransactionType.TRANSFER_IN, userId: users[recIdx].id, description: `Recebido de ${users[senderIdx].email}` });

  commitTable(TBL_USERS, users);
};

export const buyCrypto = async (userId: string, amount: number, price: number) => {
  const users = getTable<User[]>(TBL_USERS, []);
  const idx = users.findIndex(u => u.id === userId);
  const cost = amount * price;
  if (users[idx].balanceFiat < cost) throw new Error("Saldo fiat insuficiente.");

  users[idx].balanceFiat -= cost;
  users[idx].balanceCrypto += amount;
  users[idx].transactions.unshift({
    id: `tx-${Date.now()}`,
    userId,
    type: TransactionType.BUY,
    amountFiat: cost,
    amountCrypto: amount,
    priceAtMoment: price,
    timestamp: Date.now(),
    description: `Compra de ${amount} MDC`
  });
  commitTable(TBL_USERS, users);
};

export const sellCrypto = async (userId: string, amount: number, price: number) => {
  const users = getTable<User[]>(TBL_USERS, []);
  const idx = users.findIndex(u => u.id === userId);
  if (users[idx].balanceCrypto < amount) throw new Error("Saldo crypto insuficiente.");

  const gain = amount * price;
  users[idx].balanceCrypto -= amount;
  users[idx].balanceFiat += gain;
  users[idx].transactions.unshift({
    id: `tx-${Date.now()}`,
    userId,
    type: TransactionType.SELL,
    amountFiat: gain,
    amountCrypto: amount,
    priceAtMoment: price,
    timestamp: Date.now(),
    description: `Venda de ${amount} MDC`
  });
  commitTable(TBL_USERS, users);
};

export const startStaking = async (userId: string, amount: number, hours: number) => {
  const users = getTable<User[]>(TBL_USERS, []);
  const idx = users.findIndex(u => u.id === userId);
  if (users[idx].balanceCrypto < amount) throw new Error("Saldo insuficiente.");

  users[idx].balanceCrypto -= amount;
  users[idx].staking.push({
    id: `stk-${Date.now()}`,
    amount,
    startDate: Date.now(),
    durationHours: hours,
    potentialReward: amount * (hours === 24 ? 0.05 : hours === 72 ? 0.08 : 0.16),
    active: true
  });
  commitTable(TBL_USERS, users);
};

export const submitKyc = async (userId: string, data: any) => {
  await networkDelay();
  const users = getTable<User[]>(TBL_USERS, []);
  const idx = users.findIndex(u => u.id === userId);
  
  if (idx === -1) return;

  const targetUser = users[idx];
  targetUser.kycStatus = KycStatus.PENDING;
  targetUser.kycData = data;

  // --- LÓGICA DE NOTIFICAÇÃO AUTOMÁTICA PARA ADMINS ---
  users.forEach(u => {
    if (u.role === UserRole.ADMIN) {
      u.notifications.unshift({
        id: `kyc-alert-${Date.now()}-${targetUser.id}`,
        title: '⚠️ Alerta de Compliance: Novo KYC',
        message: `O usuário ${targetUser.name} (${targetUser.email}) enviou documentos para análise de identidade. Verifique no painel administrativo.`,
        timestamp: Date.now(),
        read: false
      });
    }
  });

  commitTable(TBL_USERS, users);
};
