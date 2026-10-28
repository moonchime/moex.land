import { env } from "cloudflare:workers";
import { hasLocale } from "next-intl";
import { connection } from "next/server";
import { cache } from "react";

import { routing } from "@/i18n/routing";

import { indexKey, type Lang, type PostIndex, postKey, renderPost } from "./post";

function pickLang(langs: PostIndex[string], locale: string): Lang | undefined {
  return [locale, routing.defaultLocale, ...routing.locales].find(
    (lang): lang is Lang => hasLocale(routing.locales, lang) && lang in langs,
  );
}

const getIndex = cache(async (): Promise<PostIndex> => {
  await connection();
  const object = await env.POSTS.get(indexKey);
  return object ? object.json() : {};
});

export async function listPosts(locale: string) {
  const posts = Object.entries(await getIndex()).flatMap(([slug, langs]) => {
    const lang = pickLang(langs, locale);
    return lang ? [{ slug, lang, meta: langs[lang]! }] : [];
  });
  return posts.sort((a, b) => b.meta.date.localeCompare(a.meta.date));
}

export const getPost = cache(async (slug: string, locale: string) => {
  const index = await getIndex();
  if (!Object.hasOwn(index, slug)) return undefined;
  const lang = pickLang(index[slug], locale);
  const object = lang && (await env.POSTS.get(postKey(slug, lang)));
  if (!lang || !object) return undefined;
  return { lang, ...renderPost(await object.text(), lang) };
});
