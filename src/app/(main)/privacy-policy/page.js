import InfoPage from "@/components/others/InfoPage";
import { privacyPolicy as page, POLICY_UPDATED } from "@/lib/policies";

export const metadata = {
  title: page.seoTitle || page.title,
  description: page.metaDescription || page.intro,
  alternates: { canonical: page.path },
};

export default function Page() {
  return (
    <InfoPage
      title={page.title}
      intro={page.intro}
      updated={POLICY_UPDATED}
      path={page.path}
      sections={page.sections}
    />
  );
}
