import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import { toJsonLd } from "@/lib/jsonld";

/**
 * Layout for policy and help pages: title, intro, "last updated" date,
 * a table of contents and numbered sections. Server component.
 */
export default function InfoPage({ title, intro, updated, path, sections, children }) {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: title, item: `${SITE_URL}${path}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbJsonLd) }}
      />
      <section className="border-b bg-gradient-to-br from-sky-50 to-white">
        <div className="container mx-auto max-w-4xl px-4 py-12 sm:py-16">
          <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span className="mx-2" aria-hidden="true">/</span>
            <span className="text-gray-700">{title}</span>
          </nav>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{title}</h1>
          {intro && <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-600">{intro}</p>}
          {updated && <p className="mt-3 text-sm text-gray-500">Last updated: {updated}</p>}
        </div>
      </section>

      <div className="container mx-auto grid max-w-4xl gap-10 px-4 py-12 lg:max-w-6xl lg:grid-cols-[220px_1fr]">
        {sections?.length > 1 && (
          <aside className="hidden lg:block">
            <nav aria-label="On this page" className="sticky top-24 text-sm">
              <p className="mb-3 font-semibold text-gray-900">On this page</p>
              <ol className="space-y-2">
                {sections.map((s, i) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="text-gray-600 hover:text-primary">
                      {i + 1}. {s.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>
        )}

        <div className="min-w-0 space-y-10">
          {sections?.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-gray-900">
                {sections.length > 1 && `${i + 1}. `}
                {s.heading}
              </h2>
              <div className="mt-3 space-y-3 leading-relaxed text-gray-700">
                {s.body.map((block, j) =>
                  Array.isArray(block) ? (
                    <ul key={j} className="list-disc space-y-1.5 pl-5">
                      {block.map((li) => (
                        <li key={li}>{li}</li>
                      ))}
                    </ul>
                  ) : (
                    <p key={j}>{block}</p>
                  )
                )}
              </div>
            </section>
          ))}
          {children}
          <div className="rounded-2xl border bg-gray-50 p-6">
            <p className="font-semibold text-gray-900">Still have questions?</p>
            <p className="mt-1 text-sm text-gray-600">
              Our support team is available 10 AM – 10 PM every day.
            </p>
            <Link
              href="/contact"
              className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
            >
              Contact support
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
