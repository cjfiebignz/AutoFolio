export default function VehicleLoading() {
  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white antialiased">
      <div className="mx-auto max-w-2xl px-6 py-8 animate-pulse">
        <div className="mb-8 flex items-center justify-between">
          <div className="h-4 w-24 bg-white/5 rounded" />
          <div className="h-4 w-16 bg-white/5 rounded" />
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <div className="h-12 w-3/4 bg-white/10 rounded-xl" />
            <div className="h-6 w-1/2 bg-white/5 rounded-lg" />
          </div>

          <div className="flex gap-2 overflow-x-auto border-b border-white/5 pb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 w-20 bg-white/5 rounded-full flex-shrink-0" />
            ))}
          </div>

          <div className="h-48 w-full bg-white/5 rounded-3xl" />
          <div className="grid gap-6">
            <div className="h-64 w-full bg-white/[0.02] rounded-3xl" />
            <div className="h-64 w-full bg-white/[0.02] rounded-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
