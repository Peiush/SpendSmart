'use client';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useBudgets, useUpdateBudget, useCreateBudget, useBudgetHistory } from '@/hooks/useBudgets';
import { useCategories, useCatBy } from '@/hooks/useCategories';
import { useUser, useUpdateUser } from '@/hooks/useUser';
import { Card, IconDisc, ProgressBar, SectionTitle, Toggle } from '@/components/ui';
import { formatINR } from '@/lib/utils/format';
import { budgetStatus } from '@/lib/utils/budget';
import { useMounted } from '@/hooks/useMounted';

export default function BudgetsPage() {
  const { data: budgets = [] } = useBudgets();
  const { data: history = [] } = useBudgetHistory();
  const { data: user } = useUser();
  const { data: categories = [] } = useCategories();
  const catBy = useCatBy();
  const updateBudget = useUpdateBudget();
  const createBudget = useCreateBudget();
  const updateUser = useUpdateUser();

  const mounted = useMounted();

  const [alerts, setAlerts] = useState({ a50: true, a80: true, a100: true });
  const [dailyOn, setDailyOn] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  // modals
  const [editLimit, setEditLimit] = useState<{ id: string; category: string; limit: string } | null>(null);
  const [editMonthly, setEditMonthly] = useState<string | null>(null);
  const [editDaily, setEditDaily] = useState<string | null>(null);
  const [addCatBudget, setAddCatBudget] = useState<{ categoryId: string; amount: string } | null>(null);

  const globalBudget = budgets.find(b => !b.categoryId);
  const catBudgets = budgets.filter(b => b.categoryId);
  const spent = globalBudget?.spent ?? 0;
  const monthlyBudget = globalBudget?.amount ?? user?.monthlyBudget ?? 0;
  const remaining = monthlyBudget - spent;
  const globalPct = monthlyBudget > 0 ? Math.round((spent / monthlyBudget) * 100) : 0;

  const existingCatIds = new Set(catBudgets.map(b => b.categoryId));
  const availableCategories = categories.filter(c => !existingCatIds.has(c.id));

  const saveLimitEdit = async () => {
    if (!editLimit) return;
    await updateBudget.mutateAsync({ id: editLimit.id, amount: Number(editLimit.limit) } as Parameters<typeof updateBudget.mutateAsync>[0]);
    setEditLimit(null);
  };

  const saveMonthlyBudget = async () => {
    if (editMonthly === null) return;
    await updateUser.mutateAsync({ monthlyBudget: Number(editMonthly) });
    setEditMonthly(null);
  };

  const saveDailyLimit = async () => {
    if (editDaily === null) return;
    await updateUser.mutateAsync({ dailyLimit: Number(editDaily) });
    setEditDaily(null);
  };

  const saveAddCatBudget = async () => {
    if (!addCatBudget || !addCatBudget.categoryId || !addCatBudget.amount) return;
    await createBudget.mutateAsync({ categoryId: addCatBudget.categoryId, amount: Number(addCatBudget.amount) } as Parameters<typeof createBudget.mutateAsync>[0]);
    setAddCatBudget(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Global budget */}
      <Card style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 18, alignItems: 'flex-start' }}>
          {[['Monthly budget', monthlyBudget, 'var(--text-primary)'], ['Spent', spent, 'var(--coral)'], ['Remaining', remaining, '#2E9E6B']].map(([label, val, color]) => (
            <div key={label as string}>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-head)', color: color as string, marginTop: 3 }}>{formatINR(val as number)}</div>
            </div>
          ))}
          <button className="ss-pencil" style={{ alignSelf: 'center' }} title="Edit monthly budget" onClick={() => setEditMonthly(String(monthlyBudget))}>✏️</button>
        </div>
        <ProgressBar pct={globalPct} height={14} gradient="linear-gradient(90deg, var(--coral) 0%, #F5A623 100%)" />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 9, fontSize: 13 }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{globalPct}% used</span>
          <span style={{ color: 'var(--text-muted)' }}>{formatINR(spent)} / {formatINR(monthlyBudget)}</span>
        </div>
      </Card>

      {/* Per-category */}
      <div>
        <SectionTitle action={<button className="ss-link" onClick={() => setShowHistory(v => !v)}>{showHistory ? 'Hide history' : 'View history'}</button>}>Per-category limits</SectionTitle>

        {showHistory && history.length > 0 && (
          <div className="ss-filter-panel" style={{ marginBottom: 16, overflowX: 'auto' }}>
            <div style={{ fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-head)', color: 'var(--text-primary)', marginBottom: 16 }}>Budget History</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Category</th>
                  {history.map(h => <th key={h.month} style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h.month}</th>)}
                </tr>
              </thead>
              <tbody>
                {(history[0]?.budgets ?? []).map(b => (
                  <tr key={b.category} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{b.category}</td>
                    {history.map(h => {
                      const entry = h.budgets.find(x => x.category === b.category);
                      if (!entry) return <td key={h.month} style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>—</td>;
                      const st = budgetStatus(Math.round((entry.spent / entry.limit) * 100));
                      return <td key={h.month} style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <span style={{ color: st.color, fontWeight: 700 }}>{formatINR(entry.spent)}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 4 }}>/{formatINR(entry.limit)}</span>
                      </td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {catBudgets.map(b => {
            const cat = catBy[b.category?.name ?? ''];
            if (!cat) return null;
            const pct = b.amount > 0 ? Math.round((b.spent / b.amount) * 100) : 0;
            const st = budgetStatus(pct);
            const exceeded = pct >= 100;
            return (
              <Card key={b.id} hover className={exceeded ? 'ss-exceeded' : ''} style={{ padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 13 }}>
                  <IconDisc category={cat} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-head)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{b.category?.name}</span>
                      {exceeded && <span className="ss-exceed-badge">LIMIT EXCEEDED</span>}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3 }}>{pct}% of limit used</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: 15, fontFamily: 'var(--font-head)', color: st.color }}>{formatINR(b.spent)}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>/ {formatINR(b.amount)}</div>
                  </div>
                  <button className="ss-pencil" onClick={() => setEditLimit({ id: b.id, category: b.category?.name ?? '', limit: String(b.amount) })}>✏️</button>
                </div>
                <ProgressBar pct={pct} color={st.color} height={10} />
              </Card>
            );
          })}
          {catBudgets.length === 0 && <Card style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No category budgets set yet. Add one below!</Card>}
        </div>
      </div>

      {/* Daily limit */}
      <Card style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15.5, fontFamily: 'var(--font-head)', color: 'var(--text-primary)' }}>Daily spending limit</div>
            <div style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 4 }}>
              Limit: <strong style={{ color: 'var(--text-primary)' }}>{formatINR(user?.dailyLimit ?? 0)}</strong>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-head)', color: 'var(--text-primary)' }}>{formatINR(user?.dailyLimit ?? 0)}</span>
            <button className="ss-pencil" title="Edit daily limit" onClick={() => setEditDaily(String(user?.dailyLimit ?? 0))}>✏️</button>
            <Toggle on={dailyOn} onChange={setDailyOn} />
          </div>
        </div>
      </Card>

      {/* Alerts */}
      <Card style={{ padding: 22 }}>
        <SectionTitle>Alert settings</SectionTitle>
        {[['Alert at 50% of budget', 'a50'], ['Alert at 80% of budget', 'a80'], ['Alert at 100% (exceeded)', 'a100']].map(([label, key], i) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
            <span style={{ fontSize: 14.5, color: 'var(--text-primary)', fontWeight: 500 }}>{label}</span>
            <Toggle on={alerts[key as keyof typeof alerts]} onChange={v => setAlerts(a => ({ ...a, [key]: v }))} />
          </div>
        ))}
      </Card>

      <button
        className="ss-btn-outline"
        style={{ alignSelf: 'flex-start' }}
        onClick={() => setAddCatBudget({ categoryId: availableCategories[0]?.id ?? '', amount: '' })}
      >
        + Add budget limit
      </button>

      {/* Edit category limit modal */}
      {mounted && editLimit && createPortal(
        <div className="ss-modal-overlay" onClick={() => setEditLimit(null)}>
          <div className="ss-sheet" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-head)', color: 'var(--text-primary)' }}>Edit limit</h2>
              <button className="ss-icon-btn" onClick={() => setEditLimit(null)}>✕</button>
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-head)', color: 'var(--text-primary)', marginBottom: 20 }}>{editLimit.category}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>Monthly limit (₹)</div>
            <input className="ss-input" type="number" value={editLimit.limit} onChange={e => setEditLimit(l => l ? { ...l, limit: e.target.value } : l)} />
            <button className="ss-btn-coral ss-btn-block" style={{ marginTop: 20 }} disabled={updateBudget.isPending} onClick={saveLimitEdit}>
              {updateBudget.isPending ? 'Saving…' : 'Save limit'}
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Edit monthly budget modal */}
      {mounted && editMonthly !== null && createPortal(
        <div className="ss-modal-overlay" onClick={() => setEditMonthly(null)}>
          <div className="ss-sheet" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-head)', color: 'var(--text-primary)' }}>Edit monthly budget</h2>
              <button className="ss-icon-btn" onClick={() => setEditMonthly(null)}>✕</button>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>Monthly budget (₹)</div>
            <input className="ss-input" type="number" value={editMonthly} autoFocus onChange={e => setEditMonthly(e.target.value)} />
            <button className="ss-btn-coral ss-btn-block" style={{ marginTop: 20 }} disabled={updateUser.isPending} onClick={saveMonthlyBudget}>
              {updateUser.isPending ? 'Saving…' : 'Save budget'}
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Edit daily limit modal */}
      {mounted && editDaily !== null && createPortal(
        <div className="ss-modal-overlay" onClick={() => setEditDaily(null)}>
          <div className="ss-sheet" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-head)', color: 'var(--text-primary)' }}>Edit daily limit</h2>
              <button className="ss-icon-btn" onClick={() => setEditDaily(null)}>✕</button>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>Daily spending limit (₹)</div>
            <input className="ss-input" type="number" value={editDaily} autoFocus onChange={e => setEditDaily(e.target.value)} />
            <button className="ss-btn-coral ss-btn-block" style={{ marginTop: 20 }} disabled={updateUser.isPending} onClick={saveDailyLimit}>
              {updateUser.isPending ? 'Saving…' : 'Save limit'}
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Add category budget modal */}
      {mounted && addCatBudget !== null && createPortal(
        <div className="ss-modal-overlay" onClick={() => setAddCatBudget(null)}>
          <div className="ss-sheet" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-head)', color: 'var(--text-primary)' }}>Add budget limit</h2>
              <button className="ss-icon-btn" onClick={() => setAddCatBudget(null)}>✕</button>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>Category</div>
            {availableCategories.length === 0 ? (
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>All categories already have a budget limit set.</div>
            ) : (
              <>
                <select
                  className="ss-input"
                  value={addCatBudget.categoryId}
                  onChange={e => setAddCatBudget(b => b ? { ...b, categoryId: e.target.value } : b)}
                  style={{ marginBottom: 16 }}
                >
                  {availableCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>Monthly limit (₹)</div>
                <input
                  className="ss-input"
                  type="number"
                  placeholder="e.g. 5000"
                  value={addCatBudget.amount}
                  onChange={e => setAddCatBudget(b => b ? { ...b, amount: e.target.value } : b)}
                />
                <button
                  className="ss-btn-coral ss-btn-block"
                  style={{ marginTop: 20 }}
                  disabled={createBudget.isPending || !addCatBudget.amount || !addCatBudget.categoryId}
                  onClick={saveAddCatBudget}
                >
                  {createBudget.isPending ? 'Adding…' : 'Add limit'}
                </button>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
