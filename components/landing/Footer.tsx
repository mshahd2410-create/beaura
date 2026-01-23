export default function Footer() {
  return (
    <footer className="border-t border-black/5 py-12">
      <div className="max-w-6xl mx-auto px-6 flex flex-wrap gap-6 justify-between text-sm">
        <span>© Beaura</span>
        <div className="flex gap-6">
          <a href="#">About</a>
          <a href="#">Contact</a>
          <a href="#">FAQ</a>
          <a href="#">Terms</a>
          <a href="#">Privacy</a>
        </div>
      </div>
    </footer>
  );
}