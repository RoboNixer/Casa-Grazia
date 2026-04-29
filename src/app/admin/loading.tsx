export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header skeleton */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-3 w-32 rounded-md bg-slate-200 animate-pulse" />
          <div className="h-6 w-48 rounded-md bg-slate-200 animate-pulse" />
        </div>
        <div className="h-10 w-36 rounded-xl bg-slate-200 animate-pulse flex-shrink-0" />
      </div>

      {/* Content skeleton */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Table header */}
        <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3 flex gap-6">
          {[100, 80, 90, 60, 60, 50].map((w, i) => (
            <div key={i} className={`h-3 rounded bg-slate-200 animate-pulse`} style={{ width: w }} />
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-5 py-4 border-b border-slate-100 last:border-0 flex items-center gap-6">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-7 h-7 rounded-full bg-slate-200 animate-pulse flex-shrink-0" />
              <div className="space-y-1.5">
                <div className="h-3 w-28 rounded bg-slate-200 animate-pulse" />
                <div className="h-2.5 w-36 rounded bg-slate-100 animate-pulse" />
              </div>
            </div>
            <div className="h-3 w-20 rounded bg-slate-200 animate-pulse hidden md:block" />
            <div className="h-3 w-24 rounded bg-slate-200 animate-pulse hidden md:block" />
            <div className="h-6 w-20 rounded-lg bg-slate-200 animate-pulse hidden md:block" />
            <div className="h-6 w-16 rounded-lg bg-slate-200 animate-pulse hidden md:block" />
            <div className="h-3 w-14 rounded bg-slate-200 animate-pulse ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
