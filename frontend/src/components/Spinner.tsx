interface SpinnerProps {
  label?: string;
}

export function Spinner({ label }: SpinnerProps) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      {label ? <span className="text-sm">{label}</span> : null}
    </div>
  );
}
