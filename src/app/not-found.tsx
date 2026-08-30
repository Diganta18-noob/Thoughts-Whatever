import Link from "next/link";
import { PRIMARY_NAV, SECONDARY_NAV } from "@/lib/nav";
import { T } from "@/components/i18n/t";
import { NavLabel } from "@/components/i18n/nav-label";

export default function NotFound() {
  const recoveryLinks = [
    { href: "/", labelEn: "Home", labelBn: "মূল পাতা" },
    ...PRIMARY_NAV,
    ...SECONDARY_NAV,
    { href: "/sitemap.xml", labelEn: "Sitemap", labelBn: "সাইটম্যাপ" },
    { href: "/llms.txt", labelEn: "Agent Guide (llms.txt)", labelBn: "এজেন্ট গাইড" },
  ];

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-6xl flex-col justify-center px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-measure text-center">
        <span className="label font-bengali-sans text-accent font-semibold tracking-widest">404</span>
        <T
          as="h1"
          k="notFound.title"
          className="mt-4 text-[2rem] font-medium leading-tight text-content sm:text-[2.5rem]"
          bnClassName="font-bengali"
        />
        <T
          as="p"
          k="notFound.body"
          className="mx-auto mt-4 max-w-measure text-bengali-base text-content-soft"
          bnClassName="font-bengali"
        />

        <div className="mt-8 text-xs text-content-faint">
          <p>The requested page does not exist. Useful places to continue / দরকারী লিঙ্ক:</p>
        </div>

        <nav aria-label="Recovery navigation" className="mt-6 flex flex-wrap justify-center gap-2">
          {recoveryLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-sm border border-rule px-3.5 py-2 text-sm text-content-soft transition hover:border-accent/50 hover:text-accent"
            >
              <NavLabel item={item} />
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
