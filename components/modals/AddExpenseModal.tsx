'use client';
import { useState, useEffect } from 'react';
import { Toggle } from '@/components/ui';
import { useCategories } from '@/hooks/useCategories';
import { useCreateExpense } from '@/hooks/useExpenses';
import type { ExpenseType } from '@/types';

export function AddExpenseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: categories = [] } = useCategories();
  const createExpense = useCreateExpense();

  const [amount, setAmount] = useState('');
  const [catId, setCatId] = useState<string | null>(null);
  const [type, setType] = useState<ExpenseType>('Needs');
  const [merchant, setMerchant] = useState('');
  const [note, setNote] = useState('');
  const [tags, setTags] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [receipt, setReceipt] = useState<{ name: string; url: string } | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) { setAmount(''); setCatId(null); setType('Needs'); setMerchant(''); setNote(''); setTags(''); setRecurring(false); setReceipt(null); setSaved(false); }
  }, [open]);

  if (!open) return null;

  const handleReceipt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setReceipt({ name: file.name, url: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!amount || !catId) return;
    const today = new Date().toISOString().slice(0, 10);
    await createExpense.mutateAsync({
      categoryId: catId,
      amount: Number(amount),
      date: today,
      merchant: merchant || 'Unknown',
      note: note || undefined,
      type,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      isRecurring: recurring,
    });
    setSaved(true);
    setTimeout(onClose, 950);
  };

  return (
    <div className="ss-modal-overlay" onClick={onClose}>
      <div className="ss-sheet" onClick={e => e.stopPropagation()}>
        {saved ? (
          <div style={{ padding: '56px 24px', textAlign: 'center' }}>
            <div className="ss-check">✓</div>
            <div style={{ fontSize: 19, fontWeight: 800, fontFamily: 'var(--font-head)', color: 'var(--text-primary)', marginTop: 16 }}>Expense saved!</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>Added to today's log.</div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-head)', color: 'var(--text-primary)' }}>Add expense</h2>
              <button className="ss-icon-btn" onClick={onClose}>✕</button>
            </div>

            <div style={{ textAlign: 'center', padding: '18px 0 6px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 30, fontWeight: 700, color: 'var(--text-muted)' }}>₹</span>
                <input className="ss-amount-input" inputMode="numeric" placeholder="0" value={amount} autoFocus
                  onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ''))} />
              </div>
            </div>

            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', margin: '8px 0 10px' }}>Category</div>
            <div className="ss-cat-grid">
              {categories.slice(0, 12).map(c => (
                <button key={c.id} className={'ss-cat-cell ' + (catId === c.id ? 'is-sel' : '')} onClick={() => setCatId(c.id)}>
                  <span style={{ width: 42, height: 42, borderRadius: 14, background: c.tintHex, display: 'grid', placeItems: 'center', fontSize: 20 }}>{c.icon}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{c.short}</span>
                </button>
              ))}
            </div>

            <input className="ss-input" style={{ marginTop: 18 }} placeholder="Merchant / note" value={merchant}
              onChange={e => setMerchant(e.target.value)} />
            <input className="ss-input" style={{ marginTop: 10 }} placeholder="Additional note (optional)" value={note}
              onChange={e => setNote(e.target.value)} />
            <input className="ss-input" style={{ marginTop: 10 }} placeholder="Tags (comma-separated: food, work)" value={tags}
              onChange={e => setTags(e.target.value)} />

            <div className="ss-3way" style={{ marginTop: 14 }}>
              {(['Needs', 'Wants', 'Savings'] as ExpenseType[]).map(t => (
                <button key={t} className={'ss-3way__btn ' + (type === t ? 'is-active' : '')} onClick={() => setType(t)}>{t}</button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
              <span style={{ fontSize: 14.5, color: 'var(--text-primary)', fontWeight: 500 }}>🔁 Recurring expense</span>
              <Toggle on={recurring} onChange={setRecurring} />
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="file" accept="image/jpeg,image/png" style={{ display: 'none' }} onChange={handleReceipt} />
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>📎 {receipt ? receipt.name : 'Attach receipt (JPG/PNG)'}</span>
                {!receipt && <span className="ss-btn-outline ss-btn-sm">Upload</span>}
              </label>
              {receipt && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={receipt.url} alt="receipt" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)' }} />
                  <button className="ss-link" style={{ fontSize: 12 }} onClick={() => setReceipt(null)}>Remove</button>
                </div>
              )}
            </div>

            <button className="ss-btn-coral ss-btn-block" style={{ marginTop: 22 }}
              disabled={!amount || !catId || createExpense.isPending} onClick={save}>
              {createExpense.isPending ? 'Saving…' : 'Save expense'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
