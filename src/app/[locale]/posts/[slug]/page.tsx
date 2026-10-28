import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ComponentProps } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";

import { Link } from "@/i18n/navigation";
import { getPost } from "@/posts/store";

import { PostDate } from "../../post-date";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/posts/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPost(slug, locale);
  return { title: post?.meta.title, description: post?.meta.description };
}

function PostLink({ href = "", children, ...props }: ComponentProps<"a">) {
  return /^\/(?!\/)/.test(href) ? (
    <Link href={href} {...props}>
      {children}
    </Link>
  ) : (
    <a href={href} {...props}>
      {children}
    </a>
  );
}

export default async function PostPage({ params }: PageProps<"/[locale]/posts/[slug]">) {
  const { locale, slug } = await params;
  const post = await getPost(slug, locale);
  if (!post) notFound();
  const t = await getTranslations("Post");
  return (
    <>
      {post.lang !== locale && (
        <p className="mb-8 text-sm text-gray-500">{t("untranslated", { lang: post.lang })}</p>
      )}
      <article lang={post.lang} className="prose max-w-none">
        <h1>{post.meta.title}</h1>
        <p lang={locale} className="text-sm text-gray-500">
          <PostDate date={post.meta.date} />
        </p>
        {toJsxRuntime(post.hast, { Fragment, jsx, jsxs, components: { a: PostLink } })}
      </article>
    </>
  );
}
