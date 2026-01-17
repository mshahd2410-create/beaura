export default function SettingsPage() {
  return (
    <section className="bg-white rounded-2xl p-8 shadow-sm space-y-6">
      <h2 className="text-xl">Settings</h2>

      <div>
        <h3 className="text-sm mb-2">Personal information</h3>
        <p className="text-gray-500 text-sm">
          Name and email are locked. City & availability editable.
        </p>
      </div>

      <div>
        <h3 className="text-sm mb-2">Payment method</h3>
        <p className="text-gray-500 text-sm">
          Payout card integration coming soon.
        </p>
      </div>
    </section>
  );
}
