import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="rounded-md text-xl font-bold tracking-tight text-primary outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          Encaixe
        </Link>
        <nav aria-label="Principal">
          <Link
            href="/#como-funciona"
            className="rounded-md px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            Como funciona
          </Link>
        </nav>
      </div>
    </header>
  );
}
