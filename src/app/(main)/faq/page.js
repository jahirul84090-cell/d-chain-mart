import InfoPage from "@/components/others/InfoPage";
import { faq } from "@/lib/policies";
import { toJsonLd } from "@/lib/jsonld";

export const metadata = {
  title: faq.seoTitle,
  description: faq.metaDescription,
  alternates: { canonical: faq.path },
};

export default function FaqPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.items.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <InfoPage title={faq.title} intro={faq.intro} path={faq.path}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(faqJsonLd) }}
      />
      <div className="divide-y rounded-2xl border bg-white">
        {faq.items.map(([q, a]) => (
          <details key={q} className="group px-5 py-4 open:bg-gray-50/60">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-gray-900">
              {q}
              <span
                aria-hidden="true"
                className="text-xl leading-none text-gray-400 transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-gray-600">{a}</p>
          </details>
        ))}
      </div>
    </InfoPage>
  );
}
