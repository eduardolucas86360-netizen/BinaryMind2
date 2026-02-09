
import { 
  User, UserRole, KycStatus, MarketData, TrendType, Transaction, 
  AuditLog, TransactionType, StakingPosition 
} from '../types';
import { 
  INITIAL_MARKET_CAP_PRICE, NETWORK_LATENCY_MS, STAKING_YIELD_RATES 
} from '../constants';

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
    const admins: User[] = [{
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
    }];
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

export const runMarketEngine = async (): Promise<MarketData> => {
  const market = readDB<MarketData>(TBL_MARKET, {} as any);
  const now = Date.now();
  
  // LOGICA BEARISH REFINADA: 65% de chance de queda agressiva.
  const rand = Math.random();
  let volatility;
  if (rand > 0.35) {
    // Queda (Bearish): entre -1% e -7%
    volatility = -(Math.random() * 0.06 + 0.01);
  } else {
    // Alta (Bullish): entre +0.2% e +4%
    volatility = (Math.random() * 0.038 + 0.002);
  }
  
  market.currentPrice = Math.max(0.01, Number((market.currentPrice * (1 + volatility)).toFixed(2)));
  market.trend = volatility > 0 ? TrendType.BULLISH : TrendType.BEARISH;
  market.lastUpdated = now;
  market.priceHistory.push({ time: now, price: market.currentPrice });
  if (market.priceHistory.length > 80) market.priceHistory.shift();
  
  writeDB(TBL_MARKET, market);
  return market;
};

export const initializeBankingCore = () => {
  setInterval(() => runMarketEngine(), 10000);
};

export const buyCrypto = async (userId: string, amount: number, currentPrice: number) => {
  await networkDelay();
  const users = readDB<User[]>(TBL_USERS, []);
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error("Usuário não encontrado.");
  if (amount <= 0) throw new Error("Quantidade deve ser positiva.");

  const totalCost = amount * currentPrice;
  if (users[idx].balanceFiat < totalCost) throw new Error("Saldo Fiat insuficiente.");
  
  users[idx].balanceFiat -= totalCost;
  users[idx].balanceCrypto += amount;
  users[idx].transactions.unshift({
    id: `TX-${Math.random().toString(36).substr(2, 7).toUpperCase()}`,
    userId, type: TransactionType.BUY, amountFiat: totalCost, amountCrypto: amount,
    priceAtMoment: currentPrice, timestamp: Date.now(), description: `Compra de ${amount} ${amount === 1 ? 'MDC' : 'MDCs'}`
  });
  writeDB(TBL_USERS, users);
};

export const sellCrypto = async (userId: string, amount: number, currentPrice: number) => {
  await networkDelay();
  const users = readDB<User[]>(TBL_USERS, []);
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error("Usuário não encontrado.");
  if (amount <= 0) throw new Error("Quantidade deve ser positiva.");

  if (users[idx].balanceCrypto < amount) throw new Error("Saldo MDC insuficiente.");
  const totalGain = amount * currentPrice;
  
  users[idx].balanceFiat += totalGain;
  users[idx].balanceCrypto -= amount;
  users[idx].transactions.unshift({
    id: `TX-${Math.random().toString(36).substr(2, 7).toUpperCase()}`,
    userId, type: TransactionType.SELL, amountFiat: totalGain, amountCrypto: amount,
    priceAtMoment: currentPrice, timestamp: Date.now(), description: `Venda de ${amount} ${amount === 1 ? 'MDC' : 'MDCs'}`
  });
  writeDB(TBL_USERS, users);
};

export const transferFiat = async (senderId: string, recipientEmail: string, amount: number) => {
  await networkDelay();
  const users = readDB<User[]>(TBL_USERS, []);
  const senderIdx = users.findIndex(u => u.id === senderId);
  const recIdx = users.findIndex(u => u.email.toLowerCase() === recipientEmail.toLowerCase());
  if (senderIdx === -1 || recIdx === -1) throw new Error("Erro na transferência de fundos.");
  if (amount <= 0) throw new Error("Valor de transferência inválido.");

  if (users[senderIdx].balanceFiat < amount) throw new Error("Saldo insuficiente para transferência.");
  
  users[senderIdx].balanceFiat -= amount;
  users[recIdx].balanceFiat += amount;
  
  const txId = `TX-${Math.random().toString(36).substr(2, 7).toUpperCase()}`;
  users[senderIdx].transactions.unshift({ id: txId, userId: senderId, type: TransactionType.TRANSFER_OUT, amountFiat: amount, timestamp: Date.now(), description: `Envio para ${users[recIdx].name}` });
  users[recIdx].transactions.unshift({ id: txId, userId: users[recIdx].id, type: TransactionType.TRANSFER_IN, amountFiat: amount, timestamp: Date.now(), description: `Recebido de ${users[senderIdx].name}` });
  writeDB(TBL_USERS, users);
  return { txId };
};

export const registerUser = async (name: string, email: string, passwordHash: string) => {
  const users = readDB<User[]>(TBL_USERS, []);
  if (users.find(u => u.email === email)) throw new Error("Credencial já vinculada ao servidor.");
  const newUser: User = {
    id: `U-${Date.now().toString().slice(-6)}`, name, email, passwordHash, role: UserRole.USER, balanceFiat: 0, balanceCrypto: 0,
    creditCard: { limit: 0, invoice: 0, dueDate: 0 }, kycStatus: KycStatus.UNVERIFIED, transactions: [], staking: [], notifications: [], achievements: [], settings: { theme: 'binary', highContrast: false, largeText: false }, isBlocked: false
  };
  users.push(newUser);
  writeDB(TBL_USERS, users);
  localStorage.setItem(TBL_SESSION, newUser.id);
  return newUser;
};

export const login = async (email: string, password: string): Promise<User> => {
  const users = readDB<User[]>(TBL_USERS, []);
  const user = users.find(u => u.email === email && u.passwordHash === password);
  if (!user) throw new Error("Falha na autenticação central.");
  localStorage.setItem(TBL_SESSION, user.id);
  return user;
};

export const getCurrentUser = async (): Promise<User | null> => {
  const id = localStorage.getItem(TBL_SESSION);
  if (!id) return null;
  const users = readDB<User[]>(TBL_USERS, []);
  return users.find(u => u.id === id) || null;
};

export const logout = async () => localStorage.removeItem(TBL_SESSION);

export const startStaking = async (uId: string, amt: number, dur: number) => {
  const users = readDB<User[]>(TBL_USERS, []);
  const idx = users.findIndex(u => u.id === uId);
  if (idx === -1) throw new Error("Usuário não encontrado.");
  if (amt <= 0) throw new Error("Quantidade inválida.");
  if (users[idx].balanceCrypto < amt) throw new Error("Saldo MDC insuficiente.");
  
  const yieldRate = (STAKING_YIELD_RATES as any)[dur] || 0.05;
  const reward = amt * yieldRate;

  users[idx].balanceCrypto -= amt;
  const stakeId = `STK-${Date.now()}`;
  
  users[idx].staking.push({ 
    id: stakeId, 
    amount: amt, 
    startDate: Date.now(), 
    durationHours: dur, 
    potentialReward: reward, 
    active: true 
  });

  users[idx].transactions.unshift({
    id: `TX-STK-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
    userId: uId,
    type: TransactionType.STAKE,
    amountCrypto: amt,
    timestamp: Date.now(),
    description: `Staking iniciado: ${amt} MDC (${dur}h)`
  });

  writeDB(TBL_USERS, users);
};

export const getAdminData = async () => ({ users: readDB<User[]>(TBL_USERS, []), audits: readDB<AuditLog[]>(TBL_AUDIT, []) });
export const factoryResetSystem = () => { localStorage.clear(); initializeDB(); };
export const generateSystemDump = () => JSON.stringify(readDB(TBL_USERS, []), null, 2);

export const getPublicDirectory = async (excludeId?: string) => {
  const users = readDB<User[]>(TBL_USERS, []);
  return users.filter(u => u.id !== excludeId).map(u => ({
    id: u.id, name: u.name, email: u.email, kycVerified: u.kycStatus === KycStatus.VERIFIED, isOnline: true
  }));
};

export const submitKyc = async (uId: string, data: any) => {
  const users = readDB<User[]>(TBL_USERS, []);
  const idx = users.findIndex(u => u.id === uId);
  if (idx !== -1) { 
    users[idx].kycStatus = KycStatus.PENDING; 
    users[idx].kycData = data;
    writeDB(TBL_USERS, users); 
  }
};

export const getRankings = async () => {
  const users = readDB<User[]>(TBL_USERS, []);
  const bal = [...users].sort((a,b) => b.balanceCrypto - a.balanceCrypto).map((u, i) => ({ userId: u.id, displayName: u.name, value: u.balanceCrypto, position: i+1 }));
  return { balanceRanking: bal, volumeRanking: [] };
};

export const adminUpdateUser = async (aId: string, uId: string, up: any) => {
  const users = readDB<User[]>(TBL_USERS, []);
  const idx = users.findIndex(u => u.id === uId);
  if (idx !== -1) { users[idx] = { ...users[idx], ...up }; writeDB(TBL_USERS, users); }
};

export const adminAdjustBalance = async (aId: string, uId: string, f: number, c: number) => {
  const users = readDB<User[]>(TBL_USERS, []);
  const idx = users.findIndex(u => u.id === uId);
  if (idx !== -1) { users[idx].balanceFiat = f; users[idx].balanceCrypto = c; writeDB(TBL_USERS, users); }
};

export const adminApproveKyc = async (aId: string, uId: string) => {
  const users = readDB<User[]>(TBL_USERS, []);
  const idx = users.findIndex(u => u.id === uId);
  if (idx !== -1) { users[idx].kycStatus = KycStatus.VERIFIED; writeDB(TBL_USERS, users); }
};

export const adminCreateUser = async (aId: string, data: any) => registerUser(data.name, data.email, data.passwordHash);
