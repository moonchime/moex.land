import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("NotFound");
  return (
    <main>
      <h1>{t("title")}</h1>
      <Link href="/">{t("home")}</Link>
    </main>
  );
}
