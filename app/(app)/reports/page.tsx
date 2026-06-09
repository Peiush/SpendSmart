'use client';
import { useState } from 'react';
import { useWeeklyReport, useMonthlyReport, useDailyReport } from '@/hooks/useReports';
import { Card, ChangeBadge, SectionTitle } from '@/components/ui';
import { GroupedBars, DayBars, Donut } from '@/components/ui/charts';
import { formatINR } from '@/lib/utils/format';

function getWeekKey(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() - offset * 7);
  return d.toISOString().slice(0, 10);
}
function getWeekLabel(offset: number) {
  const end = new Date();
  end.setDate(end.getDate() - offset * 7);
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  return `${start.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`;
}
function getMonthKey(offset: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - offset);
  return d.toISOString().slice(0, 7);
}
function getMonthLabel(offset: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - offset);
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

function PeriodNav({ label, onPrev, onNext, canPrev, canNext }: { label: string; onPrev: () => void; onNext: () => void; canPrev: boolean; canNext: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <button className="ss-nav-arrow" onClick={onPrev} disabled={!canPrev}>‹</button>
      <span style={{ fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-head)', color: 'var(--text-primary)', minWidth: 140, textAlign: 'center' }}>{label}</span>
      <button className="ss-nav-arrow" onClick={onNext} disabled={!canNext}>›</button>
    </div>
  );
}

function WeeklyReport() {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekKey = getWeekKey(weekOffset);
  const { data, isLoading } = useWeeklyReport(weekKey);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <Card style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--text-primary)' }}>This week vs last week</h2>
          <PeriodNav label={getWeekLabel(weekOffset)} onPrev={() => setWeekOffset(w => w + 1)} onNext={() => setWeekOffset(w => w - 1)} canPrev={weekOffset < 8} canNext={weekOffset > 0} />
        </div>
        {isLoading ? <div style={{ height: 226, display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>Loading…</div> : data?.bars?.length ? <GroupedBars data={data.bars} /> : <div style={{ height: 226, display: 'grid', placeItems: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No data for this week yet.</div>}
      </Card>

      {data?.changes && data.changes.length > 0 && (
        <div>
          <SectionTitle>Category changes</SectionTitle>
          <div className="ss-hscroll">
            {data.changes.map(c => (
              <Card key={c.name} style={{ padding: 18, minWidth: 200, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 26 }}>{c.icon}</span>
                  <ChangeBadge change={c.change} dir={c.dir} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, marginTop: 10, fontFamily: 'var(--font-head)', color: 'var(--text-primary)' }}>{c.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{formatINR(c.thisWeek)}</strong> this · {formatINR(c.lastWeek)} last
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {data?.days && (
        <Card style={{ padding: 24 }}>
          <SectionTitle>Top spend days</SectionTitle>
          <DayBars data={data.days} />
        </Card>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="ss-btn-outline ss-btn-sm" onClick={() => window.print()}>⬇ Export PDF</button>
        <a className="ss-btn-outline ss-btn-sm" href={`/api/expenses/export?month=${getMonthKey(0)}`} download>⬇ Export CSV</a>
      </div>
    </div>
  );
}

function MonthlyReport() {
  const [monthOffset, setMonthOffset] = useState(0);
  const [income, setIncome] = useState(0);
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState('');
  const monthKey = getMonthKey(monthOffset);
  const { data, isLoading } = useMonthlyReport(monthKey);
  const totalSpent = data?.donut?.reduce((s, d) => s + d.value, 0) ?? 0;
  const netSavings = income > 0 ? income - totalSpent : null;
  const over = (data?.forecast ?? 0) - 20000;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <Card style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--text-primary)' }}>Category breakdown</h2>
          <PeriodNav label={getMonthLabel(monthOffset)} onPrev={() => setMonthOffset(m => m + 1)} onNext={() => setMonthOffset(m => m - 1)} canPrev={monthOffset < 11} canNext={monthOffset > 0} />
        </div>
        {isLoading ? <div style={{ height: 200, display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>Loading…</div> : data?.donut?.length ? <Donut data={data.donut} /> : <div style={{ height: 200, display: 'grid', placeItems: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No expenses this month yet.</div>}
      </Card>

      {/* Income vs expense */}
      <Card style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-head)', color: 'var(--text-primary)' }}>Income vs Expenses</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>Add income to see net savings</div>
          </div>
          {!editingIncome ? (
            <button className="ss-btn-outline ss-btn-sm" onClick={() => { setEditingIncome(true); setIncomeInput(income > 0 ? String(income) : ''); }}>
              {income > 0 ? `₹${income.toLocaleString('en-IN')} income` : '+ Add income'}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input className="ss-input" style={{ width: 130, padding: '8px 12px', fontSize: 14 }} placeholder="Monthly income" type="number" autoFocus value={incomeInput} onChange={e => setIncomeInput(e.target.value)} />
              <button className="ss-btn-coral ss-btn-sm" onClick={() => { setIncome(Number(incomeInput) || 0); setEditingIncome(false); }}>Save</button>
            </div>
          )}
        </div>
        {income > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 18 }}>
            {[
              { label: 'Income', value: income, color: '#15803D', bg: '#D6F5DC' },
              { label: 'Spent', value: totalSpent, color: '#C2410C', bg: '#FBEFE8' },
              { label: 'Net savings', value: netSavings!, color: (netSavings ?? 0) >= 0 ? '#15803D' : '#E05252', bg: (netSavings ?? 0) >= 0 ? '#D6F5DC' : '#FDECEC' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ background: bg, borderRadius: 14, padding: '12px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-head)', color }}>{formatINR(value)}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* MoM table */}
      {data?.table && data.table.length > 0 && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px 6px' }}>
            <h2 style={{ margin: 0, fontSize: 16, fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--text-primary)' }}>Month over month</h2>
          </div>
          <div className="ss-mom">
            <div className="ss-mom__head"><span>Category</span><span>This</span><span>Last</span><span>3M avg</span><span style={{ textAlign: 'right' }}>Change</span></div>
            {data.table.map(r => (
              <div className="ss-mom__row" key={r.category}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 600, color: 'var(--text-primary)' }}><span style={{ fontSize: 17 }}>{r.icon}</span>{r.category}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatINR(r.thisMonth)}</span>
                <span style={{ color: 'var(--text-muted)' }}>{formatINR(r.lastMonth)}</span>
                <span style={{ color: 'var(--text-muted)' }}>{formatINR(r.threeAvg)}</span>
                <span style={{ textAlign: 'right' }}><ChangeBadge change={r.change} dir={r.dir} /></span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {data?.forecast && (
        <Card style={{ padding: 22, background: '#FFF6E5', border: '1px solid #F6E3BC' }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ fontSize: 28 }}>📈</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15.5, color: '#8A5A12', fontFamily: 'var(--font-head)' }}>Spending forecast</div>
              <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.55, color: '#946417' }}>
                At your current pace you&apos;ll spend <strong>{formatINR(data.forecast)}</strong> by month end{over > 0 && <> — <strong>{formatINR(over)} over</strong> budget</>}.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="ss-btn-outline ss-btn-sm" onClick={() => window.print()}>⬇ Export PDF</button>
        <a className="ss-btn-outline ss-btn-sm" href={`/api/expenses/export?month=${monthKey}`} download>⬇ Export CSV</a>
      </div>
    </div>
  );
}

function DailyReport() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const { data, isLoading } = useDailyReport(date);

  function shiftDate(days: number) {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().slice(0, 10));
  }

  const canNext = date < today;
  const friendlyDate = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const changePct = data && data.prevDayTotal > 0
    ? Math.round(((data.total - data.prevDayTotal) / data.prevDayTotal) * 100)
    : null;
  const changeDir = changePct === null ? 'flat' : changePct > 0 ? 'up' : changePct < 0 ? 'down' : 'flat';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Date picker + nav */}
      <Card style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--text-primary)' }}>Daily breakdown</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="ss-nav-arrow" onClick={() => shiftDate(-1)}>‹</button>
            <input
              type="date"
              value={date}
              max={today}
              onChange={e => e.target.value && setDate(e.target.value)}
              style={{
                border: '1.5px solid var(--border)',
                borderRadius: 10,
                padding: '7px 12px',
                fontSize: 14,
                fontFamily: 'var(--font-body)',
                color: 'var(--text-primary)',
                background: 'var(--card)',
                cursor: 'pointer',
                outline: 'none',
              }}
            />
            <button className="ss-nav-arrow" onClick={() => shiftDate(1)} disabled={!canNext}>›</button>
          </div>
        </div>

        <div style={{ marginTop: 18, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>{friendlyDate}</div>
            {isLoading ? (
              <div style={{ fontSize: 30, fontWeight: 800, fontFamily: 'var(--font-head)', color: 'var(--text-primary)' }}>—</div>
            ) : (
              <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-head)', color: 'var(--coral)' }}>{formatINR(data?.total ?? 0)}</div>
            )}
            {!isLoading && data?.prevDayTotal > 0 && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                vs {formatINR(data.prevDayTotal)} yesterday
              </div>
            )}
          </div>
          {changePct !== null && (
            <ChangeBadge change={Math.abs(changePct)} dir={changeDir} />
          )}
        </div>
      </Card>

      {/* Category summary pills */}
      {!isLoading && data?.byCategory && data.byCategory.length > 0 && (
        <div>
          <SectionTitle>By category</SectionTitle>
          <div className="ss-hscroll">
            {data.byCategory.map(cat => (
              <Card key={cat.name} style={{ padding: 18, minWidth: 170, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: cat.tintHex || '#FDF0EC', display: 'grid', placeItems: 'center', fontSize: 20 }}>{cat.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-head)', color: 'var(--text-primary)' }}>{cat.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cat.count} expense{cat.count !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-head)', color: cat.color || 'var(--coral)' }}>{formatINR(cat.amount)}</div>
                {data.total > 0 && (
                  <div style={{ marginTop: 8, height: 4, borderRadius: 4, background: 'var(--border)' }}>
                    <div style={{ height: '100%', borderRadius: 4, background: cat.color || 'var(--coral)', width: `${Math.min(100, Math.round((cat.amount / data.total) * 100))}%`, transition: 'width 0.4s ease' }} />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Expense list */}
      {!isLoading && data && (
        data.expenses.length === 0 ? (
          <Card style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗓️</div>
            <div style={{ fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-head)', color: 'var(--text-primary)', marginBottom: 6 }}>No expenses on this day</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Try selecting a different date above.</div>
          </Card>
        ) : (
          <div>
            <SectionTitle>{data.expenses.length} expense{data.expenses.length !== 1 ? 's' : ''}</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.expenses.map(expense => (
                <Card key={expense.id} style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 13, flexShrink: 0,
                      background: expense.category.tintHex || '#FDF0EC',
                      display: 'grid', placeItems: 'center', fontSize: 22,
                    }}>
                      {expense.category.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', fontFamily: 'var(--font-head)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {expense.merchant}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{
                          background: expense.category.tintHex || '#FDF0EC',
                          color: expense.category.colorHex || 'var(--coral)',
                          borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700,
                        }}>
                          {expense.category.short}
                        </span>
                        <span>{expense.type}</span>
                        {expense.note && <span style={{ fontStyle: 'italic' }}>{expense.note}</span>}
                        {expense.tags?.length > 0 && (
                          <span style={{ color: 'var(--text-muted)' }}>{expense.tags.map(t => `#${t}`).join(' ')}</span>
                        )}
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 17, fontFamily: 'var(--font-head)', color: 'var(--text-primary)', flexShrink: 0 }}>
                      {formatINR(expense.amount)}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )
      )}

      {isLoading && (
        <Card style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</Card>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState<'weekly' | 'monthly' | 'daily'>('weekly');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div className="ss-segment" style={{ alignSelf: 'flex-start' }}>
        {(['weekly', 'monthly', 'daily'] as const).map(t => (
          <button key={t} className={'ss-segment__btn ' + (tab === t ? 'is-active' : '')} onClick={() => setTab(t)}>
            {t === 'weekly' ? 'Weekly' : t === 'monthly' ? 'Monthly' : 'Daily'}
          </button>
        ))}
      </div>
      {tab === 'weekly' ? <WeeklyReport /> : tab === 'monthly' ? <MonthlyReport /> : <DailyReport />}
    </div>
  );
}
