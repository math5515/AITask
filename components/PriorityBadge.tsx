interface Props {
  priority: 'high' | 'medium' | 'low';
}

const STYLES: Record<Props['priority'], string> = {
  high: 'bg-red-950 text-red-300 border border-red-800',
  medium: 'bg-amber-950 text-amber-300 border border-amber-800',
  low: 'bg-blue-950 text-blue-300 border border-blue-800',
};

export default function PriorityBadge({ priority }: Props) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${STYLES[priority]}`}>
      {priority}
    </span>
  );
}
