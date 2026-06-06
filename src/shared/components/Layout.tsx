import { type ReactNode, useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store';
import { useChaos } from '../../chaos/ChaosContext';
import type { WSConnectionStatus } from '@shared/hooks/useWebSocket';

const icons = {
  dashboard: (
    <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  ),
  wallet: (
    <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="4" width="14" height="10" rx="1.5" />
      <path d="M1 7h14" />
      <circle cx="11.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  accounts: (
    <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="5" r="3" />
      <path d="M2 14c0-3 2.7-5 6-5s6 2 6 5" />
    </svg>
  ),
  transactions: (
    <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 5h10M3 8h7M3 11h5" strokeLinecap="round" />
    </svg>
  ),
  transfer: (
    <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 5h12M10 2l4 3-4 3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 11H2M6 8l-4 3 4 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  activity: (
    <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="1,8 4,4 7,10 10,6 13,8 15,7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  settings: (
    <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="2.5" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4" strokeLinecap="round" />
    </svg>
  ),
  chaos: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 14, height: 14 }}>
      <path d="M8 2L9.5 6H14L10.5 8.5L12 13L8 10.5L4 13L5.5 8.5L2 6H6.5Z" strokeLinejoin="round" />
    </svg>
  ),
};

const wsStatusConfig: Record<WSConnectionStatus, { color: string; label: string }> = {
  connected:    { color: 'var(--color-success)', label: 'Live'          },
  connecting:   { color: 'var(--color-warning)', label: 'Connecting…'  },
  reconnecting: { color: 'var(--color-warning)', label: 'Reconnecting…'},
  disconnected: { color: 'var(--color-danger)',  label: 'Disconnected'  },
};

const navItems = [
  { path: '/',             label: 'Dashboard',    icon: icons.dashboard    },
  { path: '/wallets',      label: 'Wallets',      icon: icons.wallet       },
  { path: '/accounts',     label: 'Accounts',     icon: icons.accounts     },
  { path: '/transactions', label: 'Transactions', icon: icons.transactions },
  { path: '/transfers',    label: 'Transfers',    icon: icons.transfer     },
  { path: '/activity',     label: 'Activity',     icon: icons.activity, badge: true },
  { path: '/settings',     label: 'Settings',     icon: icons.settings     },
];

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close menu on navigation
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const wsStatus       = useAppStore((s) => s.wsStatus);
  const unreadCount    = useAppStore((s) => s.unreadCount);
  const toggleChaos    = useAppStore((s) => s.toggleChaosPanel);
  const chaosPanelOpen = useAppStore((s) => s.chaosPanelOpen);
  const { config: chaosConfig } = useChaos();
  const chaosActive = chaosConfig.errorRate > 0 || chaosConfig.latencyMax > 0
    || chaosConfig.messageDropRate > 0 || chaosConfig.duplicateWsEvents || chaosConfig.forceDisconnect;
  const ws = wsStatusConfig[wsStatus];

  return (
    <div className="app-shell">
      {/* Mobile header */}
      <header className="mobile-header">
        <div className="mobile-header-logo">
          <div className="sidebar-logo-mark" style={{ width: 28, height: 28, fontSize: 14 }}>S</div>
          Stratos
        </div>
        <button className="mobile-hamburger" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </header>

      {/* Mobile overlay */}
      <div className={`mobile-overlay${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(false)} />

      <aside className={`sidebar${menuOpen ? ' open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">S</div>
          <span className="sidebar-logo-text">Stratos</span>
        </div>

        {/* Nav */}
        <div className="sidebar-section">
          <div className="sidebar-section-label">Menu</div>
          <ul className="sidebar-nav">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    'sidebar-nav-link' + (isActive ? ' active' : '')
                  }
                >
                  {item.icon}
                  {item.label}
                  {item.badge && unreadCount > 0 && (
                    <span style={{
                      marginLeft: 'auto',
                      background: 'var(--color-brand)',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: 99,
                      padding: '1px 6px',
                      minWidth: 18,
                      textAlign: 'center',
                    }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer: WS status + chaos toggle */}
        <div style={{
          marginTop: 'auto',
          padding: 'var(--space-4)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}>
          {/* WS status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontSize: 12,
            color: 'var(--color-sidebar-text)',
          }}>
            <span style={{
              width: 7, height: 7,
              borderRadius: '50%',
              background: ws.color,
              flexShrink: 0,
              boxShadow: wsStatus === 'connected' ? `0 0 6px ${ws.color}` : 'none',
            }} />
            <span>{ws.label}</span>
          </div>

          {/* Chaos toggle */}
          <button
            onClick={toggleChaos}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              background: chaosPanelOpen
                ? 'rgba(239,68,68,0.15)'
                : 'rgba(255,255,255,0.05)',
              border: `1px solid ${chaosPanelOpen ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 'var(--radius-sm)',
              padding: '6px 10px',
              color: chaosPanelOpen ? '#f87171' : 'var(--color-sidebar-text)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              width: '100%',
              fontFamily: 'var(--font-sans)',
              transition: 'background 0.15s, border-color 0.15s, color 0.15s',
            }}
          >
            {icons.chaos}
            {chaosPanelOpen ? 'Close Chaos' : 'Chaos Console'}
            {chaosActive && !chaosPanelOpen && (
              <span style={{
                marginLeft: 'auto',
                width: 7, height: 7,
                borderRadius: '50%',
                background: '#f87171',
                boxShadow: '0 0 6px #f87171',
                flexShrink: 0,
              }} />
            )}
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
