import { useTranslations } from "next-intl";

import { item } from "./header";
import { LocaleLink } from "./site-links";

export function Footer() {
  const t = useTranslations("Footer");
  return (
    <footer className="-mx-4 flex border-t border-gray-700 px-2 py-2 text-sm text-gray-500">
      <LocaleLink className={item}>{t("switchLocale")}</LocaleLink>
    </footer>
  );
}
