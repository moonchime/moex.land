import type { Metadata } from "next";
import { useLocale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { EnSpecimen } from "./en";
import { ZhSpecimen } from "./zh";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Specimen");
  return { title: t("title") };
}

export default function SpecimenPage() {
  const locale = useLocale();
  return (
    <article className="prose max-w-none">
      {locale === "zh" ? <ZhSpecimen /> : <EnSpecimen />}
    </article>
  );
}
