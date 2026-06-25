interface EmptyStateProps {
  title: string;
  hint: string;
}

export function EmptyState({ title, hint }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-line py-16 text-center">
      <p className="text-sm font-medium text-fg">{title}</p>
      <p className="mt-1 text-sm text-muted">{hint}</p>
    </div>
  );
}
