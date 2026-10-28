import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";

import { AwsClient } from "aws4fetch";

import { routing } from "../src/i18n/routing.ts";
import {
  indexKey,
  type Lang,
  type PostIndex,
  postKey,
  postKeyPattern,
  renderPost,
  slugPattern,
} from "../src/posts/post.ts";

const bucket = "moex-land-posts";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    remote: { type: "boolean", default: false },
    prune: { type: "boolean", default: false },
    check: { type: "boolean", default: false },
  },
});
if (positionals.length !== 1) {
  console.error("Usage: bun run posts:push <dir> [--remote] [--prune] [--check]");
  console.error("--remote reads CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY");
  process.exit(1);
}

type Store = {
  /** Key → MD5 of every object in the bucket. */
  list(): Promise<Map<string, string>>;
  put(key: string, body: Buffer<ArrayBuffer>, type: string): Promise<void>;
  delete(keys: string[]): Promise<void>;
};

/** The dev server's simulated bucket, through `cf --local`. */
function localStore(): Store {
  const pageSize = 1000;
  const cf = (...args: string[]) =>
    execFileSync(
      "cf",
      [
        "r2",
        "objects",
        ...args,
        "--bucket-name",
        bucket,
        "--local",
        "--persist-to",
        ".cloudflare/state",
      ],
      { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
    );
  return {
    async list() {
      const objects = new Map<string, string>();
      for (let after = ""; ;) {
        const page: { key: string; etag: string }[] = JSON.parse(
          cf("list", "--per-page", String(pageSize), ...(after ? ["--start-after", after] : [])),
        );
        // The local simulation ignores --start-after, so stop once a page brings nothing new.
        const fresh = page.filter(({ key }) => key > after);
        for (const { key, etag } of fresh) objects.set(key, etag);
        if (page.length < pageSize || !fresh.length) return objects;
        after = fresh.at(-1)!.key;
      }
    },
    async put(key, body, type) {
      // `--body` would read a body starting with `---` as a flag.
      const temp = await mkdtemp(path.join(tmpdir(), "posts-"));
      try {
        await writeFile(path.join(temp, "body"), body);
        cf("put", key, "--file", path.join(temp, "body"), "--content-type", type);
      } finally {
        await rm(temp, { recursive: true });
      }
    },
    async delete(keys) {
      for (let i = 0; i < keys.length; i += pageSize) {
        cf("bulk-delete", "--force", "--body", JSON.stringify(keys.slice(i, i + pageSize)));
      }
    },
  };
}

function xmlText(xml: string, tag: string) {
  const entities: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
  return new RegExp(`<${tag}>([^<]*)</${tag}>`)
    .exec(xml)?.[1]
    .replace(/&(#x?)?(\w+);/g, (_, number: string | undefined, code: string) =>
      number ? String.fromCodePoint(parseInt(code, number === "#x" ? 16 : 10)) : entities[code],
    );
}

/** The production bucket, through the S3 API with a token scoped to this bucket. */
function s3Store(): Store {
  const {
    CLOUDFLARE_ACCOUNT_ID: account,
    R2_ACCESS_KEY_ID: accessKeyId,
    R2_SECRET_ACCESS_KEY: secretAccessKey,
  } = process.env;
  if (!account || !accessKeyId || !secretAccessKey) {
    console.error(
      "--remote needs CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY",
    );
    process.exit(1);
  }
  const client = new AwsClient({ accessKeyId, secretAccessKey, service: "s3", region: "auto" });
  const base = `https://${account}.r2.cloudflarestorage.com/${bucket}`;
  const send = async (url: string, init: RequestInit = {}) => {
    const response = await client.fetch(url, init);
    if (!response.ok) {
      throw new Error(
        `${init.method ?? "GET"} ${url}: ${response.status} ${await response.text()}`,
      );
    }
    return response;
  };
  return {
    async list() {
      const objects = new Map<string, string>();
      let token: string | undefined;
      do {
        const url = new URL(base);
        url.searchParams.set("list-type", "2");
        if (token) url.searchParams.set("continuation-token", token);
        const xml = await (await send(url.href)).text();
        for (const [, entry] of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
          objects.set(xmlText(entry, "Key")!, xmlText(entry, "ETag")!.replaceAll('"', ""));
        }
        token = xmlText(xml, "NextContinuationToken");
      } while (token);
      return objects;
    },
    async put(key, body, type) {
      await send(`${base}/${key}`, { method: "PUT", body, headers: { "Content-Type": type } });
    },
    async delete(keys) {
      for (const key of keys) await send(`${base}/${key}`, { method: "DELETE" });
    },
  };
}

function isLang(lang: string): lang is Lang {
  return (routing.locales as readonly string[]).includes(lang);
}

function md5(data: string | Buffer) {
  return createHash("md5").update(data).digest("hex");
}

const [dir] = positionals;
const files = new Map<string, { body: Buffer<ArrayBuffer>; hash: string }>();
const index: PostIndex = {};
let failed = false;
const slugs = (await readdir(dir, { withFileTypes: true })).filter((entry) => entry.isDirectory());
for (const slug of slugs.map((entry) => entry.name).sort()) {
  for (const name of (await readdir(path.join(dir, slug))).sort()) {
    if (!name.endsWith(".md")) continue;
    const file = path.join(dir, slug, name);
    const lang = path.basename(name, ".md");
    if (!slugPattern.test(slug) || !isLang(lang)) {
      console.error(
        `${file}: expected <slug>/<${routing.locales.join("|")}>.md, slug in [a-z0-9-]`,
      );
      failed = true;
      continue;
    }
    const body = await readFile(file);
    try {
      const { meta, messages } = renderPost(body.toString("utf8"), lang);
      for (const { line, column, reason } of messages) {
        console.error(`${file}:${line}:${column}: ${reason}`);
        failed = true;
      }
      (index[slug] ??= {})[lang] = meta;
    } catch (error) {
      console.error(`${file}: ${error instanceof Error ? error.message : error}`);
      failed = true;
    }
    files.set(postKey(slug, lang), { body, hash: md5(body) });
  }
}
if (!files.size) {
  console.error(`${dir}: no posts found`);
  failed = true;
}
if (failed) process.exit(1);
if (values.check) process.exit(0);

const store = values.remote ? s3Store() : localStore();
const remote = await store.list();

let uploaded = 0;
for (const [key, { body, hash }] of files) {
  if (remote.get(key) === hash) continue;
  console.log(`put ${key}`);
  await store.put(key, body, "text/markdown; charset=utf-8");
  uploaded++;
}
console.log(`${uploaded} of ${files.size} posts changed`);

const json = Buffer.from(JSON.stringify(index));
if (remote.get(indexKey) !== md5(json)) {
  console.log(`put ${indexKey}`);
  await store.put(indexKey, json, "application/json");
}

const orphans = [...remote.keys()].filter((key) => postKeyPattern.test(key) && !files.has(key));
if (orphans.length && values.prune) {
  await store.delete(orphans);
  console.log(`deleted ${orphans.join(", ")}`);
} else if (orphans.length) {
  console.warn(`Unlisted, not in ${dir} (--prune deletes them): ${orphans.join(", ")}`);
}
