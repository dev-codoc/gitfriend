import Link from "next/link";

type NavbarProps = {
  showAuthLinks?: boolean;
};

export default function Navbar({ showAuthLinks = true }: NavbarProps) {
  return (
    <header className="border-b border-sky/40">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-display italic text-xl text-ink">
          Gitfriend
        </Link>

        {showAuthLinks ? (
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/login" className="text-ink hover:text-teal transition">
              Log in
            </Link>
            <Link
              href="/signup"
              className="bg-teal text-white rounded-md px-4 py-2 font-medium hover:bg-teal-dark transition"
            >
              Sign up
            </Link>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
