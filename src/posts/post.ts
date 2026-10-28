import type { Root as HastRoot } from "hast";
import type { Root } from "mdast";
import remarkCjkFriendlyGfmStrikethrough from "remark-cjk-friendly-gfm-strikethrough/parseOnly";
import remarkCjkFriendly from "remark-cjk-friendly/parseOnly";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype, { type Options as RehypeOptions } from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { VFile } from "vfile";
import { parse as parseYaml } from "yaml";

import type { routing } from "@/i18n/routing";

export type Lang = (typeof routing.locales)[number];

export type PostMeta = {
  title: string;
  date: string;
  description?: string;
};

export type PostIndex = Record<string, Partial<Record<Lang, PostMeta>>>;

export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const postKeyPattern = /^([a-z0-9-]+)\/([a-z]+)\.md$/;

export const indexKey = "index.json";

export function postKey(slug: string, lang: Lang) {
  return `${slug}/${lang}.md`;
}

const parser = unified()
  .use(remarkParse)
  .use(remarkFrontmatter)
  .use(remarkGfm)
  .use(remarkCjkFriendly)
  .use(remarkCjkFriendlyGfmStrikethrough)
  .freeze();

const footnotes: Record<Lang, RehypeOptions> = {
  zh: {
    footnoteLabel: "脚注",
    footnoteBackLabel: (index, rereference) =>
      `返回引用${index + 1}${rereference > 1 ? `-${rereference}` : ""}`,
  },
  en: {},
};

function remarkCheck(lang: Lang) {
  return (tree: Root, file: VFile) => {
    visit(tree, (node) => {
      if (node.type === "emphasis" && lang === "zh") {
        file.message("Use **strong** for emphasis in Chinese, not *em*", node);
      } else if (node.type === "text") {
        const { start, end } = node.position!;
        if (String(file.value).slice(start.offset, end.offset).includes("**")) {
          file.message("Unmatched `**` shows up as literal asterisks", node);
        }
      }
    });
  };
}

function toMeta(tree: Root): PostMeta {
  const head = tree.children[0];
  if (head?.type !== "yaml") throw new Error("Missing front matter");
  const { title, date, description } = parseYaml(head.value) ?? {};
  if (typeof title !== "string" || !title) {
    throw new Error("Front matter `title` must be a non-empty string");
  }
  if (
    typeof date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(Date.parse(date))
  ) {
    throw new Error("Front matter `date` must be a YYYY-MM-DD date");
  }
  if (description !== undefined && typeof description !== "string") {
    throw new Error("Front matter `description` must be a string");
  }
  return { title, date, description };
}

export function renderPost(source: string, lang: Lang) {
  const file = new VFile(source);
  const tree = parser.parse(file);
  const meta = toMeta(tree);
  const hast: HastRoot = unified()
    .use(remarkCheck, lang)
    .use(remarkRehype, {
      ...footnotes[lang],
      // Same as the default; spelled out so Tailwind generates `sr-only`.
      footnoteLabelProperties: { className: ["sr-only"] },
    })
    .runSync(tree, file);
  return { meta, hast, messages: file.messages };
}
