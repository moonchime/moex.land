import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("About");
  return { title: t("title") };
}

export default function AboutPage() {
  const t = useTranslations("About");
  return <h1>{t("title")}</h1>;
}
