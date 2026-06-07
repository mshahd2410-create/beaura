import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-black/5 py-12">
      <div className="max-w-6xl mx-auto px-6 flex flex-wrap gap-6 justify-between text-sm">

        <span className="text-gray-500">© Beaura</span>

        <div className="flex gap-6 text-gray-600">
          
          <Link href="/about" className="hover:text-black transition">
            About
          </Link>

          <Link href="/contact" className="hover:text-black transition">
            Contact
          </Link>

          <Link href="/faqs" className="hover:text-black transition">
            FAQ
          </Link>

          <Link href="/terms" className="hover:text-black transition">
            Terms
          </Link>

          <Link href="/privacy" className="hover:text-black transition">
            Privacy
          </Link>

        </div>
      </div>
    </footer>
  );
}