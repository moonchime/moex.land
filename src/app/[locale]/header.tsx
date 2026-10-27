import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

import { NavLink } from "./site-links";

export const item =
  "flex min-h-11 items-center px-2 decoration-2 underline-offset-[.3em] hover:underline aria-[current=page]:underline";

export function Header() {
  const t = useTranslations();
  return (
    <header className="-mx-4 flex items-center justify-between border-b border-gray-700 px-2 py-2">
      <Link href="/" className={`${item} font-medium`}>
        {t("Metadata.siteName")}
      </Link>
      <nav>
        <NavLink href="/about" className={`${item} text-gray-500 aria-[current=page]:text-inherit`}>
          {t("About.title")}
        </NavLink>
      </nav>
    </header>
  );
}
