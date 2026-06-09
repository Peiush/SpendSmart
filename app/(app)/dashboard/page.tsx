'use client';
import { useEffect, useState } from 'react';
import { useDashboardSummary } from '@/hooks/useDashboard';
import { useExpenses } from '@/hooks/useExpenses';
import { useBudgets } from '@/hooks/useBudgets';
import { Card, Ring, ProgressBar, SectionTitle, IconDisc, CategoryChip } from '@/components/ui';
import { Sparkline } from '@/components/ui/charts';
import { useCountUp } from '@/hooks/useCountUp';
import { useCatBy } from '@/hooks/useCategories';
import { formatINR, relDate, localDateStr } from '@/lib/utils/format';
import { budgetStatus } from '@/lib/utils/budget';
import { useWeeklyReport } from '@/hooks/useReports';
import { useProcessRecurring } from '@/hooks/useRecurring';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';

function Money({ value, style }: { value: number; style?: React.CSSProperties }) {
  const v = useCountUp(value);
  return <span style={style}>{formatINR(v)}</span>;
}

function getDueLabel(dateStr: string): { label: string; cls: string } {
  const now = new Date();
  const tom = new Date(now); tom.setDate(now.getDate() + 1);
  if (dateStr === localDateStr(now)) return { label: 'Today', cls: 'ss-bill-chip__due--today' };
  if (dateStr === localDateStr(tom)) return { label: 'Tomorrow', cls: 'ss-bill-chip__due--soon' };
  return {
    label: new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
    cls: '',
  };
}

function getHeroGreeting(
  name: string,
  streak: number,
  paceAhead: number,
  todaySpend: number,
  dailyLimit: number,
  spent: number,
): { text: string; emoji: string; sub: string } {
  const now    = new Date();
  const h      = now.getHours();
  const day    = now.getDay();
  const date   = now.getDate();
  const month  = now.toLocaleString('en-IN', { month: 'long' });
  const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - date;
  const first  = name.split(' ')[0];
  const dateStr = now.toLocaleString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const isMorning   = h >= 5  && h < 12;
  const isAfternoon = h >= 12 && h < 17;
  const isEvening   = h >= 17 && h < 21;
  const timeWord    = isMorning ? 'Morning' : isAfternoon ? 'Afternoon' : h >= 21 ? 'Late night' : 'Evening';
  const timeEmoji   = isMorning ? '☀️' : isAfternoon ? '⚡' : h >= 21 ? '🦉' : '🌙';

  if (date === 1)
    return { text: `Fresh start, ${first}`, emoji: '✨', sub: `${month} budget just unlocked.` };
  if (daysLeft <= 3 && spent > 0)
    return { text: `Final stretch, ${first}`, emoji: '🏁', sub: `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left in ${month}.` };
  if (streak >= 10)
    return { text: `${streak} days clean`, emoji: '🔥', sub: `${first}, that streak is something special.` };
  if (streak >= 5)
    return { text: `${streak}-day streak, ${first}`, emoji: '🔥', sub: 'Consistency is paying off.' };
  if (day === 1 && isMorning)
    return { text: `Monday reset, ${first}`, emoji: '🚀', sub: 'New week, clean slate.' };
  if ((day === 0 || day === 6) && !isMorning)
    return { text: `Weekend mode, ${first}`, emoji: '🎉', sub: 'Tracking through the fun.' };
  if (paceAhead > 20)
    return { text: `Watch the pace, ${first}`, emoji: '⚡', sub: `${paceAhead}% ahead of budget pace — adjust today.` };
  if (paceAhead <= 0 && spent > 0)
    return { text: `On track, ${first}`, emoji: '✅', sub: 'Budget pace is looking healthy.' };
  if (isEvening && dailyLimit > 0 && todaySpend < dailyLimit)
    return { text: `Solid day, ${first}`, emoji: '💪', sub: 'Under the daily limit — keep it up.' };
  return { text: `${timeWord}, ${first}`, emoji: timeEmoji, sub: dateStr };
}

export default function DashboardPage() {
  const router = useRouter();
  const processRecurring = useProcessRecurring();
  const [alertDismissed, setAlertDismissed] = useState(false);

  useEffect(() => {
    processRecurring.mutate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: user } = useUser();
  const { data: summary } = useDashboardSummary();
  const { data: expensesData } = useExpenses({ limit: 5 });
  const { data: budgets = [] } = useBudgets();
  const catBy = useCatBy();
  const { data: weekly } = useWeeklyReport(localDateStr());

  const spent = summary?.spent ?? 0;
  const monthlyBudget = summary?.monthlyBudget ?? 0;
  const remaining = summary?.remaining ?? 0;
  const usedPct = monthlyBudget > 0 ? Math.round((spent / monthlyBudget) * 100) : 0;
  const todaySpend = summary?.todaySpend ?? 0;
  const dailyLimit = summary?.dailyLimit ?? 0;
  const dailyPct = dailyLimit > 0 ? Math.round((todaySpend / dailyLimit) * 100) : 0;
  const weekSpend = summary?.weekSpend ?? 0;
  const forecast = summary?.forecast ?? 0;
  const split = summary?.split;
  const insight = summary?.insight;
  const streak = summary?.streak ?? 0;
  const upcomingRecurring = summary?.upcomingRecurring ?? [];
  const expenses = expensesData?.expenses ?? [];
  const forecastOver = forecast - monthlyBudget;

  // Budget pace
  const now = new Date();
  const daysElapsed = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const timePct = Math.round((daysElapsed / daysInMonth) * 100);
  const paceAhead = usedPct - timePct;

  const { text: greetingText, emoji: greetingEmoji, sub } = getHeroGreeting(
    user?.name ?? 'there',
    streak,
    paceAhead,
    todaySpend,
    dailyLimit,
    spent,
  );

  // Budget alert: any category budget >= 90%
  const overBudgets = budgets.filter(
    b => b.categoryId && b.amount > 0 && Math.round((b.spent / b.amount) * 100) >= 90
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* ── Budget overshoot alert banner ── */}
      {!alertDismissed && overBudgets.length > 0 && (
        <div className="ss-alert-banner">
          <span style={{ fontSize: 16 }}>⚠️</span>
          <span className="ss-alert-banner__text">
            {overBudgets.length === 1
              ? `${catBy[overBudgets[0].category?.name ?? '']?.short ?? overBudgets[0].category?.name} is at ${Math.round((overBudgets[0].spent / overBudgets[0].amount) * 100)}% of its budget`
              : `${overBudgets.length} budgets are near or over their limit`
            }
          </span>
          <button className="ss-alert-banner__review" onClick={() => router.push('/budgets')}>Review →</button>
          <button className="ss-alert-banner__dismiss" onClick={() => setAlertDismissed(true)} aria-label="Dismiss">×</button>
        </div>
      )}

      {/* ── Weekly insight digest ── */}
      {insight?.topCategory && (
        <div className="ss-insight-digest">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(232,115,90,.18)', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 2 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontWeight: 800, fontSize: 15, fontFamily: 'var(--font-head)', marginBottom: 4 }}>This week&apos;s insight</div>
              <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,.7)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--coral)' }}>Top: {insight.topCategory}</strong> · {insight.biggestChange}
                <br />{insight.suggestion}
              </div>
            </div>
            <button className="ss-btn-ghost" style={{ fontSize: 12.5, padding: '6px 12px' }} onClick={() => router.push('/reports')}>View reports →</button>
          </div>
        </div>
      )}

      {/* ── Hero card ── */}
      <div className="ss-hero">
        <div className="ss-hero__bloom" />
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <div className="ss-hero-greeting">
              {greetingText}{' '}
              <span style={{ WebkitTextFillColor: 'initial', backgroundClip: 'unset', color: 'initial' }}>{greetingEmoji}</span>
            </div>
            <div className="ss-hero-greeting__sub">{sub}</div>
            <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,.38)', marginTop: 10 }}>
              {now.toLocaleString('en-IN', { month: 'long', year: 'numeric' })} · <Money value={spent} /> spent so far
            </div>
            <div style={{ marginTop: 22 }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', fontWeight: 500 }}>Remaining this month</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <Money value={remaining} style={{ fontSize: 46, fontWeight: 800, fontFamily: 'var(--font-head)', color: 'var(--coral)', lineHeight: 1.1 }} />
                <span style={{ fontSize: 16, color: 'rgba(255,255,255,.5)' }}>left</span>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', marginTop: 4 }}>of {formatINR(monthlyBudget)} budget</div>
            </div>

            {/* Streak + Budget pace badges */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              {streak > 0 && dailyLimit > 0 && (
                <span className="ss-hero-badge ss-hero-badge--fire">
                  🔥 {streak} day streak
                </span>
              )}
              {monthlyBudget > 0 && spent > 0 && (
                <span className={`ss-hero-badge ${paceAhead > 15 ? 'ss-hero-badge--warn' : paceAhead > 5 ? 'ss-hero-badge--amber' : 'ss-hero-badge--ok'}`}>
                  {paceAhead > 15 ? '📈' : paceAhead > 5 ? '📊' : '✓'}{' '}
                  Day {daysElapsed} · {paceAhead > 5 ? `${paceAhead}% ahead of pace` : 'On pace'}
                </span>
              )}
            </div>
          </div>

          <Ring pct={usedPct} size={108} stroke={11}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-head)' }}>{usedPct}%</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', fontWeight: 600 }}>used</div>
            </div>
          </Ring>
        </div>
      </div>

      {/* ── Upcoming bills strip ── */}
      {upcomingRecurring.length > 0 && (
        <div>
          <SectionTitle action={<span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Next 7 days</span>}>Due soon</SectionTitle>
          <div className="ss-hscroll" style={{ paddingBottom: 4 }}>
            {upcomingRecurring.map(r => {
              const { label, cls } = getDueLabel(r.nextDueDate);
              return (
                <div key={r.id} className="ss-bill-chip">
                  <div
                    className="ss-bill-chip__icon"
                    style={{ background: r.category.colorHex + '22', border: `1px solid ${r.category.colorHex}33` }}
                  >
                    {r.category.icon}
                  </div>
                  <div>
                    <div className="ss-bill-chip__name">{r.merchant}</div>
                    <div className="ss-bill-chip__meta">
                      {formatINR(r.amount)} · <span className={cls}>{label}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Stat cards + Forecast — 3 columns on wide desktop ── */}
      <div className="ss-stats-3">
        <Card hover style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Today&apos;s Spend</div>
          <Money value={todaySpend} style={{ fontSize: 30, fontWeight: 800, fontFamily: 'var(--font-head)', color: 'var(--text-primary)', display: 'block', margin: '6px 0 12px' }} />
          <ProgressBar pct={dailyPct} color={dailyPct > 100 ? '#E05252' : '#4CAF82'} height={8} />
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            {dailyPct}% of {formatINR(dailyLimit)} daily limit
            {dailyPct > 100 && <span style={{ color: '#E05252', fontWeight: 700 }}> · Over by {formatINR(todaySpend - dailyLimit)}</span>}
          </div>
        </Card>
        <Card hover style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>This Week</div>
              <Money value={weekSpend} style={{ fontSize: 30, fontWeight: 800, fontFamily: 'var(--font-head)', color: 'var(--text-primary)', display: 'block', marginTop: 6 }} />
            </div>
            {weekly?.days && <Sparkline data={weekly.days.map(d => d.spend)} height={42} />}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>across 7 days</div>
        </Card>
        {/* Forecast shown inline at ≥1200px; hidden (shown standalone below at smaller) */}
        <div className="ss-forecast-inline">
          <Card style={{ padding: 20, background: forecastOver > 0 ? '#FFF6E5' : '#EAF7F0', border: `1px solid ${forecastOver > 0 ? '#F6E3BC' : '#B8E8D0'}`, height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: forecastOver > 0 ? 'rgba(245,166,35,.18)' : 'rgba(76,175,130,.18)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  {forecastOver > 0
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={forecastOver > 0 ? '#946417' : '#15803D'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  }
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Month Forecast</div>
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, fontFamily: 'var(--font-head)', color: forecastOver > 0 ? '#8A5A12' : '#15803D' }}>{formatINR(forecast)}</div>
              <div style={{ fontSize: 12.5, color: forecastOver > 0 ? '#946417' : '#15803D', flex: 1 }}>
                {forecastOver > 0 ? `${formatINR(forecastOver)} over budget` : 'On track to stay within budget'}
              </div>
              <button className="ss-btn-ghost" style={{ fontSize: 12, padding: '5px 10px', background: forecastOver > 0 ? 'rgba(245,166,35,.15)' : 'rgba(76,175,130,.15)', color: forecastOver > 0 ? '#946417' : '#15803D', alignSelf: 'flex-start' }} onClick={() => router.push('/reports')}>Details</button>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Forecast — standalone at tablet/mobile (<1200px) ── */}
      <Card className="ss-forecast-standalone" style={{ padding: 20, background: forecastOver > 0 ? '#FFF6E5' : '#EAF7F0', border: `1px solid ${forecastOver > 0 ? '#F6E3BC' : '#B8E8D0'}` }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: forecastOver > 0 ? 'rgba(245,166,35,.18)' : 'rgba(76,175,130,.18)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            {forecastOver > 0
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#946417" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            }
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontWeight: 700, fontSize: 14.5, color: forecastOver > 0 ? '#8A5A12' : '#15803D', fontFamily: 'var(--font-head)' }}>
              Month-end forecast: <strong>{formatINR(forecast)}</strong>
            </div>
            <div style={{ fontSize: 13, color: forecastOver > 0 ? '#946417' : '#15803D', marginTop: 3 }}>
              {forecastOver > 0 ? `At this pace you'll be ${formatINR(forecastOver)} over budget.` : 'Great pace — on track to stay within budget!'}
            </div>
          </div>
          <button className="ss-btn-ghost" style={{ fontSize: 12.5, padding: '6px 12px', background: forecastOver > 0 ? 'rgba(245,166,35,.15)' : 'rgba(76,175,130,.15)', color: forecastOver > 0 ? '#946417' : '#15803D' }} onClick={() => router.push('/reports')}>Details</button>
        </div>
      </Card>

      {/* ── 50/30/20 split ── */}
      {split && (
        <Card style={{ padding: 20 }}>
          <SectionTitle action={<span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>50/30/20 rule</span>}>Spending split</SectionTitle>
          <div className="ss-split-bar" style={{ marginBottom: 14 }}>
            <div style={{ width: split.needs.pct + '%', background: '#2A6FDB', transition: 'width 1.1s' }} />
            <div style={{ width: split.wants.pct + '%', background: 'var(--coral)', transition: 'width 1.1s' }} />
            <div style={{ width: split.savings.pct + '%', background: '#4CAF82', transition: 'width 1.1s' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              { label: 'Needs', color: '#2A6FDB', bg: '#EAF1FB', ...split.needs },
              { label: 'Wants', color: '#C2410C', bg: '#FBEFE8', ...split.wants },
              { label: 'Savings', color: '#15803D', bg: '#D6F5DC', ...split.savings },
            ].map(({ label, color, bg, pct, target, amount }) => (
              <div key={label} style={{ background: bg, borderRadius: 14, padding: '12px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-head)', color }}>{pct}%</div>
                <div style={{ fontSize: 11.5, color, opacity: .75, marginTop: 2 }}>{formatINR(amount)}</div>
                <div style={{ fontSize: 11, color, opacity: .55, marginTop: 2 }}>target {target}%</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Budget status ── */}
      {budgets.length > 0 && (
        <div>
          <SectionTitle action={<button className="ss-link" onClick={() => router.push('/budgets')}>View all</button>}>Budget status</SectionTitle>
          <div className="ss-budget-grid">
            {budgets.filter(b => b.categoryId).map(b => {
              const cat = catBy[b.category?.name ?? ''];
              if (!cat) return null;
              const pct = Math.round((b.spent / b.amount) * 100);
              const st = budgetStatus(pct);
              return (
                <Card key={b.id} style={{ padding: 16, minWidth: 184, flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
                    <IconDisc category={cat} size={36} />
                    <div style={{ fontSize: 13.5, fontWeight: 700, fontFamily: 'var(--font-head)', color: 'var(--text-primary)' }}>{cat.short}</div>
                    {pct >= 100 && <span className="ss-pulse-dot" style={{ marginLeft: 'auto' }} />}
                  </div>
                  <ProgressBar pct={pct} color={st.color} height={8} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 9, fontSize: 12 }}>
                    <span style={{ color: st.color, fontWeight: 700 }}>{formatINR(b.spent)}</span>
                    <span style={{ color: 'var(--text-muted)' }}>/ {formatINR(b.amount)}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Recent expenses + Smart insight ── */}
      <div className="ss-grid-recent">
        <div>
          <SectionTitle action={<button className="ss-link" onClick={() => router.push('/expenses')}>See all</button>}>Recent expenses</SectionTitle>
          <Card style={{ padding: 8 }}>
            {expenses.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No expenses yet. Add your first one!</div>}
            {expenses.map((e, i) => {
              const cat = catBy[e.category?.name ?? ''];
              if (!cat) return null;
              return (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 12px', borderBottom: i < expenses.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <IconDisc category={cat} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text-primary)', fontFamily: 'var(--font-head)' }}>{e.merchant}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <CategoryChip category={cat} />
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{relDate(e.date)}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', fontFamily: 'var(--font-head)' }}>−{formatINR(e.amount)}</div>
                    <span className={'ss-need-badge ' + (e.type === 'Needs' ? 'is-need' : 'is-want')}>{e.type}</span>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
        <div>
          <SectionTitle>Smart insight</SectionTitle>
          <Card style={{ padding: 22, background: 'var(--coral-light)', border: '1px solid #FAD9CE' }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(232,115,90,.15)', display: 'grid', placeItems: 'center', marginBottom: 14 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </div>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: '#7A3A2A', fontWeight: 500 }}>
              {insight?.suggestion ?? 'Add expenses to see personalized insights.'}
            </p>
            <div style={{ marginTop: 16 }}>
              <button className="ss-btn-ghost" onClick={() => router.push('/reports')}>View report</button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
