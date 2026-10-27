"use client";

import { useLocale } from "next-intl";
import type { ComponentProps } from "react";

import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function NavLink(props: ComponentProps<typeof Link>) {
  const pathname = usePathname();
  return <Link aria-current={props.href === pathname ? "page" : undefined} {...props} />;
}

export function LocaleLink(props: Omit<ComponentProps<typeof Link>, "href" | "locale">) {
  const pathname = usePathname();
  const current = useLocale();
  const other = routing.locales.find((locale) => locale !== current);
  return <Link href={pathname} locale={other} lang={other} {...props} />;
}
