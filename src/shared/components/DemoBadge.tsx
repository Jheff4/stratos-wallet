import { env } from '@config/env';

export interface DemoConcept {
  /** Short label shown on the pill, e.g. "Ledger-first data model" */
  label: string;
  /** Path on the docs site, e.g. "/adrs/ledger-first-data-model" */
  path: string;
}

interface DemoBadgeProps {
  concepts: DemoConcept[];
  /**
   * Mark a page as an intentional scaffold/stub rather than a finished
   * demo. Renders an honest "not a demo focus" note instead of pretending
   * an unfinished page teaches something it doesn't.
   */
  stub?: boolean;
}

/**
 * A small row of pills under a page header naming exactly which
 * architectural concepts that page demonstrates, each linking to the
 * ADR / engineering story / quiz that explains it in depth.
 *
 * WHY THIS EXISTS: a portfolio project with many polished-looking pages
 * gives no signal about which parts are the actual point. Every page here
 * says, out loud, what it's for, including pages that are deliberately
 * *not* finished. That honesty is itself the demonstration: a reviewer
 * should never have to guess whether something is a deep pattern or a
 * placeholder.
 */
export default function DemoBadge({ concepts, stub }: DemoBadgeProps) {
  if (stub) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          marginTop: 10,
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--color-warning)',
          background: 'var(--color-warning-bg)',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 'var(--radius-sm)',
          padding: '4px 10px',
        }}
      >
        🚧 Scaffold only, not a demo focus yet
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 10 }}>
      <span style={{
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--color-text-muted)',
      }}>
        Demonstrates
      </span>
      {concepts.map((c) => (
        <a
          key={c.path}
          href={`${env.docsUrl}${c.path}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 11.5,
            fontWeight: 500,
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(79,110,247,0.25)',
            color: 'var(--color-brand)',
            background: 'var(--color-brand-light)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {c.label} ↗
        </a>
      ))}
    </div>
  );
}
