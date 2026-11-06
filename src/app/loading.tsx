export default function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas">
      <div className="flex items-center gap-3 text-sm text-muted">
        <span
          className="size-4 animate-spin rounded-full border-2 border-line border-t-brand"
          aria-hidden="true"
        />
        Loading…
      </div>
    </div>
  );
}
