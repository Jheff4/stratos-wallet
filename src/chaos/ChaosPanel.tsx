import { useState } from 'react';
import {
  useChaos,
  CHAOS_PRESETS,
  type ChaosPresetKey,
} from './ChaosContext';

export default function ChaosPanel() {
  const {
    config,
    updateConfig,
    applyPreset,
    resetConfig,
  } = useChaos();

  const [isOpen, setIsOpen] = useState(true);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        width: 360,
        background: '#111',
        color: '#fff',
        border: '1px solid #333',
        borderRadius: 12,
        overflow: 'hidden',
        zIndex: 9999,
        fontFamily: 'Inter, sans-serif',
        boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1rem',
          borderBottom: '1px solid #222',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#181818',
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            Chaos Console
          </div>

          <div
            style={{
              fontSize: 12,
              color: '#888',
              marginTop: 4,
            }}
          >
            Runtime fault injection
          </div>
        </div>

        <button
          onClick={() => setIsOpen((prev) => !prev)}
          style={buttonStyle}
        >
          {isOpen ? 'Hide' : 'Show'}
        </button>
      </div>

      {isOpen && (
        <div
          style={{
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* Presets */}
          <section>
            <div style={sectionTitleStyle}>
              Presets
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              {Object.keys(CHAOS_PRESETS).map((preset) => (
                <button
                  key={preset}
                  onClick={() =>
                    applyPreset(preset as ChaosPresetKey)
                  }
                  style={presetButtonStyle}
                >
                  {preset}
                </button>
              ))}
            </div>
          </section>

          {/* Latency */}
          <section>
            <div style={sectionTitleStyle}>
              Network Latency
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>
                Min Latency
              </label>

              <input
                type="number"
                value={config.latencyMin}
                onChange={(e) =>
                  updateConfig({
                    latencyMin: Number(e.target.value),
                  })
                }
                style={inputStyle}
              />
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>
                Max Latency
              </label>

              <input
                type="number"
                value={config.latencyMax}
                onChange={(e) =>
                  updateConfig({
                    latencyMax: Number(e.target.value),
                  })
                }
                style={inputStyle}
              />
            </div>
          </section>

          {/* Error Rate */}
          <section>
            <div style={sectionTitleStyle}>
              Failure Rate
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>
                Error Rate
              </label>

              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={config.errorRate}
                onChange={(e) =>
                  updateConfig({
                    errorRate: Number(e.target.value),
                  })
                }
                style={inputStyle}
              />
            </div>

            <div
              style={{
                fontSize: 12,
                color: '#888',
                marginTop: 4,
              }}
            >
              {Math.round(config.errorRate * 100)}%
              requests fail
            </div>
          </section>

          {/* WebSocket Controls */}
          <section>
            <div style={sectionTitleStyle}>
              WebSocket Simulation
            </div>

            <Toggle
              label="Duplicate Events"
              checked={config.duplicateWsEvents}
              onChange={(checked) =>
                updateConfig({
                  duplicateWsEvents: checked,
                })
              }
            />

            <Toggle
              label="Force Disconnect"
              checked={config.forceDisconnect}
              onChange={(checked) =>
                updateConfig({
                  forceDisconnect: checked,
                })
              }
            />
            
            <Toggle
              label="Message Drop Rate"
              checked={config.messageDropRate > 0}
              onChange={(checked) =>
                updateConfig({
                  messageDropRate: checked ? 0.1 : 0,
                })
              }
            />
            
            <Toggle
              label="Message Reorder Rate"
              checked={config.messageReorderRate > 0}
              onChange={(checked) =>
                updateConfig({
                  messageReorderRate: checked ? 0.1 : 0,
                })
              }
            />
            
            <Toggle
              label="Partial Response Rate"
              checked={config.partialResponseRate > 0}
              onChange={(checked) =>
                updateConfig({
                  partialResponseRate: checked ? 0.1 : 0,
                })
              }
            />
          </section>

          {/* Current State */}
          <section>
            <div style={sectionTitleStyle}>
              Current Runtime State
            </div>

            <pre
              style={{
                background: '#0d0d0d',
                border: '1px solid #222',
                padding: '0.75rem',
                borderRadius: 8,
                fontSize: 11,
                overflowX: 'auto',
                color: '#00ff95',
              }}
            >
              {JSON.stringify(config, null, 2)}
            </pre>
          </section>

          {/* Footer Actions */}
          <section
            style={{
              display: 'flex',
              gap: 8,
            }}
          >
            <button
              onClick={resetConfig}
              style={{
                ...buttonStyle,
                flex: 1,
              }}
            >
              Reset
            </button>

            <button
              onClick={() =>
                applyPreset('productionChaos')
              }
              style={{
                ...buttonStyle,
                flex: 1,
              }}
            >
              Chaos Mode
            </button>
          </section>
        </div>
      )}
    </div>
  );
}

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function Toggle({
  label,
  checked,
  onChange,
}: ToggleProps) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        fontSize: 13,
      }}
    >
      <span>{label}</span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(e) =>
          onChange(e.target.checked)
        }
      />
    </label>
  );
}

const sectionTitleStyle = {
  fontSize: 12,
  fontWeight: 700,
  marginBottom: 12,
  textTransform: 'uppercase' as const,
  color: '#888',
};

const inputGroupStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  marginBottom: 12,
};

const labelStyle = {
  fontSize: 12,
  marginBottom: 6,
  color: '#bbb',
};

const inputStyle = {
  background: '#0d0d0d',
  border: '1px solid #333',
  color: '#fff',
  borderRadius: 8,
  padding: '0.6rem',
  outline: 'none',
};

const buttonStyle = {
  background: '#222',
  color: '#fff',
  border: '1px solid #333',
  borderRadius: 8,
  padding: '0.6rem 0.8rem',
  cursor: 'pointer',
};

const presetButtonStyle = {
  background: '#181818',
  color: '#ccc',
  border: '1px solid #333',
  borderRadius: 999,
  padding: '0.45rem 0.75rem',
  cursor: 'pointer',
  fontSize: 12,
};