import Link from "next/link";
import { dictionary, type Locale } from "@/lib/i18n/config";

export function SiteHeader({ locale }: { locale: Locale }) {
  const t = dictionary[locale];
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href={`/${locale}`} className="font-bold">{t.brand}</Link>
        <nav className="flex gap-4 text-sm">
          <Link href={`/${locale}`}>{t.nav.home}</Link>
          <Link href={`/${locale}/preprints`}>{t.nav.preprints}</Link>
          <Link href={`/${locale}/journal`}>{t.nav.journal}</Link>
          <Link href={`/${locale}/submit`}>{t.nav.submit}</Link>
          <Link href={`/${locale}/admin`}>{t.nav.admin}</Link>
        </nav>
      </div>
    </header>
  );
}
