import type { Lang } from "@/posts/post";

export type LinkGroup = "friends" | "seeAlso" | "archived";

export type LocalizedText = string | Record<Lang, string>;

export type LinkItem = {
  id: string;
  name: LocalizedText;
  url: string;
  description: LocalizedText;
  avatar?: string;
  /** Primary language of plain-string fields for accurate `lang` markup. */
  lang?: string;
  /** Optional RSS/Atom feed URL reserved for future OPML export (not displayed on cards). */
  feed?: string;
  /** Optional personal note by Moonchime, localized per site locale. */
  note?: Partial<Record<Lang, string>>;
  group: LinkGroup;
  /** Year marked archived/unreachable (only for `group: "archived"`). */
  archivedYear?: number;
};

export const links: LinkItem[] = [
  {
    id: "ventusuta",
    name: "Ventus Uta",
    url: "https://ventusuta.com/",
    description: "8 点、Classroom 见",
    avatar: "https://avatars.githubusercontent.com/u/135337676?v=4",
    lang: "zh",
    feed: "https://ventusuta.com/rss.xml",
    group: "friends",
  },
  {
    id: "zitools",
    name: { zh: "字統网", en: "zi.tools" },
    url: "https://zi.tools/",
    description: {
      zh: "漢字與非漢字源、形、音、義、碼网羅站點",
      en: "Yet another full index of CJKV Ideographs, and more",
    },
    avatar: "https://zi.tools/appletouchicon.png",
    group: "seeAlso",
  },
  {
    id: "hakadao",
    name: "Hakadao",
    url: "https://hakadao.cc/",
    description: "Now I am become a loser, the destroyer of myself",
    avatar: "https://avatars.githubusercontent.com/u/33394391?v=4",
    lang: "en",
    group: "seeAlso",
  },
  {
    id: "xinshijiededamen",
    name: "新世界的大门",
    url: "https://blog.xinshijiededa.men/",
    description: {
      zh: "因此幻想是世界，谁若懂得，谁就会歌唱",
      en: "So fancy is the world, who knows, maybe they sing",
    },
    avatar: "https://avatars.githubusercontent.com/u/20166026?v=4",
    lang: "zh",
    feed: "https://blog.xinshijiededa.men/atom.xml/",
    group: "seeAlso",
  },
];

export function resolveText(text: LocalizedText, locale: Lang): string {
  return typeof text === "string" ? text : text[locale];
}

/** Strip protocol and trailing slash for quiet domain display on link cards. */
export function cleanHost(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/+$/, "");
    return `${parsed.host}${path}`;
  } catch {
    return url.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  }
}
