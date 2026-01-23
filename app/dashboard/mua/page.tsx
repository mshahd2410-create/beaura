export default function MuaDashboard() {
  return (
    <div className="space-y-10">
      <h2 className="text-2xl font-light text-black">
        Welcome back ✨
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Upcoming bookings" value="0" />
        <StatCard title="Monthly earnings" value="EGP 0" />
        <StatCard title="Popular service" value="—" />
      </div>
    </div>
  );
}

function StatCard({ title, value }: any) {
  return (
    <div className="
      bg-white
      rounded-3xl
      p-6
      border border-black/5
      shadow-[0_8px_30px_rgba(0,0,0,0.04)]
      transition
      hover:shadow-[0_12px_40px_rgba(124,58,237,0.12)]
    ">
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-xl mt-3 text-black">{value}</p>
    </div>
  );
}