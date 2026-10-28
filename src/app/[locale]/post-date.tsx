import { useFormatter } from "next-intl";

export function PostDate({ date }: { date: string }) {
  const format = useFormatter();
  return (
    <time dateTime={date}>
      {format.dateTime(new Date(date), { dateStyle: "long", timeZone: "UTC" })}
    </time>
  );
}
