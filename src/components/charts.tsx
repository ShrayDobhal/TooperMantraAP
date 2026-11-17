'use client';
import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn, fmtHour, fmtNumber } from '@/lib/format';

export const CHART_COLORS = {
  primary: '#4f46e5',
  secondary: '#0ea5e9',
  muted: '#cbd5e1',
  grid: '#f1f5f9',
  axis: '#94a3b8',
};

const axisProps = {
  tick: { fill: CHART_COLORS.axis, fontSize: 11 },
  tickLine: false,
  axisLine: false,
} as const;

function ChartTooltip({ active, payload, label, labelFormatter, valueFormatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="mb-1 font-medium text-slate-700">{labelFormatter ? labelFormatter(label) : label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-slate-600">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          {p.name}: <span className="font-medium text-slate-900">{valueFormatter ? valueFormatter(p.value) : fmtNumber(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

export interface Series {
  key: string;
  name: string;
  color?: string;
}

export function TrendChart({
  data,
  xKey,
  series,
  height = 260,
  xFormatter,
  valueFormatter,
}: {
  data: any[];
  xKey: string;
  series: Series[];
  height?: number;
  xFormatter?: (v: any) => string;
  valueFormatter?: (v: number) => string;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            {series.map((s, i) => (
              <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color || (i === 0 ? CHART_COLORS.primary : CHART_COLORS.secondary)} stopOpacity={0.15} />
                <stop offset="100%" stopColor={s.color || (i === 0 ? CHART_COLORS.primary : CHART_COLORS.secondary)} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
          <XAxis dataKey={xKey} {...axisProps} tickFormatter={xFormatter} minTickGap={16} />
          <YAxis {...axisProps} allowDecimals={false} width={44} />
          <Tooltip content={<ChartTooltip labelFormatter={xFormatter} valueFormatter={valueFormatter} />} />
          {series.map((s, i) => {
            const color = s.color || (i === 0 ? CHART_COLORS.primary : CHART_COLORS.secondary);
            return (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={color}
                strokeWidth={2}
                fill={`url(#fill-${s.key})`}
                dot={false}
                activeDot={{ r: 3 }}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarsChart({
  data,
  xKey,
  yKey,
  name,
  height = 240,
  xFormatter,
  valueFormatter,
  highlightIndex,
  layout = 'vertical',
}: {
  data: any[];
  xKey: string;
  yKey: string;
  name: string;
  height?: number;
  xFormatter?: (v: any) => string;
  valueFormatter?: (v: number) => string;
  highlightIndex?: number | null;
  /** 'vertical' = columns; 'horizontal' = bars with category labels on the left. */
  layout?: 'vertical' | 'horizontal';
}) {
  const horizontal = layout === 'horizontal';
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 8, right: 8, left: horizontal ? 8 : -12, bottom: 0 }}
        >
          <CartesianGrid stroke={CHART_COLORS.grid} vertical={horizontal} horizontal={!horizontal} />
          {horizontal ? (
            <>
              <XAxis type="number" {...axisProps} allowDecimals={false} />
              <YAxis type="category" dataKey={xKey} {...axisProps} width={110} tickFormatter={xFormatter} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} {...axisProps} tickFormatter={xFormatter} interval="preserveStartEnd" minTickGap={4} />
              <YAxis {...axisProps} allowDecimals={false} width={44} />
            </>
          )}
          <Tooltip cursor={{ fill: '#f8fafc' }} content={<ChartTooltip labelFormatter={xFormatter} valueFormatter={valueFormatter} />} />
          <Bar dataKey={yKey} name={name} radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={horizontal ? 18 : 28}>
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={highlightIndex === undefined || highlightIndex === null || highlightIndex === i ? CHART_COLORS.primary : '#c7d2fe'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Day-of-week × hour grid. */
export function Heatmap({ cells }: { cells: { dow: number; hour: number; activeUsers: number }[] }) {
  const max = Math.max(1, ...cells.map((c) => c.activeUsers));
  const lookup = new Map(cells.map((c) => [`${c.dow}-${c.hour}`, c.activeUsers]));
  return (
    <div className="overflow-x-auto">
      <div className="inline-grid min-w-full gap-[3px]" style={{ gridTemplateColumns: `36px repeat(24, minmax(18px, 1fr))` }}>
        <div />
        {Array.from({ length: 24 }).map((_, h) => (
          <div key={h} className="text-center text-[10px] text-slate-400">
            {h % 3 === 0 ? fmtHour(h) : ''}
          </div>
        ))}
        {DOW.map((d, dow) => (
          <React.Fragment key={d}>
            <div className="pr-1 text-right text-[11px] leading-[18px] text-slate-500">{d}</div>
            {Array.from({ length: 24 }).map((_, h) => {
              const v = lookup.get(`${dow}-${h}`) || 0;
              const intensity = v / max;
              return (
                <div
                  key={h}
                  title={`${d} ${fmtHour(h)}: ${fmtNumber(v)} active`}
                  className={cn('h-[18px] rounded-[3px]', v === 0 && 'bg-slate-100')}
                  style={v ? { background: `rgba(79, 70, 229, ${0.12 + intensity * 0.88})` } : undefined}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-2 text-[11px] text-slate-500">
        Less
        {[0.12, 0.35, 0.6, 0.85, 1].map((o) => (
          <span key={o} className="h-3 w-3 rounded-[3px]" style={{ background: `rgba(79, 70, 229, ${o})` }} />
        ))}
        More
      </div>
    </div>
  );
}

/** Horizontal bar list with labels and values — compact alternative to a chart. */
export function BarList({
  items,
  valueFormatter = fmtNumber,
  emptyLabel = 'No data',
}: {
  items: { label: React.ReactNode; value: number; sub?: React.ReactNode; key: string }[];
  valueFormatter?: (v: number) => string;
  emptyLabel?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <p className="py-6 text-center text-xs text-slate-500">{emptyLabel}</p>;
  return (
    <ul className="space-y-2.5">
      {items.map((it) => (
        <li key={it.key}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-slate-700">{it.label}</span>
            <span className="shrink-0 font-medium text-slate-900">
              {valueFormatter(it.value)}
              {it.sub && <span className="ml-1.5 text-xs font-normal text-slate-500">{it.sub}</span>}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${(it.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
