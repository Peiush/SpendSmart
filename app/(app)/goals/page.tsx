'use client';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useGoals, useCreateGoal, useUpdateGoal, useAddFunds, useCheckAutoAllocate, useConfirmAutoAllocate, useStreak } from '@/hooks/useGoals';
import { Card, ProgressBar, Toggle } from '@/components/ui';
import { formatINR } from '@/lib/utils/format';
import { useMounted } from '@/hooks/useMounted';
import type { CreateGoalInput } from '@/types';

const EMOJI_OPTIONS = ['✈️','🏦','💻','🏠','🚗','💍','📱','🎓','🏋️','🎯','🌴','💰'];

function streakLabel(n: number) {
  if (n === 0) return 'No streak yet';
  if (n === 1) return '1-day saving streak!';
  return `${n}-day saving streak!`;
}

function streakMotivation(n: number) {
  if (n === 0) return 'Log a savings expense today to start your streak.';
  if (n < 3) return 'Great start — keep it up!';
  if (n < 7) return 'You\'re building momentum. Don\'t break the chain!';
  if (n < 14) return 'Impressive! A week+ of consistent saving.';
  if (n < 30) return 'Keep going — you\'re building a great habit.';
  return 'Outstanding! You\'re a saving machine. 🏆';
}

export default function GoalsPage() {
  const mounted = useMounted();
  const { data: goals = [], isLoading } = useGoals();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const addFundsMutation = useAddFunds();

  const { data: streakData } = useStreak();
  const { data: allocCheck } = useCheckAutoAllocate();
  const confirmAlloc = useConfirmAutoAllocate();
  const [allocDone, setAllocDone] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [addFundsGoal, setAddFundsGoal] = useState<typeof goals[0] | null>(null);
  const [fundsAmount, setFundsAmount] = useState('');
  const [newGoal, setNewGoal] = useState<{ name: string; emoji: string; target: string; deadline: string }>({ name: '', emoji: '🎯', target: '', deadline: '' });

  const handleConfirmAlloc = () => {
    confirmAlloc.mutate(undefined, {
      onSuccess: () => setAllocDone(true),
    });
  };

  const handleCreate = async () => {
    if (!newGoal.name || !newGoal.target) return;
    const input: CreateGoalInput = { name: newGoal.name, emoji: newGoal.emoji, targetAmount: Number(newGoal.target), deadline: newGoal.deadline || undefined };
    await createGoal.mutateAsync(input);
    setShowCreate(false);
    setNewGoal({ name: '', emoji: '🎯', target: '', deadline: '' });
  };

  const handleAddFunds = async () => {
    if (!addFundsGoal || !fundsAmount) return;
    await addFundsMutation.mutateAsync({ id: addFundsGoal.id, amount: Number(fundsAmount) });
    setAddFundsGoal(null);
    setFundsAmount('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-head)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>Your goals 🎯</h2>
        <button className="ss-btn-coral" onClick={() => setShowCreate(true)}>+ New goal</button>
      </div>

      {allocCheck?.pending && !allocDone && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 18px', borderRadius: 14, background: '#FFF6E5', border: '1.5px solid #F5A623', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>💰</span>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#7a4f10' }}>
                {allocCheck.monthLabel} had <strong>{formatINR(allocCheck.surplus!)}</strong> budget surplus
              </div>
              <div style={{ fontSize: 12, color: '#a07030', marginTop: 2 }}>
                Distribute to {allocCheck.distributions!.length} auto-allocate goal{allocCheck.distributions!.length > 1 ? 's' : ''}?
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="ss-btn-outline ss-btn-sm"
              onClick={() => setAllocDone(true)}
              style={{ fontSize: 12 }}
            >
              Skip
            </button>
            <button
              className="ss-btn-coral ss-btn-sm"
              onClick={handleConfirmAlloc}
              disabled={confirmAlloc.isPending}
              style={{ fontSize: 12 }}
            >
              {confirmAlloc.isPending ? 'Allocating…' : 'Yes, allocate'}
            </button>
          </div>
        </div>
      )}

      {allocDone && confirmAlloc.data?.allocated && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 18px', borderRadius: 14, background: '#EAF7F0', border: '1.5px solid #4CAF82' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>✨</span>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: '#2d7a52' }}>
              <strong>{formatINR(confirmAlloc.data.surplus!)}</strong> distributed to {confirmAlloc.data.distributions!.length} goal{confirmAlloc.data.distributions!.length > 1 ? 's' : ''}
            </span>
          </div>
          <button onClick={() => setAllocDone(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#4CAF82', padding: '0 4px' }}>✕</button>
        </div>
      )}

      {isLoading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading…</div>}

      <div className="ss-grid-goals">
        {goals.map(g => {
          const pct = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;
          const more = g.targetAmount - g.currentAmount;
          return (
            <Card key={g.id} hover style={{ padding: 22 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 56, height: 56, borderRadius: 18, background: 'var(--coral-light)', display: 'grid', placeItems: 'center', fontSize: 28, flexShrink: 0 }}>{g.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 17, fontFamily: 'var(--font-head)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{g.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{formatINR(g.currentAmount)} of {formatINR(g.targetAmount)}</div>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-head)', color: g.color }}>{pct}%</div>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <ProgressBar pct={pct} color={g.color} height={10} />
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 10 }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{formatINR(more)} more</strong>
                    {g.deadline && <> · Target: {new Date(g.deadline).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
                    <button className="ss-btn-outline ss-btn-sm" onClick={() => { setAddFundsGoal(g); setFundsAmount(''); }}>+ Add funds</button>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600 }}>
                      Auto-allocate
                      <Toggle on={g.autoAllocate} onChange={v => updateGoal.mutate({ id: g.id, autoAllocate: v })} />
                    </label>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
        {!isLoading && goals.length === 0 && (
          <Card style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1', fontSize: 14 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎯</div>
            No goals yet. Create your first savings goal!
          </Card>
        )}
      </div>

      {/* Streak */}
      <Card style={{ padding: '22px 24px', background: 'var(--dark-card)', color: '#fff' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 36, lineHeight: 1 }}>{(streakData?.streak ?? 0) > 0 ? '🔥' : '💤'}</div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontWeight: 800, fontSize: 18, fontFamily: 'var(--font-head)' }}>
                {streakLabel(streakData?.streak ?? 0)}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', marginTop: 3 }}>
                {streakMotivation(streakData?.streak ?? 0)}
              </div>
            </div>
            {/* Best streak badge */}
            {(streakData?.best ?? 0) > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,.08)', borderRadius: 14, padding: '10px 16px', minWidth: 64 }}>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-head)', color: '#FFD700' }}>{streakData!.best}</div>
                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,.45)', marginTop: 2, textAlign: 'center', lineHeight: 1.3 }}>best<br/>streak</div>
              </div>
            )}
          </div>

          {/* Week dots */}
          <div style={{ display: 'flex', gap: 0, justifyContent: 'space-between' }}>
            {['M','T','W','T','F','S','S'].map((d, i) => {
              const active = streakData?.weekActivity?.[i] ?? false;
              const today = new Date();
              const dow = today.getDay();
              const todayIdx = dow === 0 ? 6 : dow - 1;
              const isFuture = i > todayIdx;
              return (
                <div key={i} style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto',
                    background: active ? 'var(--coral)' : isFuture ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.1)',
                    color: active ? '#fff' : isFuture ? 'rgba(255,255,255,.15)' : 'rgba(255,255,255,.3)',
                    fontSize: 14, fontWeight: 700,
                    boxShadow: active ? '0 2px 10px rgba(232,115,90,.5)' : 'none',
                    border: i === todayIdx && !active ? '1.5px solid rgba(255,255,255,.25)' : 'none',
                    transition: 'background .2s',
                  }}>
                    {active ? '✓' : isFuture ? '' : '–'}
                  </div>
                  <div style={{ fontSize: 11, color: i === todayIdx ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.35)', marginTop: 6, fontWeight: i === todayIdx ? 700 : 400 }}>{d}</div>
                </div>
              );
            })}
          </div>

          {/* Footer hint */}
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 14 }}>
            Streak counts days you logged a savings expense
          </div>
        </div>
      </Card>

      {/* Create goal modal */}
      {mounted && showCreate && createPortal(
        <div className="ss-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="ss-sheet" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-head)', color: 'var(--text-primary)' }}>New savings goal</h2>
              <button className="ss-icon-btn" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <div style={{ height: 1, background: 'var(--border)', marginBottom: 20 }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10 }}>Icon</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {EMOJI_OPTIONS.map(em => (
                <button key={em} onClick={() => setNewGoal(g => ({ ...g, emoji: em }))}
                  style={{ width: 44, height: 44, fontSize: 22, borderRadius: 12, border: '1.5px solid', borderColor: newGoal.emoji === em ? 'var(--coral)' : 'var(--border)', background: newGoal.emoji === em ? 'var(--coral-light)' : 'var(--bg)', cursor: 'pointer', transition: 'all .15s' }}>
                  {em}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>Goal name</div>
            <input className="ss-input" placeholder="e.g. Travel Fund" value={newGoal.name} autoFocus onChange={e => setNewGoal(g => ({ ...g, name: e.target.value }))} style={{ marginBottom: 14, background: 'var(--bg)' }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>Target amount (₹)</div>
            <input className="ss-input" type="number" placeholder="50000" value={newGoal.target} onChange={e => setNewGoal(g => ({ ...g, target: e.target.value }))} style={{ marginBottom: 14, background: 'var(--bg)' }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>Deadline (optional)</div>
            <input className="ss-input" type="date" value={newGoal.deadline} onChange={e => setNewGoal(g => ({ ...g, deadline: e.target.value }))} style={{ marginBottom: 24, background: 'var(--bg)' }} />
            <button className="ss-btn-coral ss-btn-block" disabled={!newGoal.name || !newGoal.target || createGoal.isPending} onClick={handleCreate}>
              {createGoal.isPending ? 'Creating…' : 'Create goal'}
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Add funds modal */}
      {mounted && addFundsGoal && createPortal(
        <div className="ss-modal-overlay" onClick={() => setAddFundsGoal(null)}>
          <div className="ss-sheet" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-head)', color: 'var(--text-primary)' }}>Add funds</h2>
              <button className="ss-icon-btn" onClick={() => setAddFundsGoal(null)}>✕</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 50, height: 50, borderRadius: 16, background: 'var(--coral-light)', display: 'grid', placeItems: 'center', fontSize: 24 }}>{addFundsGoal.emoji}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-head)', color: 'var(--text-primary)' }}>{addFundsGoal.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{formatINR(addFundsGoal.currentAmount)} saved of {formatINR(addFundsGoal.targetAmount)}</div>
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-muted)' }}>₹</span>
                <input className="ss-amount-input" style={{ width: 180, fontSize: 44 }} inputMode="numeric" placeholder="0"
                  value={fundsAmount} autoFocus onChange={e => setFundsAmount(e.target.value.replace(/[^0-9]/g, ''))} />
              </div>
            </div>
            <button className="ss-btn-coral ss-btn-block" style={{ marginTop: 16 }} disabled={!fundsAmount || addFundsMutation.isPending} onClick={handleAddFunds}>
              {addFundsMutation.isPending ? 'Adding…' : 'Add to goal'}
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
