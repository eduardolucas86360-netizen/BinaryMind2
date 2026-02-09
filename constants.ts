
export const APP_NAME = "BinaryMind";
export const CURRENCY_SYMBOL = "B$";
export const CRYPTO_SYMBOL = "MDC";

export const MARKET_UPDATE_INTERVAL_HOURS = 5;
export const MARKET_UPDATE_INTERVAL_MS = MARKET_UPDATE_INTERVAL_HOURS * 60 * 60 * 1000;

export const INITIAL_MARKET_CAP_PRICE = 150.00;
export const MAX_VOLATILITY_INDEX = 0.05; // 5% de volatilidade permitida

// Yield anualizado (APY) convertido para períodos curtos
export const STAKING_YIELD_RATES = {
  24: 0.05, // Short-term liquidity provider reward
  72: 0.08, // Mid-term lockup
  168: 0.16 // Long-term governance staking
};

export const NETWORK_LATENCY_MS = 100; // Latência reduzida para agilidade em tempo real
