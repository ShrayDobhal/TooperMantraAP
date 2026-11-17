'use client';
import { RANGE_OPTIONS, RangeKey } from '@/lib/format';
import { Segmented } from './Tabs';

export function RangePicker({ value, onChange }: { value: RangeKey; onChange: (v: RangeKey) => void }) {
  return <Segmented value={value} onChange={onChange} options={RANGE_OPTIONS} />;
}
