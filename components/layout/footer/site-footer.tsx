import Link from "next/link";

const FOOTER_LINKS = {
  Product: [
    { href: "/marketplace", label: "Marketplace" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/roadmap", label: "Roadmap" },
  ],
  Community: [
    { href: "/seller/register", label: "Become a creator" },
    { href: "/faq", label: "FAQ" },
  ],
  Legal: [
    { href: "/terms", label: "Terms of Service" },
    { href: "/privacy", label: "Privacy Policy" },
  ],
};

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="font-display text-lg font-semibold tracking-tight">
            🐾 PawDrop
          </Link>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            A marketplace for adorable dog photos. Internal points only — no real-money payments.
          </p>
        </div>

        {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
          <div key={heading}>
            <h3 className="text-sm font-semibold">{heading}</h3>
            <ul className="mt-3 space-y-2.5">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container border-t border-border py-6">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} PawDrop. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
