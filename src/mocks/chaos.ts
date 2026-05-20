// Default chaos configuration
export interface ChaosConfig {
  latencyMin: number;   // ms
  latencyMax: number;   // ms
  errorRate: number;    // 0-1
  duplicateWsEvents: boolean;
  forceDisconnect: boolean;
  messageDropRate: number;
  messageReorderRate: number;
  partialResponseRate: number;
}

let config: ChaosConfig = {
  latencyMin: 0,
  latencyMax: 0,
  errorRate: 0,
  duplicateWsEvents: false,
  forceDisconnect: false,
  messageDropRate: 0,
  messageReorderRate: 0,
  partialResponseRate: 0,
};

export function getChaosConfig(): ChaosConfig {
  return { ...config };
}

export function updateChaosConfig(newConfig: Partial<ChaosConfig>) {
  config = { ...config, ...newConfig };
}

// Helper to apply chaos to a resolver
export async function applyChaos() {
  const { latencyMin, latencyMax, errorRate, messageDropRate, messageReorderRate, partialResponseRate } = config;

  // Random latency
  if (latencyMax > 0) {
    const delay = latencyMin + Math.random() * (latencyMax - latencyMin);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // Random error
  if (Math.random() < errorRate) {
    throw new Error('Simulated server error');
  }
  
  // Message drop
  if (Math.random() < messageDropRate) {
    return null;
  }
  
  // Message reorder
  if (Math.random() < messageReorderRate) {
    return 'reordered';
  }
  
  // Partial response
  if (Math.random() < partialResponseRate) {
    return 'partial';
  }
  
  // No chaos
  return 'ok';
}