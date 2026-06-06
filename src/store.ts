import { create } from 'zustand';
import type { WSConnectionStatus } from '@shared/hooks/useWebSocket';

// -------------------------------------------------------
// Live event — a WS message that arrived in this session
// -------------------------------------------------------
export interface LiveEvent {
  id: string;          // eventId from server
  seq: number;
  type: string;
  receivedAt: string;  // ISO timestamp
  replayed: boolean;
  payload: Record<string, unknown>;
}

// -------------------------------------------------------
// App-wide Zustand store
// -------------------------------------------------------
interface AppState {
  // Auth (stub — wire up when login is built out)
  isAuthenticated: boolean;

  // Real-time WS status
  wsStatus: WSConnectionStatus;
  setWsStatus: (status: WSConnectionStatus) => void;

  // Live event feed (capped at 100)
  events: LiveEvent[];
  unreadCount: number;
  addEvent: (event: LiveEvent) => void;
  markAllRead: () => void;

  // Chaos panel
  chaosPanelOpen: boolean;
  toggleChaosPanel: () => void;
  setChaosPanel: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isAuthenticated: false,

  wsStatus: 'connecting',
  setWsStatus: (status) => set({ wsStatus: status }),

  events: [],
  unreadCount: 0,
  addEvent: (event) =>
    set((state) => ({
      events: [event, ...state.events].slice(0, 100),
      unreadCount: state.unreadCount + 1,
    })),
  markAllRead: () => set({ unreadCount: 0 }),

  chaosPanelOpen: false,
  toggleChaosPanel: () => set((s) => ({ chaosPanelOpen: !s.chaosPanelOpen })),
  setChaosPanel: (open) => set({ chaosPanelOpen: open }),
}));
