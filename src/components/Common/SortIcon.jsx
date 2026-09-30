import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export default function SortIcon({ active, direction }) {
  if (!active) return <ArrowUpDown size={14} className="opacity-40" aria-hidden="true" />;
  return direction === 'asc'
    ? <ArrowUp size={14} aria-hidden="true" />
    : <ArrowDown size={14} aria-hidden="true" />;
}
