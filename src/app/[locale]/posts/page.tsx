import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { listPosts } from "@/posts/store";

import { PostDate } from "../post-date";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Posts");
  return { title: t("title") };
}

function endonym(lang: string) {
  return new Intl.DisplayNames([lang], { type: "language" }).of(lang);
}

export default async function PostsPage() {
  const locale = await getLocale();
  const t = await getTranslations("Posts");
  const posts = await listPosts(locale);
  return (
    <>
      <h1 className="sr-only">{t("title")}</h1>
      {posts.length ? (
        <ul className="space-y-6">
          {posts.map(({ slug, lang, meta }) => (
            <li key={slug}>
              <Link
                href={`/posts/${slug}`}
                lang={lang === locale ? undefined : lang}
                className="text-lg font-medium decoration-2 underline-offset-[.3em] hover:underline"
              >
                {meta.title}
              </Link>
              <p className="text-sm text-gray-500">
                <PostDate date={meta.date} />
                {lang !== locale && <span lang={lang}> · {endonym(lang)}</span>}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">{t("empty")}</p>
      )}
    </>
  );
}
