import { SiteHeader } from "@/components/layout/site-header";
import { locales, type Locale } from "@/lib/i18n/config";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function LocaleLayout({ children, params }: { children: React.ReactNode; params: { locale: Locale } }) {
  return (
    <div>
      <SiteHeader locale={params.locale} />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">{children}</main>
    </div>
  );
}
