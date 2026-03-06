import { SubmitForm } from "@/components/forms/submit-form";
import { dictionary, type Locale } from "@/lib/i18n/config";

export default function SubmitPage({ params }: { params: { locale: Locale } }) {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Submit article</h1>
      <p className="rounded-md border border-border bg-muted p-3 text-sm">{dictionary[params.locale].submitDisclaimer}</p>
      <SubmitForm locale={params.locale} />
    </div>
  );
}
