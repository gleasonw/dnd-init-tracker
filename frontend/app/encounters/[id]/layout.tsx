import { getEncounter } from "@/app/encounters/api";

export default async function EncounterLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: any;
}) {
  const { encounter } = await getEncounter(params.id);
  console.log(encounter);
  return <section>{children}</section>;
}
