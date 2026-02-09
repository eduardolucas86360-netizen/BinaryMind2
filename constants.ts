
export const APP_NAME = "BinaryMind";
export const CURRENCY_SYMBOL = "B$";
export const CRYPTO_SYMBOL = "MDC";

export const MARKET_UPDATE_INTERVAL_HOURS = 5;
export const MARKET_UPDATE_INTERVAL_MS = MARKET_UPDATE_INTERVAL_HOURS * 60 * 60 * 1000;

export const INITIAL_MARKET_CAP_PRICE = 150.00;
export const MAX_VOLATILITY_INDEX = 0.05; 

export const STAKING_YIELD_RATES = {
  24: 0.05,
  72: 0.08,
  168: 0.16
};

// Latência de rede simulada reduzida para 50ms para máxima agilidade
export const NETWORK_LATENCY_MS = 50; 
