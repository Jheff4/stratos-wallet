import { useChaos, type ChaosPresetKey } from './ChaosContext';
import { useAppStore } from '../store';

// const PRESETS = Object.keys(CHAOS_PRESETS) as ChaosPresetKey[];

// Group presets visually
const PRESET_GROUPS: { label: string; keys: ChaosPresetKey[] }[] = [
  {
    label: 'Network',
    keys: ['normal', 'slow3G', 'extremeLatency', 'mobileTrainTunnel'],
  },
  {
    label: 'Failures',
    keys: ['flakyBackend', 'intermittentOutage', 'offlineMode', 'rateLimited', 'catastrophicFailure'],
  },
  {
    label: 'WebSocket',
    keys: ['websocketStorm', 'websocketInstability', 'eventReordering', 'packetLoss', 'highFrequencyRealtime'],
  },
  {
    label: 'Mixed',
    keys: ['partialDataFailure', 'productionChaos'],
  },
];

function isChaosActive(config: ReturnType<typeof useChaos>['config']) {
  return (
    config.latencyMax > 0 ||
    config.errorRate > 0 ||
    config.messageDropRate > 0 ||
    config.messageReorderRate > 0 ||
    config.partialResponseRate > 0 ||
    config.duplicateWsEvents ||
    config.forceDisconnect
  );
}

export default function ChaosPanel() {
  const { config, updateConfig, applyPreset, resetConfig } = useChaos();
  const isOpen   = useAppStore((s) => s.chaosPanelOpen);
  const setOpen  = useAppStore((s) => s.setChaosPanel);
  const chaosOn  = isChaosActive(config);

  return (
    <>
      {/* Slide-in drawer */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        width: 340,
        maxHeight: '80vh',
        background: '#0d1117',
        border: '1px solid #21262d',
        borderBottom: 'none',
        borderRight: 'none',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 0,
        zIndex: 9998,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px -4px 32px rgba(0,0,0,0.5)',
        transform: isOpen ? 'translateY(0)' : 'translateY(110%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        fontFamily: 'var(--font-sans)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #21262d',
          flexShrink: 0,
          background: chaosOn ? 'rgba(239,68,68,0.06)' : undefined,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>⚡</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#e6edf3', display: 'flex', alignItems: 'center', gap: 6 }}>
                Chaos Console
                {chaosOn && (
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    background: 'rgba(239,68,68,0.2)',
                    color: '#f87171',
                    border: '1px solid rgba(239,68,68,0.35)',
                    borderRadius: 99,
                    padding: '1px 7px',
                    letterSpacing: '0.04em',
                  }}>
                    ACTIVE
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: '#8b949e', marginTop: 1 }}>
                {chaosOn
                  ? `${config.errorRate > 0 ? `${Math.round(config.errorRate * 100)}% errors · ` : ''}${config.latencyMax > 0 ? `${config.latencyMin}–${config.latencyMax}ms latency · ` : ''}fault injection on`
                  : 'Runtime fault injection · all clear'}
              </div>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#8b949e',
              cursor: 'pointer',
              fontSize: 18,
              lineHeight: 1,
              padding: '2px 6px',
              borderRadius: 4,
            }}
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{
          overflowY: 'auto',
          flex: 1,
          padding: '12px 16px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}>
          {/* Preset groups */}
          {PRESET_GROUPS.map((group) => (
            <section key={group.label}>
              <div style={sectionLabel}>{group.label}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {group.keys.map((key) => (
                  <button
                    key={key}
                    onClick={() => applyPreset(key)}
                    style={presetBtn}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </section>
          ))}

          {/* Latency */}
          <section>
            <div style={sectionLabel}>Network Latency (ms)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={fieldLabel}>Min</label>
                <input
                  type="number"
                  value={config.latencyMin}
                  onChange={(e) => updateConfig({ latencyMin: Number(e.target.value) })}
                  style={input}
                />
              </div>
              <div>
                <label style={fieldLabel}>Max</label>
                <input
                  type="number"
                  value={config.latencyMax}
                  onChange={(e) => updateConfig({ latencyMax: Number(e.target.value) })}
                  style={input}
                />
              </div>
            </div>
          </section>

          {/* Error rate */}
          <section>
            <div style={sectionLabel}>Error Rate</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="range"
                min="0" max="1" step="0.05"
                value={config.errorRate}
                onChange={(e) => updateConfig({ errorRate: Number(e.target.value) })}
                style={{ flex: 1, accentColor: '#f87171' }}
              />
              <span style={{ fontSize: 12, color: '#f87171', fontWeight: 600, minWidth: 36 }}>
                {Math.round(config.errorRate * 100)}%
              </span>
            </div>
          </section>

          {/* WS toggles */}
          <section>
            <div style={sectionLabel}>WebSocket Faults</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {([
                ['duplicateWsEvents', 'Duplicate Events'],
                ['forceDisconnect',   'Force Disconnect'],
              ] as const).map(([key, label]) => (
                <label key={key} style={toggleRow}>
                  <span style={{ color: '#c9d1d9', fontSize: 13 }}>{label}</span>
                  <input
                    type="checkbox"
                    checked={config[key] as boolean}
                    onChange={(e) => updateConfig({ [key]: e.target.checked })}
                    style={{ accentColor: '#4f6ef7', width: 14, height: 14, cursor: 'pointer' }}
                  />
                </label>
              ))}
              <label style={toggleRow}>
                <span style={{ color: '#c9d1d9', fontSize: 13 }}>Message Drop Rate</span>
                <input
                  type="checkbox"
                  checked={config.messageDropRate > 0}
                  onChange={(e) => updateConfig({ messageDropRate: e.target.checked ? 0.15 : 0 })}
                  style={{ accentColor: '#4f6ef7', width: 14, height: 14, cursor: 'pointer' }}
                />
              </label>
              <label style={toggleRow}>
                <span style={{ color: '#c9d1d9', fontSize: 13 }}>Message Reorder</span>
                <input
                  type="checkbox"
                  checked={config.messageReorderRate > 0}
                  onChange={(e) => updateConfig({ messageReorderRate: e.target.checked ? 0.15 : 0 })}
                  style={{ accentColor: '#4f6ef7', width: 14, height: 14, cursor: 'pointer' }}
                />
              </label>
            </div>
          </section>

          {/* Current state */}
          <section>
            <div style={sectionLabel}>Current State</div>
            <pre style={{
              background: '#010409',
              border: '1px solid #21262d',
              borderRadius: 6,
              padding: '8px 10px',
              fontSize: 10.5,
              color: '#3fb950',
              overflowX: 'auto',
              margin: 0,
              lineHeight: 1.6,
            }}>
              {JSON.stringify(config, null, 2)}
            </pre>
          </section>
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid #21262d',
          display: 'flex',
          gap: 8,
          flexShrink: 0,
        }}>
          <button onClick={resetConfig} style={footerBtn}>
            Reset
          </button>
          <button
            onClick={() => applyPreset('productionChaos')}
            style={{ ...footerBtn, background: 'rgba(239,68,68,0.1)', color: '#f87171', borderColor: 'rgba(239,68,68,0.25)' }}
          >
            ⚡ Chaos Mode
          </button>
        </div>
      </div>
    </>
  );
}

// ---- Style constants ----
const sectionLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#8b949e',
  marginBottom: 8,
};

const fieldLabel: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  color: '#8b949e',
  marginBottom: 4,
};

const input: React.CSSProperties = {
  width: '100%',
  background: '#161b22',
  border: '1px solid #30363d',
  borderRadius: 6,
  color: '#e6edf3',
  padding: '5px 8px',
  fontSize: 13,
  outline: 'none',
  fontFamily: 'var(--font-sans)',
};

const toggleRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '5px 0',
  cursor: 'pointer',
};

const presetBtn: React.CSSProperties = {
  background: '#161b22',
  border: '1px solid #30363d',
  borderRadius: 99,
  color: '#8b949e',
  fontSize: 11,
  padding: '3px 10px',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  transition: 'background 0.1s, color 0.1s',
};

const footerBtn: React.CSSProperties = {
  flex: 1,
  background: '#161b22',
  border: '1px solid #30363d',
  borderRadius: 6,
  color: '#c9d1d9',
  fontSize: 12,
  fontWeight: 500,
  padding: '6px 0',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
};
