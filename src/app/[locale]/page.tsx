import { useTranslations } from "next-intl";

const projects: { id: string; href?: string }[] = [
  { id: "bewly", href: "https://github.com/VentusUta/BewlyBewly-AveMujica" },
  { id: "eliksiro", href: "https://github.com/moexland/eliksiro-sans" },
  { id: "graphene" },
  { id: "moexland", href: "https://github.com/moonchime/moex.land" },
];

const card = "flex w-full flex-col border border-gray-300 p-4";

export default function HomePage() {
  const t = useTranslations("HomePage");
  const tp = useTranslations("Projects");
  return (
    <>
      <section>
        <h1 className="text-2xl font-medium">{t("title")}</h1>
        <div className="mt-3 space-y-3 text-pretty text-gray-700">
          {t.rich("intro", { p: (chunks) => <p>{chunks}</p> })}
        </div>
      </section>
      <section className="mt-14">
        <h2 className="text-sm text-gray-500">{t("projects")}</h2>
        <ul className="mt-3 grid gap-4 sm:grid-cols-2">
          {projects.map(({ id, href }) => {
            const body = (
              <>
                <h3 className="font-medium">{tp(`${id}.name`)}</h3>
                <p className="mt-2 text-sm text-pretty whitespace-pre-line text-gray-700">
                  {tp(`${id}.description`)}
                </p>
                <p className="mt-auto pt-4 text-sm text-gray-500">
                  {href ? (
                    <>
                      {new URL(href).pathname.slice(1)} <span aria-hidden>↗</span>
                    </>
                  ) : (
                    t("unreleased")
                  )}
                </p>
              </>
            );
            return (
              <li key={id} className="flex">
                {href ? (
                  <a href={href} className={`${card} transition-colors hover:border-gray-700`}>
                    {body}
                  </a>
                ) : (
                  <div className={`${card} border-dashed`}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
