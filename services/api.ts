
import { 
  User, UserRole, KycStatus, MarketData, TrendType, Transaction, 
  AuditLog, TransactionType, StakingPosition 
} from '../types';
import { 
  INITIAL_MARKET_CAP_PRICE, NETWORK_LATENCY_MS, STAKING_YIELD_RATES 
} from '../constants';

/**
 * BINARYMIND CENTRAL BANKING CORE (CBC)
 * Gerenciador de Estado Global e Persistência Atômica.
 */

const TBL_USERS = 'binarymind_ledger_v1';
const TBL_MARKET = 'binarymind_market_v1';
const TBL_AUDIT = 'binarymind_audit_v1';
const TBL_SESSION = 'binarymind_auth_token';

const readDB = <T>(key: string, defaultVal: T): T => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultVal;
};

const writeDB = (key: string, val: any) => {
  localStorage.setItem(key, JSON.stringify(val));
  window.dispatchEvent(new Event('storage_update'));
};

const networkDelay = () => new Promise(resolve => setTimeout(resolve, NETWORK_LATENCY_MS));

export const initializeDB = () => {
  let users = readDB<User[]>(TBL_USERS, []);

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
      }
    ];
    writeDB(TBL_USERS, admins);
  }

  if (!localStorage.getItem(TBL_MARKET)) {
    const initialMarket: MarketData = {
      currentPrice: INITIAL_MARKET_CAP_PRICE,
      lastUpdated: Date.now(),
      trend: TrendType.SIDEWAYS,
      priceHistory: [{ time: Date.now(), price: INITIAL_MARKET_CAP_PRICE }]
    };
    writeDB(TBL_MARKET, initialMarket);
  }
};

export const getPublicDirectory = async (excludeId?: string) => {
  const users = readDB<User[]>(TBL_USERS, []);
  return users
    .filter(u => u.id !== excludeId)
    .map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      kycVerified: u.kycStatus === KycStatus.VERIFIED,
      isOnline: true
    }));
};

export const transferFiat = async (senderId: string, recipientEmail: string, amount: number) => {
  await networkDelay();
  const users = readDB<User[]>(TBL_USERS, []);
  const senderIdx = users.findIndex(u => u.id === senderId);
  const recIdx = users.findIndex(u => u.email.toLowerCase() === recipientEmail.toLowerCase());

  if (senderIdx === -1) throw new Error("Origem não identificada.");
  if (recIdx === -1) throw new Error("Destinatário inexistente na rede.");
  if (senderId === users[recIdx].id) throw new Error("Operação inválida.");
  if (users[senderIdx].balanceFiat < amount) throw new Error("Saldo insuficiente.");

  const txId = `TX-${Math.random().toString(36).substr(2, 7).toUpperCase()}`;
  
  users[senderIdx].balanceFiat -= amount;
  users[senderIdx].transactions.unshift({
    id: txId,
    userId: senderId,
    type: TransactionType.TRANSFER_OUT,
    amountFiat: amount,
    timestamp: Date.now(),
    description: `Envio para ${users[recIdx].name}`,
    relatedUserEmail: recipientEmail
  });

  users[recIdx].balanceFiat += amount;
  users[recIdx].transactions.unshift({
    id: txId,
    userId: users[recIdx].id,
    type: TransactionType.TRANSFER_IN,
    amountFiat: amount,
    timestamp: Date.now(),
    description: `Recebido de ${users[senderIdx].name}`,
    relatedUserEmail: users[senderIdx].email
  });

  writeDB(TBL_USERS, users);
  return { txId };
};

export const registerUser = async (name: string, email: string, passwordHash: string) => {
  await networkDelay();
  const users = readDB<User[]>(TBL_USERS, []);
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) throw new Error("ID já existe.");

  const newUser: User = {
    id: `U-${Math.floor(100000 + Math.random() * 900000)}`,
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
    notifications: [{
      id: 'welcome',
      title: 'Conexão Estabelecida',
      message: 'Bem-vindo ao servidor central. Sua conta está ativa.',
      timestamp: Date.now(),
      read: false
    }],
    achievements: [],
    settings: { theme: 'binary', highContrast: false, largeText: false },
    isBlocked: false
  };

  users.push(newUser);
  writeDB(TBL_USERS, users);
  localStorage.setItem(TBL_SESSION, newUser.id);
  return newUser;
};

export const login = async (email: string, password: string): Promise<User> => {
  await networkDelay();
  const users = readDB<User[]>(TBL_USERS, []);
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === password);
  if (!user) throw new Error("Dados incorretos.");
  localStorage.setItem(TBL_SESSION, user.id);
  return user;
};

export const getCurrentUser = async (): Promise<User | null> => {
  const id = localStorage.getItem(TBL_SESSION);
  if (!id) return null;
  const users = readDB<User[]>(TBL_USERS, []);
  return users.find(u => u.id === id) || null;
};

export const logout = async () => {
  localStorage.removeItem(TBL_SESSION);
};

export const runMarketEngine = async (): Promise<MarketData> => {
  const market = readDB<MarketData>(TBL_MARKET, {} as any);
  const now = Date.now();
  
  // LOGICA SOLICITADA: Cripto diminui mais do que aumenta
  // Range de -0.04 a +0.02 (Tendência negativa de 2% média por ciclo)
  const volatility = (Math.random() * 0.06) - 0.04; 
  
  market.currentPrice = Math.max(0.10, Number((market.currentPrice * (1 + volatility)).toFixed(2)));
  market.trend = volatility > 0 ? TrendType.BULLISH : TrendType.BEARISH;
  market.lastUpdated = now;
  market.priceHistory.push({ time: now, price: market.currentPrice });
  
  if (market.priceHistory.length > 50) market.priceHistory.shift();
  
  writeDB(TBL_MARKET, market);
  return market;
};

export const initializeBankingCore = () => {
  // Atualiza o mercado a cada 10 segundos para dinamismo
  setInterval(() => runMarketEngine(), 10000);
};

export const buyCrypto = async (userId: string, amount: number, currentPrice: number) => {
  await networkDelay();
  const users = readDB<User[]>(TBL_USERS, []);
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error("Usuário não encontrado.");
  
  const totalCost = amount * currentPrice;
  if (users[idx].balanceFiat < totalCost) throw new Error("Saldo insuficiente.");

  users[idx].balanceFiat -= totalCost;
  users[idx].balanceCrypto += amount;
  users[idx].transactions.unshift({
    id: `TX-${Math.random().toString(36).substr(2, 7).toUpperCase()}`,
    userId,
    type: TransactionType.BUY,
    amountFiat: totalCost,
    amountCrypto: amount,
    priceAtMoment: currentPrice,
    timestamp: Date.now(),
    description: `Compra de ${amount} MDC`
  });

  writeDB(TBL_USERS, users);
};

export const sellCrypto = async (userId: string, amount: number, currentPrice: number) => {
  await networkDelay();
  const users = readDB<User[]>(TBL_USERS, []);
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error("Usuário não encontrado.");
  
  if (users[idx].balanceCrypto < amount) throw new Error("MDC insuficiente.");

  const totalGain = amount * currentPrice;
  users[idx].balanceFiat += totalGain;
  users[idx].balanceCrypto -= amount;
  users[idx].transactions.unshift({
    id: `TX-${Math.random().toString(36).substr(2, 7).toUpperCase()}`,
    userId,
    type: TransactionType.SELL,
    amountFiat: totalGain,
    amountCrypto: amount,
    priceAtMoment: currentPrice,
    timestamp: Date.now(),
    description: `Venda de ${amount} MDC`
  });

  writeDB(TBL_USERS, users);
};

export const startStaking = async (userId: string, amount: number, durationHours: number) => {
  await networkDelay();
  const users = readDB<User[]>(TBL_USERS, []);
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error("Usuário não encontrado.");
  if (users[idx].balanceCrypto < amount) throw new Error("Saldo insuficiente.");
  
  const yieldRate = (STAKING_YIELD_RATES as any)[durationHours] || 0;
  const reward = amount * yieldRate;

  users[idx].balanceCrypto -= amount;
  users[idx].staking.unshift({
    id: `STK-${Date.now()}`,
    amount,
    startDate: Date.now(),
    durationHours,
    potentialReward: reward,
    active: true
  });

  writeDB(TBL_USERS, users);
};

export const submitKyc = async (userId: string, data: { fullName: string, docId: string }) => {
  await networkDelay();
  const users = readDB<User[]>(TBL_USERS, []);
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error("Usuário não encontrado.");
  users[idx].kycStatus = KycStatus.PENDING;
  users[idx].kycData = { ...data, dob: '' };
  writeDB(TBL_USERS, users);
};

export const getRankings = async () => {
  const users = readDB<User[]>(TBL_USERS, []);
  const balanceRanking = [...users]
    .sort((a, b) => b.balanceCrypto - a.balanceCrypto)
    .map((u, i) => ({ userId: u.id, displayName: u.name, value: u.balanceCrypto, position: i + 1 }));
  return { balanceRanking, volumeRanking: [] };
};

export const getAdminData = async () => ({
  users: readDB<User[]>(TBL_USERS, []),
  audits: readDB<AuditLog[]>(TBL_AUDIT, [])
});

export const adminAdjustBalance = async (adminId: string, userId: string, fiat: number, crypto: number) => {
  const users = readDB<User[]>(TBL_USERS, []);
  const idx = users.findIndex(u => u.id === userId);
  if (idx !== -1) {
    users[idx].balanceFiat = fiat;
    users[idx].balanceCrypto = crypto;
    writeDB(TBL_USERS, users);
  }
};

export const adminUpdateUser = async (adminId: string, userId: string, updates: Partial<User>) => {
  const users = readDB<User[]>(TBL_USERS, []);
  const idx = users.findIndex(u => u.id === userId);
  if (idx !== -1) {
    users[idx] = { ...users[idx], ...updates };
    writeDB(TBL_USERS, users);
  }
};

export const adminApproveKyc = async (adminId: string, targetId: string) => {
  const users = readDB<User[]>(TBL_USERS, []);
  const idx = users.findIndex(u => u.id === targetId);
  if (idx !== -1) {
    users[idx].kycStatus = KycStatus.VERIFIED;
    writeDB(TBL_USERS, users);
  }
};

export const adminCreateUser = async (adminId: string, data: any) => {
  const users = readDB<User[]>(TBL_USERS, []);
  const newUser = { ...data, id: `U-${Date.now().toString().slice(-6)}`, role: UserRole.USER, balanceCrypto: 0, kycStatus: KycStatus.UNVERIFIED, transactions: [], staking: [], notifications: [], achievements: [], settings: { theme: 'binary' }, isBlocked: false, creditCard: { limit: 0, invoice: 0, dueDate: 0 } };
  users.push(newUser);
  writeDB(TBL_USERS, users);
  return newUser;
};

export const factoryResetSystem = () => {
  localStorage.clear();
  initializeDB();
};

export const generateSystemDump = () => JSON.stringify(readDB(TBL_USERS, []), null, 2);
