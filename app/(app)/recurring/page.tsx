'use client';
import { useState } from 'react';
import { useRecurringRules, useToggleRecurringRule, useDeleteRecurringRule } from '@/hooks/useRecurring';
import { Card, SectionTitle } from '@/components/ui';
import { formatINR } from '@/lib/utils/format';
import type { RecurringRule } from '@/types';

const FREQ_LABEL: Record<string, string> = {
  DAILY: 'Every day',
  WEEKLY: 'Every week',
  MONTHLY: 'Every month',
  YEARLY: 'Every year',
};

const FREQ_ICON: Record<string, string> = {
  DAILY: '📅',
  WEEKLY: '🗓️',
  MONTHLY: '📆',
  YEARLY: '🔄',
};

function RuleCard({ rule }: { rule: RecurringRule }) {
  const toggle = useToggleRecurringRule();
  const del = useDeleteRecurringRule();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (confirmDelete) {
    return (
      <Card style={{ padding: 20 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🗑️</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Delete recurring rule?</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>
            &quot;{rule.merchant}&quot; will stop auto-creating. Past expenses are kept.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="ss-btn-outline ss-btn-block" style={{ fontSize: 14 }} onClick={() => setConfirmDelete(false)}>Cancel</button>
            <button
              style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}
              disabled={del.isPending}
              onClick={() => del.mutate(rule.id)}
            >
              {del.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{
          width: 46, height: 46, borderRadius: 14,
          background: rule.category.tintHex,
          display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0,
        }}>
          {rule.category.icon}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {rule.merchant}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, flexShrink: 0,
              background: rule.isActive ? 'var(--coral-light)' : 'var(--surface-2)',
              color: rule.isActive ? 'var(--coral)' : 'var(--text-muted)',
              border: `1px solid ${rule.isActive ? 'var(--coral)' : 'var(--border)'}`,
            }}>
              {rule.isActive ? 'Active' : 'Paused'}
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            {FREQ_ICON[rule.frequency]} {FREQ_LABEL[rule.frequency]} · {rule.category.name} · {rule.type}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Next: {rule.isActive ? new Date(rule.nextDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>{formatINR(rule.amount)}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>per {rule.frequency.toLowerCase().replace('ly', '')}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button
          className="ss-btn-outline ss-btn-block"
          style={{ fontSize: 13, padding: '9px 0' }}
          disabled={toggle.isPending}
          onClick={() => toggle.mutate({ id: rule.id, isActive: !rule.isActive })}
        >
          {rule.isActive ? '⏸ Pause' : '▶ Resume'}
        </button>
        <button
          style={{ padding: '9px 14px', borderRadius: 12, border: '1px solid #fecaca', background: 'transparent', color: '#ef4444', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          onClick={() => setConfirmDelete(true)}
        >
          🗑️
        </button>
      </div>
    </Card>
  );
}

export default function RecurringPage() {
  const { data: rules = [], isLoading } = useRecurringRules();
  const active = rules.filter(r => r.isActive);
  const paused = rules.filter(r => !r.isActive);

  const monthlyTotal = active.reduce((sum, r) => {
    if (r.frequency === 'MONTHLY') return sum + r.amount;
    if (r.frequency === 'DAILY')   return sum + r.amount * 30;
    if (r.frequency === 'WEEKLY')  return sum + r.amount * 4.33;
    if (r.frequency === 'YEARLY')  return sum + r.amount / 12;
    return sum;
  }, 0);

  if (isLoading) {
    return <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Summary card */}
      <Card style={{ padding: 20, background: 'var(--coral)', borderRadius: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.7)' }}>MONTHLY RECURRING</div>
        <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-head)', color: '#fff', marginTop: 4 }}>
          {formatINR(monthlyTotal)}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', marginTop: 4 }}>
          {active.length} active rule{active.length !== 1 ? 's' : ''}
        </div>
      </Card>

      {rules.length === 0 ? (
        <Card style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔁</div>
          <div style={{ fontSize: 17, fontWeight: 800, fontFamily: 'var(--font-head)', color: 'var(--text-primary)', marginBottom: 6 }}>No recurring expenses</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Toggle &quot;Recurring expense&quot; when adding an expense to set one up.
          </div>
        </Card>
      ) : (
        <>
          {active.length > 0 && (
            <div>
              <SectionTitle>Active ({active.length})</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                {active.map(r => <RuleCard key={r.id} rule={r} />)}
              </div>
            </div>
          )}

          {paused.length > 0 && (
            <div>
              <SectionTitle>Paused ({paused.length})</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                {paused.map(r => <RuleCard key={r.id} rule={r} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
