export default function MuaDashboard() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-light">
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
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-xl mt-2">{value}</p>
    </div>
  );
}
