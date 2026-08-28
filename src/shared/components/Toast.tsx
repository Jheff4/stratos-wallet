import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { formatCurrency } from '@shared/utils/formatters';

// -------------------------------------------------------
// Toast store: self-contained, no prop drilling needed
// -------------------------------------------------------
export interface ToastMessage {
  id: string;
  title: string;
  body: string;
  variant: 'success' | 'info' | 'warning' | 'error';
}

interface ToastState {
  toasts: ToastMessage[];
  add: (t: Omit<ToastMessage, 'id'>) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  add: (t) => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    // Auto-dismiss after 4s
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 4000);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// Convenience helper: call anywhere, no hook needed
export function toast(t: Omit<ToastMessage, 'id'>) {
  useToastStore.getState().add(t);
}

// Convenience for live transactions
export function toastTransaction(tx: {
  description: string;
  amount: number;
  currency: string;
  type: string;
}) {
  const isDeposit = tx.type.toUpperCase() === 'DEPOSIT';
  toast({
    title: tx.description,
    body: `${isDeposit ? '+' : '−'}${formatCurrency(tx.amount, tx.currency)}`,
    variant: isDeposit ? 'success' : 'info',
  });
}

// -------------------------------------------------------
// ToastContainer: mount once in App.tsx
// -------------------------------------------------------
const variantStyles: Record<ToastMessage['variant'], { border: string; icon: string }> = {
  success: { border: 'var(--color-success)', icon: '✓' },
  info:    { border: 'var(--color-brand)',   icon: '↗' },
  warning: { border: 'var(--color-warning)', icon: '!' },
  error:   { border: 'var(--color-danger)',  icon: '✕' },
};

function ToastItem({ toast: t, onRemove }: { toast: ToastMessage; onRemove: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const v = variantStyles[t.variant];

  return (
    <div
      onClick={onRemove}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderLeft: `3px solid ${v.border}`,
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px',
        boxShadow: 'var(--shadow-lg)',
        cursor: 'pointer',
        transform: visible ? 'translateX(0)' : 'translateX(120%)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s',
        minWidth: 260,
        maxWidth: 320,
        userSelect: 'none',
      }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: '50%',
        background: v.border, color: '#fff',
        fontSize: 11, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 1,
      }}>
        {v.icon}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {t.title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
          {t.body}
        </div>
      </div>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, remove } = useToastStore();

  return (
    <div style={{
      position: 'fixed',
      top: 16,
      right: 16,
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      pointerEvents: 'none',
    }}>
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem toast={t} onRemove={() => remove(t.id)} />
        </div>
      ))}
    </div>
  );
}
