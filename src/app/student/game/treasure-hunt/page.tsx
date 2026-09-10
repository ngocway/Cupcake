import { redirect } from "next/navigation";

export default async function StudentTreasureHuntPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await searchParams;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(resolvedParams)) {
    if (Array.isArray(value)) {
      value.forEach((v) => query.append(key, v));
    } else if (typeof value === "string") {
      query.set(key, value);
    }
  }

  const queryString = query.toString();
  redirect(`/game/treasure-grid${queryString ? `?${queryString}` : ""}`);
}
