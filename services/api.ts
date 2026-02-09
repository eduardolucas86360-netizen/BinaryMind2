
import { 
  User, UserRole, KycStatus, MarketData, TrendType, Transaction, 
  AuditLog, TransactionType, StakingPosition 
} from '../types';
import { 
  INITIAL_MARKET_CAP_PRICE, NETWORK_LATENCY_MS 
} from '../constants';

/**
 * BINARYMIND CENTRAL BANKING CORE (CBC)
 * Este é o "Servidor" da aplicação. Ele gerencia o estado global e a persistência.
 */

const TBL_USERS = 'binarymind_ledger_v1';
const TBL_MARKET = 'binarymind_market_v1';
const TBL_AUDIT = 'binarymind_audit_v1';
const TBL_SESSION = 'binarymind_auth_token';

// --- SERVER-SIDE DATABASE ENGINE ---

const readDB = <T>(key: string, defaultVal: T): T => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultVal;
};

const writeDB = (key: string, val: any) => {
  localStorage.setItem(key, JSON.stringify(val));
  // Dispara evento global para que todas as abas e componentes saibam da mudança instantaneamente
  window.dispatchEvent(new Event('storage_update'));
};

const networkDelay = () => new Promise(resolve => setTimeout(resolve, NETWORK_LATENCY_MS));

// --- CORE SERVER SERVICES ---

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

/** 
 * Retorna todos os usuários registrados para interação pública (Diretório do Banco)
 */
export const getPublicDirectory = async (excludeId?: string) => {
  const users = readDB<User[]>(TBL_USERS, []);
  return users
    .filter(u => u.id !== excludeId)
    .map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      kycVerified: u.kycStatus === KycStatus.VERIFIED
    }));
};

export const runMarketEngine = async (): Promise<MarketData> => {
  const market = readDB<MarketData>(TBL_MARKET, {} as any);
  const now = Date.now();
  
  const volatility = (Math.random() * 0.04) - 0.02;
  market.currentPrice = Number((market.currentPrice * (1 + volatility)).toFixed(2));
  market.lastUpdated = now;
  market.priceHistory.push({ time: now, price: market.currentPrice });
  
  if (market.priceHistory.length > 50) market.priceHistory.shift();
  
  writeDB(TBL_MARKET, market);
  return market;
};

// --- TRANSACTIONAL ENGINE (ATOMIC OPERATIONS) ---

export const transferFiat = async (senderId: string, recipientEmail: string, amount: number) => {
  await networkDelay();
  
  const users = readDB<User[]>(TBL_USERS, []);
  const senderIdx = users.findIndex(u => u.id === senderId);
  const recIdx = users.findIndex(u => u.email.toLowerCase() === recipientEmail.toLowerCase());

  if (senderIdx === -1) throw new Error("Usuário não autenticado.");
  if (recIdx === -1) throw new Error("Destinatário não encontrado na base de dados do banco.");
  if (senderId === users[recIdx].id) throw new Error("Você não pode enviar dinheiro para si mesmo.");
  if (users[senderIdx].balanceFiat < amount) throw new Error("Saldo insuficiente na conta corrente.");
  if (amount <= 0) throw new Error("Valor de transferência inválido.");

  const txId = `TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  // Débito Atômico
  users[senderIdx].balanceFiat -= amount;
  users[senderIdx].transactions.unshift({
    id: txId,
    userId: senderId,
    type: TransactionType.TRANSFER_OUT,
    amountFiat: amount,
    timestamp: Date.now(),
    description: `Transferência enviada para ${users[recIdx].name}`,
    relatedUserEmail: recipientEmail
  });

  // Crédito Atômico
  users[recIdx].balanceFiat += amount;
  users[recIdx].transactions.unshift({
    id: txId,
    userId: users[recIdx].id,
    type: TransactionType.TRANSFER_IN,
    amountFiat: amount,
    timestamp: Date.now(),
    description: `Transferência recebida de ${users[senderIdx].name}`,
    relatedUserEmail: users[senderIdx].email
  });

  // Notificação push em tempo real
  users[recIdx].notifications.unshift({
    id: `NOT-${Date.now()}`,
    title: '💰 Pagamento Recebido!',
    message: `${users[senderIdx].name} te enviou B$ ${amount.toLocaleString('pt-BR')}. O saldo já está disponível.`,
    timestamp: Date.now(),
    read: false
  });

  writeDB(TBL_USERS, users);
  return { txId, success: true };
};

export const buyCrypto = async (userId: string, amount: number, price: number) => {
  await networkDelay();
  const users = readDB<User[]>(TBL_USERS, []);
  const idx = users.findIndex(u => u.id === userId);
  const cost = amount * price;

  if (users[idx].balanceFiat < cost) throw new Error("Saldo insuficiente.");

  users[idx].balanceFiat -= cost;
  users[idx].balanceCrypto += amount;
  users[idx].transactions.unshift({
    id: `BUY-${Date.now()}`,
    userId,
    type: TransactionType.BUY,
    amountFiat: cost,
    amountCrypto: amount,
    priceAtMoment: price,
    timestamp: Date.now(),
    description: `Câmbio: Compra de ${amount} MDC`
  });

  writeDB(TBL_USERS, users);
};

export const sellCrypto = async (userId: string, amount: number, price: number) => {
  await networkDelay();
  const users = readDB<User[]>(TBL_USERS, []);
  const idx = users.findIndex(u => u.id === userId);
  const gain = amount * price;

  if (users[idx].balanceCrypto < amount) throw new Error("Saldo de ativos insuficiente.");

  users[idx].balanceCrypto -= amount;
  users[idx].balanceFiat += gain;
  users[idx].transactions.unshift({
    id: `SELL-${Date.now()}`,
    userId,
    type: TransactionType.SELL,
    amountFiat: gain,
    amountCrypto: amount,
    priceAtMoment: price,
    timestamp: Date.now(),
    description: `Câmbio: Venda de ${amount} MDC`
  });

  writeDB(TBL_USERS, users);
};

// --- AUTH & USER SERVICES ---

export const login = async (email: string, password: string): Promise<User> => {
  await networkDelay();
  const users = readDB<User[]>(TBL_USERS, []);
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === password);
  
  if (!user) throw new Error("E-mail ou senha incorretos.");
  if (user.isBlocked) throw new Error("Esta conta está temporariamente suspensa.");
  
  localStorage.setItem(TBL_SESSION, user.id);
  return user;
};

export const registerUser = async (name: string, email: string, passwordHash: string) => {
  await networkDelay();
  const users = readDB<User[]>(TBL_USERS, []);
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) throw new Error("Este e-mail já está em uso na rede.");

  const newUser: User = {
    id: `U-${Math.floor(Math.random() * 900000 + 100000)}`,
    name,
    email,
    passwordHash,
    role: UserRole.USER,
    balanceFiat: 0, // Novo padrão: todos começam com saldo zero
    balanceCrypto: 0,
    creditCard: { limit: 0, invoice: 0, dueDate: 0 },
    kycStatus: KycStatus.UNVERIFIED,
    transactions: [],
    staking: [],
    notifications: [{
      id: 'welcome',
      title: 'Bem-vindo ao Banco BinaryMind!',
      message: 'Sua conta foi criada em tempo real. Agora você faz parte da nossa rede global.',
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

export const getCurrentUser = async (): Promise<User | null> => {
  const id = localStorage.getItem(TBL_SESSION);
  if (!id) return null;
  const users = readDB<User[]>(TBL_USERS, []);
  return users.find(u => u.id === id) || null;
};

export const logout = async () => {
  localStorage.removeItem(TBL_SESSION);
};

export const getRankings = async () => {
  const users = readDB<User[]>(TBL_USERS, []);
  const balanceRanking = [...users].sort((a, b) => b.balanceCrypto - a.balanceCrypto).map((u, i) => ({
    position: i + 1, displayName: u.name, value: u.balanceCrypto, userId: u.id
  }));
  const volumeRanking = users.map(u => ({
    userId: u.id, displayName: u.name, value: u.transactions.reduce((acc, tx) => acc + (tx.amountFiat || 0), 0)
  })).sort((a, b) => b.value - a.value).map((u, i) => ({ position: i + 1, ...u }));
  return { balanceRanking, volumeRanking };
};

export const getAdminData = async () => {
  return { users: readDB<User[]>(TBL_USERS, []), audits: readDB<AuditLog[]>(TBL_AUDIT, []) };
};

export const adminApproveKyc = async (adminId: string, targetId: string) => {
  const users = readDB<User[]>(TBL_USERS, []);
  const idx = users.findIndex(u => u.id === targetId);
  if (idx === -1) return;
  users[idx].kycStatus = KycStatus.VERIFIED;
  users[idx].notifications.unshift({
    id: `kyc-${Date.now()}`,
    title: 'Documentação Aprovada',
    message: 'Sua conta agora é verificada. Limites aumentados com sucesso.',
    timestamp: Date.now(),
    read: false
  });
  writeDB(TBL_USERS, users);
};

export const adminUpdateUser = async (adminId: string, userId: string, updates: Partial<User>) => {
  const users = readDB<User[]>(TBL_USERS, []);
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return;
  users[idx] = { ...users[idx], ...updates };
  writeDB(TBL_USERS, users);
};

export const adminAdjustBalance = async (adminId: string, userId: string, fiat: number, crypto: number) => {
  const users = readDB<User[]>(TBL_USERS, []);
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error("Usuário não encontrado.");
  users[idx].balanceFiat = fiat;
  users[idx].balanceCrypto = crypto;
  writeDB(TBL_USERS, users);
};

export const adminCreateUser = async (adminId: string, data: { name: string, email: string, passwordHash: string, balanceFiat: number }) => {
  const users = readDB<User[]>(TBL_USERS, []);
  if (users.find(u => u.email.toLowerCase() === data.email.toLowerCase())) throw new Error("E-mail já cadastrado.");
  const newUser: User = {
    id: `U-${Math.floor(Math.random() * 900000 + 100000)}`,
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
  writeDB(TBL_USERS, users);
  return newUser;
};

export const submitKyc = async (userId: string, data: any) => {
  const users = readDB<User[]>(TBL_USERS, []);
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return;
  users[idx].kycStatus = KycStatus.PENDING;
  users[idx].kycData = data;
  writeDB(TBL_USERS, users);
};

export const startStaking = async (userId: string, amount: number, hours: number) => {
  const users = readDB<User[]>(TBL_USERS, []);
  const idx = users.findIndex(u => u.id === userId);
  if (users[idx].balanceCrypto < amount) throw new Error("Saldo insuficiente.");
  users[idx].balanceCrypto -= amount;
  users[idx].staking.push({
    id: `STK-${Date.now()}`,
    amount,
    startDate: Date.now(),
    durationHours: hours,
    potentialReward: amount * (hours === 24 ? 0.05 : hours === 72 ? 0.08 : 0.16),
    active: true
  });
  writeDB(TBL_USERS, users);
};

export const initializeBankingCore = () => {
  setInterval(() => runMarketEngine(), 30000);
};

export const factoryResetSystem = () => {
  localStorage.clear();
  initializeDB();
};

export const generateSystemDump = () => JSON.stringify(readDB(TBL_USERS, []), null, 2);
