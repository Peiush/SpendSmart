'use client';
import { useState, useEffect } from 'react';
import { Toggle } from '@/components/ui';
import { useCategories } from '@/hooks/useCategories';
import { useUpdateExpense, useDeleteExpense } from '@/hooks/useExpenses';
import type { Expense, ExpenseType } from '@/types';

interface Props {
  expense: Expense | null;
  onClose: () => void;
}

export function EditExpenseModal({ expense, onClose }: Props) {
  const { data: categories = [] } = useCategories();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const [amount, setAmount] = useState('');
  const [catId, setCatId] = useState<string | null>(null);
  const [type, setType] = useState<ExpenseType>('Needs');
  const [merchant, setMerchant] = useState('');
  const [note, setNote] = useState('');
  const [tags, setTags] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [done, setDone] = useState<'saved' | 'deleted' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (expense) {
      setAmount(String(expense.amount));
      setCatId(expense.categoryId);
      setType(expense.type);
      setMerchant(expense.merchant);
      setNote(expense.note ?? '');
      setTags(expense.tags.join(', '));
      setRecurring(expense.isRecurring);
      setDone(null);
      setConfirmDelete(false);
    }
  }, [expense]);

  if (!expense) return null;

  const save = async () => {
    if (!amount || !catId) return;
    await updateExpense.mutateAsync({
      id: expense.id,
      categoryId: catId,
      amount: Number(amount),
      merchant: merchant || 'Unknown',
      note: note || undefined,
      type,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      isRecurring: recurring,
    });
    setDone('saved');
    setTimeout(onClose, 950);
  };

  const handleDelete = async () => {
    await deleteExpense.mutateAsync(expense.id);
    setDone('deleted');
    setTimeout(onClose, 950);
  };

  return (
    <div className="ss-modal-overlay" onClick={onClose}>
      <div className="ss-sheet" onClick={e => e.stopPropagation()}>
        {done ? (
          <div style={{ padding: '56px 24px', textAlign: 'center' }}>
            <div className="ss-check">{done === 'deleted' ? '🗑️' : '✓'}</div>
            <div style={{ fontSize: 19, fontWeight: 800, fontFamily: 'var(--font-head)', color: 'var(--text-primary)', marginTop: 16 }}>
              {done === 'deleted' ? 'Expense deleted!' : 'Expense updated!'}
            </div>
          </div>
        ) : confirmDelete ? (
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-head)', color: 'var(--text-primary)', marginBottom: 8 }}>Delete expense?</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 }}>
              &quot;{expense.merchant}&quot; · ₹{expense.amount} will be permanently removed.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="ss-btn-outline ss-btn-block" onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button
                style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                disabled={deleteExpense.isPending}
                onClick={handleDelete}
              >
                {deleteExpense.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-head)', color: 'var(--text-primary)' }}>Edit expense</h2>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className="ss-icon-btn"
                  onClick={() => setConfirmDelete(true)}
                  title="Delete expense"
                  style={{ color: '#ef4444', borderColor: '#fecaca' }}
                >
                  🗑️
                </button>
                <button className="ss-icon-btn" onClick={onClose}>✕</button>
              </div>
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

            <button className="ss-btn-coral ss-btn-block" style={{ marginTop: 22 }}
              disabled={!amount || !catId || updateExpense.isPending} onClick={save}>
              {updateExpense.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
