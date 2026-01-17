export default function Footer() {
  return (
    <footer className="border-t border-black/10 py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-6">
        <div className="font-medium">Beaura</div>

        <div className="flex gap-6 text-sm text-gray-600">
          <a href="#">About Us</a>
          <a href="#">Contact</a>
          <a href="#">FAQ</a>
          <a href="#">Terms</a>
          <a href="#">Privacy</a>
        </div>
      </div>
    </footer>
  );
}
