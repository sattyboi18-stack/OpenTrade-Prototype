"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";

const links = [
  { href: "/", label: "Today's deck" },
  { href: "/scoreboard", label: "Your scoreboard" },
  { href: "/agents", label: "Agent track record" },
];

export function NavLinks() {
  const path = usePathname();
  return (
    <>
      {links.map((l) => (
        <Link key={l.href} href={l.href} className={path === l.href ? "active" : ""}>
          {l.label}
        </Link>
      ))}
    </>
  );
}
