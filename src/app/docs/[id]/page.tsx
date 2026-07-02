import DocClient from "./DocClient";

export default async function DocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DocClient initialId={id} />;
}
