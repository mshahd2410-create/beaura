import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full px-6 py-4 border-b border-black/10 bg-[#faf7f2]">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl font-medium">
          Beaura
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/login"
            className="hover:opacity-70 transition"
          >
            Login
          </Link>

          <Link
            href="/contact"
            className="hover:opacity-70 transition"
          >
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
}
