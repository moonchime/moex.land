import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { cleanHost, type LinkItem, links, type LocalizedText, resolveText } from "@/data/links";
import type { Lang } from "@/posts/post";

import { LinkAvatar } from "./link-avatar";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Links");
  return { title: t("title"), description: t("description") };
}

function foreignLangFor(
  text: LocalizedText,
  itemLang: string | undefined,
  locale: string,
): string | undefined {
  return typeof text === "string" && itemLang && itemLang !== locale ? itemLang : undefined;
}

function LinkGrid({ items, locale }: { items: LinkItem[]; locale: string }) {
  return (
    // Restore list semantics stripped by Safari when list markers are removed inside Grid.
    // oxlint-disable-next-line jsx-a11y/no-redundant-roles
    <ul role="list" className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => {
        const name = resolveText(item.name, locale as Lang);
        const description = resolveText(item.description, locale as Lang);
        const nameLang = foreignLangFor(item.name, item.lang, locale);
        const descLang = foreignLangFor(item.description, item.lang, locale);
        const host = cleanHost(item.url);
        const showHost = name.trim().toLowerCase() !== host.toLowerCase();
        const note = item.note?.[locale as Lang];
        return (
          <li
            key={item.id}
            className="link-card-rows row-span-2 grid min-w-0 gap-3.5 border border-gray-200 bg-white p-4"
          >
            <div className="flex min-w-0 items-center gap-3">
              <LinkAvatar name={name} src={item.avatar} />
              <div className="min-w-0">
                <p className="font-medium">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener"
                    lang={nameLang}
                    className="decoration-2 underline-offset-[.3em] hover:underline"
                  >
                    {name}
                  </a>
                  <span aria-hidden="true" className="ml-1 text-gray-500">
                    ↗
                  </span>
                </p>
                {showHost && <p className="mt-0.5 text-sm wrap-anywhere text-gray-500">{host}</p>}
              </div>
            </div>
            <div className="flex min-w-0 flex-col gap-2.5">
              <p lang={descLang} className="text-sm text-pretty text-gray-700">
                {description}
              </p>
              {note && (
                <p className="border-l-2 border-gray-300 pl-2.5 text-sm text-pretty text-gray-500">
                  {note}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default async function LinksPage() {
  const locale = await getLocale();
  const t = await getTranslations("Links");

  const activeGroups = [
    { key: "friends" as const, items: links.filter((item) => item.group === "friends") },
    {
      key: "seeAlso" as const,
      items: links
        .filter((item) => item.group === "seeAlso")
        .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)),
    },
  ].filter((group) => group.items.length > 0);

  const archived = links.filter((item) => item.group === "archived");
  const showGroupHeadings = activeGroups.length > 1;

  return (
    <>
      <section>
        <h1 className="text-2xl font-medium">{t("title")}</h1>
        <p className="mt-3 text-pretty text-gray-700">{t("description")}</p>
      </section>

      {!activeGroups.length && !archived.length ? (
        <p className="mt-10 text-gray-500">{t("empty")}</p>
      ) : (
        <>
          {activeGroups.map(({ key, items }, index) => (
            <section key={key} className={index === 0 ? "mt-10" : "mt-12"}>
              {showGroupHeadings && <h2 className="mb-3 text-sm text-gray-500">{t(key)}</h2>}
              <LinkGrid items={items} locale={locale} />
            </section>
          ))}

          {archived.length > 0 && (
            <section className="mt-12 border-t border-gray-300 pt-8">
              <h2 className="text-sm text-gray-500">{t("archived")}</h2>
              {/* oxlint-disable-next-line jsx-a11y/no-redundant-roles */}
              <ul role="list" className="mt-3 grid gap-4 sm:grid-cols-2">
                {archived.map((item) => {
                  const name = resolveText(item.name, locale as Lang);
                  const description = resolveText(item.description, locale as Lang);
                  const nameLang = foreignLangFor(item.name, item.lang, locale);
                  const descLang = foreignLangFor(item.description, item.lang, locale);
                  const host = cleanHost(item.url);
                  const showHost = name.trim().toLowerCase() !== host.toLowerCase();
                  const meta = showHost
                    ? `${host}${item.archivedYear ? ` · ${item.archivedYear}` : ""}`
                    : item.archivedYear
                      ? String(item.archivedYear)
                      : "";
                  return (
                    <li
                      key={item.id}
                      className="flex min-w-0 items-start gap-3 border border-dashed border-gray-300 p-4 text-gray-500"
                    >
                      <LinkAvatar name={name} src={item.avatar} muted />
                      <div className="min-w-0">
                        <p lang={nameLang} className="text-sm font-medium">
                          {name}
                        </p>
                        {meta && (
                          <p className="mt-0.5 text-sm wrap-anywhere tabular-nums">{meta}</p>
                        )}
                        <p lang={descLang} className="mt-1.5 text-sm text-pretty">
                          {description}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}
    </>
  );
}
