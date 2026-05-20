import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';

export interface ChaosState {
  latencyMin: number;
  latencyMax: number;
  errorRate: number;
  duplicateWsEvents: boolean;
  forceDisconnect: boolean;
  messageDropRate: number;
  messageReorderRate: number;
  partialResponseRate: number;
}

interface ChaosContextType {
  config: ChaosState;
  updateConfig: (partial: Partial<ChaosState>) => Promise<void>;
  applyPreset: (preset: ChaosPresetKey) => Promise<void>;
  resetConfig: () => Promise<void>;
}

const DEFAULT_CONFIG: ChaosState = {
  latencyMin: 0,
  latencyMax: 0,
  errorRate: 0,
  duplicateWsEvents: false,
  forceDisconnect: false,
  messageDropRate: 0,
  messageReorderRate: 0,
  partialResponseRate: 0,
};

export const CHAOS_PRESETS = {
  // =========================================================
  // Stable Environment
  // =========================================================

  normal: {
    latencyMin: 0,
    latencyMax: 0,
    errorRate: 0,
    duplicateWsEvents: false,
    forceDisconnect: false,
    messageDropRate: 0,
    messageReorderRate: 0,
    partialResponseRate: 0,
  },

  // =========================================================
  // Slow Mobile Network
  // Simulates weak cellular / 3G conditions
  // =========================================================

  slow3G: {
    latencyMin: 800,
    latencyMax: 2500,
    errorRate: 0.02,
    duplicateWsEvents: false,
    forceDisconnect: false,
    messageDropRate: 0,
    messageReorderRate: 0,
    partialResponseRate: 0,
  },

  // =========================================================
  // Very Slow Satellite / Rural Network
  // =========================================================

  extremeLatency: {
    latencyMin: 3000,
    latencyMax: 8000,
    errorRate: 0.08,
    duplicateWsEvents: false,
    forceDisconnect: false,
    messageDropRate: 0.02,
    messageReorderRate: 0,
    partialResponseRate: 0,
  },

  // =========================================================
  // Backend Under Load
  // Random server failures
  // =========================================================

  flakyBackend: {
    latencyMin: 200,
    latencyMax: 1000,
    errorRate: 0.3,
    duplicateWsEvents: false,
    forceDisconnect: false,
    messageDropRate: 0,
    messageReorderRate: 0,
    partialResponseRate: 0.15,
  },

  // =========================================================
  // Intermittent Backend Outage
  // Some requests fail completely
  // =========================================================

  intermittentOutage: {
    latencyMin: 100,
    latencyMax: 700,
    errorRate: 0.5,
    duplicateWsEvents: false,
    forceDisconnect: false,
    messageDropRate: 0,
    messageReorderRate: 0,
    partialResponseRate: 0.25,
  },

  // =========================================================
  // Complete Offline
  // =========================================================

  offlineMode: {
    latencyMin: 0,
    latencyMax: 0,
    errorRate: 1,
    duplicateWsEvents: false,
    forceDisconnect: true,
    messageDropRate: 1,
    messageReorderRate: 0,
    partialResponseRate: 1,
  },

  // =========================================================
  // WebSocket Event Flooding
  // Duplicate realtime events
  // =========================================================

  websocketStorm: {
    latencyMin: 100,
    latencyMax: 400,
    errorRate: 0,
    duplicateWsEvents: true,
    forceDisconnect: false,
    messageDropRate: 0,
    messageReorderRate: 0.05,
    partialResponseRate: 0,
  },

  // =========================================================
  // Unstable WebSocket Connection
  // Frequent disconnect/reconnect
  // =========================================================

  websocketInstability: {
    latencyMin: 150,
    latencyMax: 800,
    errorRate: 0,
    duplicateWsEvents: true,
    forceDisconnect: true,
    messageDropRate: 0.08,
    messageReorderRate: 0.15,
    partialResponseRate: 0,
  },

  // =========================================================
  // Distributed System Ordering Problems
  // Messages arrive out of order
  // =========================================================

  eventReordering: {
    latencyMin: 100,
    latencyMax: 1200,
    errorRate: 0,
    duplicateWsEvents: false,
    forceDisconnect: false,
    messageDropRate: 0.03,
    messageReorderRate: 0.4,
    partialResponseRate: 0,
  },

  // =========================================================
  // Packet Loss
  // Missing realtime updates
  // =========================================================

  packetLoss: {
    latencyMin: 200,
    latencyMax: 1200,
    errorRate: 0,
    duplicateWsEvents: false,
    forceDisconnect: false,
    messageDropRate: 0.2,
    messageReorderRate: 0.05,
    partialResponseRate: 0,
  },

  // =========================================================
  // Partial GraphQL Failure
  // Some widgets fail while others succeed
  // =========================================================

  partialDataFailure: {
    latencyMin: 100,
    latencyMax: 700,
    errorRate: 0.15,
    duplicateWsEvents: false,
    forceDisconnect: false,
    messageDropRate: 0,
    messageReorderRate: 0,
    partialResponseRate: 0.5,
  },

  // =========================================================
  // Production-Like Chaos
  // Realistic degraded production conditions
  // =========================================================

  productionChaos: {
    latencyMin: 300,
    latencyMax: 1200,
    errorRate: 0.1,
    duplicateWsEvents: true,
    forceDisconnect: true,
    messageDropRate: 0.05,
    messageReorderRate: 0.08,
    partialResponseRate: 0.1,
  },

  // =========================================================
  // Mobile User Moving Through Poor Connectivity
  // Tunnel / train / subway conditions
  // =========================================================

  mobileTrainTunnel: {
    latencyMin: 1500,
    latencyMax: 6000,
    errorRate: 0.25,
    duplicateWsEvents: true,
    forceDisconnect: true,
    messageDropRate: 0.15,
    messageReorderRate: 0.2,
    partialResponseRate: 0.2,
  },

  // =========================================================
  // API Rate Limiting Scenario
  // Simulates backend throttling
  // =========================================================

  rateLimited: {
    latencyMin: 200,
    latencyMax: 1000,
    errorRate: 0.35,
    duplicateWsEvents: false,
    forceDisconnect: false,
    messageDropRate: 0,
    messageReorderRate: 0,
    partialResponseRate: 0.1,
  },

  // =========================================================
  // High Load Trading Environment
  // Very high realtime throughput
  // =========================================================

  highFrequencyRealtime: {
    latencyMin: 20,
    latencyMax: 150,
    errorRate: 0.02,
    duplicateWsEvents: true,
    forceDisconnect: false,
    messageDropRate: 0.03,
    messageReorderRate: 0.25,
    partialResponseRate: 0,
  },

  // =========================================================
  // Catastrophic Failure Scenario
  // Used for resilience stress testing
  // =========================================================

  catastrophicFailure: {
    latencyMin: 2000,
    latencyMax: 10000,
    errorRate: 0.8,
    duplicateWsEvents: true,
    forceDisconnect: true,
    messageDropRate: 0.5,
    messageReorderRate: 0.5,
    partialResponseRate: 0.7,
  },
} satisfies Record<string, ChaosState>;

export type ChaosPresetKey = keyof typeof CHAOS_PRESETS;

const STORAGE_KEY = 'stratos-chaos-config';

const ChaosContext = createContext<ChaosContextType>({
  config: DEFAULT_CONFIG,
  updateConfig: async () => {},
  applyPreset: async () => {},
  resetConfig: async () => {},
});

export const useChaos = () => useContext(ChaosContext);

function getInitialConfig(): ChaosState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return DEFAULT_CONFIG;
    }

    return {
      ...DEFAULT_CONFIG,
      ...JSON.parse(stored),
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

async function syncChaosConfig(config: ChaosState) {
  await fetch('/chaos/config', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });
}

export function ChaosProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, setConfig] = useState<ChaosState>(getInitialConfig);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  const updateConfig = useCallback(
    async (partial: Partial<ChaosState>) => {
      const nextConfig = {
        ...config,
        ...partial,
      };

      setConfig(nextConfig);

      await syncChaosConfig(nextConfig);
    },
    [config],
  );

  const applyPreset = useCallback(
    async (preset: ChaosPresetKey) => {
      const presetConfig = CHAOS_PRESETS[preset];

      setConfig(presetConfig);

      await syncChaosConfig(presetConfig);
    },
    [],
  );

  const resetConfig = useCallback(async () => {
    setConfig(DEFAULT_CONFIG);

    localStorage.removeItem(STORAGE_KEY);

    await syncChaosConfig(DEFAULT_CONFIG);
  }, []);

  const value = useMemo(
    () => ({
      config,
      updateConfig,
      applyPreset,
      resetConfig,
    }),
    [config, updateConfig, applyPreset, resetConfig],
  );

  return (
    <ChaosContext.Provider value={value}>
      {children}
    </ChaosContext.Provider>
  );
}