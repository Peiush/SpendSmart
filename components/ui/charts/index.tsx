'use client';
import { useMounted } from '@/hooks/useMounted';

/* ---- Sparkline ---- */
export function Sparkline({ data, color = 'var(--coral)', height = 34 }: { data: number[]; color?: string; height?: number }) {
  const max = Math.max(...data);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height }}>
      {data.map((v, i) => (
        <div key={i} style={{ width: 6, height: (v / max) * 100 + '%', minHeight: 4, background: color, borderRadius: 3, opacity: 0.45 + 0.55 * (v / max) }} />
      ))}
    </div>
  );
}

/* ---- GroupedBars ---- */
export function GroupedBars({ data }: { data: Array<{ name: string; thisWeek: number; lastWeek: number }> }) {
  const mounted = useMounted(120);
  const max = Math.max(...data.flatMap(d => [d.thisWeek, d.lastWeek]));
  const ceil = Math.ceil(max / 1000) * 1000 || 1000;
  const H = 200;
  return (
    <div>
      <div style={{ position: 'relative', height: H + 26, display: 'flex', alignItems: 'stretch' }}>
        <div style={{ position: 'absolute', inset: 0, bottom: 26 }}>
          {[0, 0.25, 0.5, 0.75, 1].map((g, i) => (
            <div key={i} style={{ position: 'absolute', left: 0, right: 0, bottom: g * H, borderTop: '1px dashed #ECE3DB', height: 0 }} />
          ))}
        </div>
        <div style={{ display: 'flex', flex: 1, alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, position: 'relative' }}>
          {data.map(d => (
            <div key={d.name} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: H, width: '100%', justifyContent: 'center' }}>
                {[{ v: d.lastWeek, fill: '#F6D2C8' }, { v: d.thisWeek, fill: 'var(--coral)' }].map((b, i) => (
                  <div key={i} title={String(b.v)} style={{ width: 16, borderRadius: '6px 6px 0 0', background: b.fill, height: mounted ? (b.v / ceil) * H + 'px' : '0px', transition: `height 1s cubic-bezier(.22,1,.36,1) ${i * 80}ms` }} />
                ))}
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>{d.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginTop: 8 }}>
        <Legend swatch="var(--coral)" label="This week" />
        <Legend swatch="#F6D2C8" label="Last week" />
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
      <span style={{ width: 11, height: 11, borderRadius: 4, background: swatch }} />
      {label}
    </span>
  );
}

/* ---- DayBars ---- */
export function DayBars({ data }: { data: Array<{ day: string; spend: number }> }) {
  const mounted = useMounted(120);
  const max = Math.max(...data.map(d => d.spend)) || 1;
  const peak = data.reduce((a, b) => b.spend > a.spend ? b : a);
  const H = 120;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, height: H + 40 }}>
      {data.map(d => {
        const isPeak = d.day === peak.day;
        return (
          <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10.5, color: isPeak ? 'var(--coral)' : 'var(--text-muted)', fontWeight: 700, fontFamily: 'var(--font-body)' }}>
              {mounted ? '₹' + (d.spend / 1000).toFixed(1) + 'k' : ''}
            </span>
            <div style={{ width: '100%', maxWidth: 26, borderRadius: '7px 7px 0 0', background: isPeak ? 'var(--coral)' : '#F6D2C8', height: mounted ? (d.spend / max) * H + 'px' : '0px', transition: 'height .9s cubic-bezier(.22,1,.36,1)' }} />
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600, fontFamily: 'var(--font-body)' }}>{d.day}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ---- Donut ---- */
export function Donut({ data, size = 200, thickness = 30 }: { data: Array<{ name: string; value: number; color: string }>; size?: number; thickness?: number }) {
  const mounted = useMounted(150);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 26, flexWrap: 'wrap', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1E8E1" strokeWidth={thickness} />
          {data.map((d, i) => {
            const frac = d.value / total;
            const len = mounted ? frac * circ : 0;
            const gap = circ - len;
            const dashOff = -acc * (mounted ? 1 : 0);
            acc += frac * circ;
            return <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={d.color} strokeWidth={thickness} strokeDasharray={`${len} ${gap}`} strokeDashoffset={dashOff} style={{ transition: `stroke-dasharray 1s cubic-bezier(.22,1,.36,1) ${i * 70}ms` }} />;
          })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Total</div>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-head)', color: 'var(--text-primary)' }}>₹{total.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {data.map(d => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5 }}>
            <span style={{ width: 11, height: 11, borderRadius: 4, background: d.color }} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600, minWidth: 96, fontFamily: 'var(--font-body)' }}>{d.name}</span>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>₹{d.value.toLocaleString('en-IN')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
