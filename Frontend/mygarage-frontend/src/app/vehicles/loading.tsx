export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <div className="mx-auto max-w-2xl px-6 py-12 animate-pulse">
        
        {/* Top Nav Skeleton */}
        <nav className="mb-12 flex items-center justify-between">
          <div className="h-4 w-32 bg-foreground/5 rounded" />
          <div className="h-10 w-10 bg-foreground/10 rounded-2xl" />
        </nav>

        {/* Header Skeleton */}
        <header className="mb-16 flex items-end justify-between">
          <div className="space-y-4">
            <div className="h-12 w-48 bg-foreground/10 rounded-xl" />
            <div className="h-4 w-64 bg-foreground/5 rounded" />
          </div>
          <div className="h-12 w-12 bg-foreground/[0.03] rounded-2xl" />
        </header>

        {/* List Skeleton */}
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className="h-48 w-full rounded-[40px] border border-border-subtle bg-foreground/[0.01]"
            />
          ))}
        </div>

        {/* Footer Skeleton */}
        <div className="mt-16 flex justify-center">
          <div className="h-4 w-32 bg-foreground/5 rounded-full" />
        </div>
      </div>
    </div>
  );
}
