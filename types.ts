
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum KycStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
}

export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
  STAKE = 'STAKE',
  UNSTAKE = 'UNSTAKE',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
  ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT'
}

export enum TrendType {
  BULLISH = 'BULLISH',
  BEARISH = 'BEARISH',
  SIDEWAYS = 'SIDEWAYS'
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockedAt: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

export interface StakingPosition {
  id: string;
  amount: number;
  startDate: number;
  durationHours: number;
  potentialReward: number;
  active: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  balanceFiat: number;
  balanceCrypto: number;
  kycStatus: KycStatus;
  kycData?: {
    fullName: string;
    dob: string;
    docId: string;
  };
  transactions: Transaction[];
  staking: StakingPosition[];
  notifications: Notification[];
  achievements: Achievement[];
  settings: {
    theme: 'binary' | 'dark' | 'light';
    highContrast: boolean;
    largeText: boolean;
  };
  isBlocked: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amountFiat?: number;
  amountCrypto?: number;
  priceAtMoment?: number;
  timestamp: number;
  description: string;
  relatedUserEmail?: string;
}

export interface MarketData {
  currentPrice: number;
  lastUpdated: number;
  trend: TrendType;
  priceHistory: { time: number; price: number }[];
}

export interface AuditLog {
  id: string;
  timestamp: number;
  adminId: string;
  action: string;
  targetUserId?: string;
  details: string;
}
