'use client';
import { useState } from 'react';
import { useExpenses } from '@/hooks/useExpenses';
import { useCategories, useCatBy } from '@/hooks/useCategories';
import { Card, IconDisc, CategoryChip } from '@/components/ui';
import { useUIStore } from '@/stores/uiStore';
import { formatINR, relDate } from '@/lib/utils/format';
import type { ExpenseFilters, ExpenseType } from '@/types';

export default function ExpensesPage() {
  const { data: categories = [] } = useCategories();
  const catBy = useCatBy();

  const { openEditExpense } = useUIStore();

  const [q, setQ] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<ExpenseType | 'All'>('All');
  const [minAmt, setMinAmt] = useState('');
  const [maxAmt, setMaxAmt] = useState('');
  const [sortBy, setSortBy] = useState<ExpenseFilters['sort']>('date-desc');
  const [tagQ, setTagQ] = useState('');

  const filters: ExpenseFilters = {
    q: q || undefined,
    category: selectedCats.length === 1 ? selectedCats[0] : undefined,
    type: selectedType !== 'All' ? selectedType : undefined,
    minAmount: minAmt ? Number(minAmt) : undefined,
    maxAmount: maxAmt ? Number(maxAmt) : undefined,
    sort: sortBy,
    tag: tagQ || undefined,
    limit: 100,
  };

  const { data, isLoading } = useExpenses(filters);
  const expenses = data?.expenses ?? [];

  const toggleCat = (name: string) =>
    setSelectedCats(prev => prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]);

  const activeFilters = selectedCats.length + (selectedType !== 'All' ? 1 : 0) + (minAmt || maxAmt ? 1 : 0) + (tagQ ? 1 : 0);
  const clearFilters = () => { setSelectedCats([]); setSelectedType('All'); setMinAmt(''); setMaxAmt(''); setTagQ(''); setSortBy('date-desc'); };

  // Group by date
  const groups: Record<string, typeof expenses> = {};
  expenses.forEach(e => { (groups[e.date] = groups[e.date] || []).push(e); });
  const dates = Object.keys(groups).sort().reverse();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Search + sort */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
          <input className="ss-input" value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search merchant, category, tags…" style={{ paddingLeft: 44 }} />
        </div>
        <button className="ss-icon-btn" onClick={() => setShowFilter(v => !v)}
          style={{ background: showFilter || activeFilters > 0 ? 'var(--coral-light)' : undefined, borderColor: showFilter || activeFilters > 0 ? 'var(--coral)' : undefined, position: 'relative' }}>
          ⚙️
          {activeFilters > 0 && <span style={{ position: 'absolute', top: -5, right: -5, background: 'var(--coral)', color: '#fff', borderRadius: '50%', width: 17, height: 17, fontSize: 10, fontWeight: 800, display: 'grid', placeItems: 'center' }}>{activeFilters}</span>}
        </button>
        <select className="ss-input" style={{ width: 'auto', paddingLeft: 12, paddingRight: 12, cursor: 'pointer' }}
          value={sortBy} onChange={e => setSortBy(e.target.value as ExpenseFilters['sort'])}>
          <option value="date-desc">Date ↓</option>
          <option value="date-asc">Date ↑</option>
          <option value="amount-desc">Amount ↓</option>
          <option value="amount-asc">Amount ↑</option>
        </select>
      </div>

      {/* Filter panel */}
      {showFilter && (
        <div className="ss-filter-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-head)', color: 'var(--text-primary)' }}>Filters</span>
            <button className="ss-link" onClick={clearFilters} style={{ fontSize: 13 }}>Clear all</button>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div className="ss-filter-label">Category</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {categories.slice(0, 8).map(c => {
                const active = selectedCats.includes(c.name);
                return (
                  <button key={c.id} className="ss-cat-chip-sel"
                    style={{ background: active ? c.tintHex : 'var(--bg)', color: active ? c.colorHex : 'var(--text-muted)', borderColor: active ? c.colorHex : 'transparent' }}
                    onClick={() => toggleCat(c.name)}>
                    {c.icon} {c.short}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="ss-filter-grid">
            <div>
              <div className="ss-filter-label">Type</div>
              <div style={{ display: 'flex', gap: 5 }}>
                {(['All', 'Needs', 'Wants'] as const).map(t => (
                  <button key={t} onClick={() => setSelectedType(t)}
                    style={{ flex: 1, padding: '7px 4px', border: '1.5px solid', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', background: selectedType === t ? 'var(--coral-light)' : 'var(--bg)', borderColor: selectedType === t ? 'var(--coral)' : 'var(--border)', color: selectedType === t ? 'var(--coral-dark)' : 'var(--text-muted)' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="ss-filter-label">Tag</div>
              <input className="ss-input" style={{ padding: '9px 12px', fontSize: 13 }} placeholder="#tag" value={tagQ} onChange={e => setTagQ(e.target.value)} />
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <div className="ss-filter-label">Amount range (₹)</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input className="ss-input" style={{ padding: '9px 12px', fontSize: 13 }} placeholder="Min" type="number" value={minAmt} onChange={e => setMinAmt(e.target.value)} />
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>–</span>
              <input className="ss-input" style={{ padding: '9px 12px', fontSize: 13 }} placeholder="Max" type="number" value={maxAmt} onChange={e => setMaxAmt(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {(activeFilters > 0 || q) && !isLoading && (
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
          {expenses.length} result{expenses.length !== 1 ? 's' : ''} found
        </div>
      )}

      {isLoading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>}

      {dates.map(d => {
        const items = groups[d];
        const total = items.reduce((s, e) => s + e.amount, 0);
        return (
          <div key={d}>
            <div className="ss-date-head">
              <span style={{ whiteSpace: 'nowrap' }}>{relDate(d)}</span>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{formatINR(total)} total</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map(e => {
                const cat = catBy[e.category?.name ?? ''];
                if (!cat) return null;
                return (
                  <Card key={e.id} hover style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 14, position: 'relative', cursor: 'pointer' }}
                    onClick={() => openEditExpense(e)}>
                    <IconDisc category={cat} size={48} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', fontFamily: 'var(--font-head)', whiteSpace: 'nowrap' }}>{e.merchant}</span>
                        <CategoryChip category={cat} />
                      </div>
                      {e.note && <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>{e.note}</div>}
                      {e.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                          {e.tags.map(t => <span key={t} className="ss-tag-pill">#{t}</span>)}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)', fontFamily: 'var(--font-head)' }}>−{formatINR(e.amount)}</div>
                      <span className={'ss-need-badge ' + (e.type === 'Needs' ? 'is-need' : 'is-want')}>{e.type}</span>
                    </div>
                    <div style={{ flexShrink: 0, opacity: 0.5, fontSize: 13, color: 'var(--text-muted)' }}>✏️</div>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {!isLoading && expenses.length === 0 && (
        <Card style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
          {activeFilters > 0 || q ? 'No expenses match your filters.' : 'No expenses yet. Add your first expense!'}
          {(activeFilters > 0) && <div style={{ marginTop: 8 }}><button className="ss-link" onClick={clearFilters}>Clear filters</button></div>}
        </Card>
      )}
    </div>
  );
}
