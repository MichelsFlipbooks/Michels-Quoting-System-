import { createClient } from "@/lib/supabase/server";
import { listCatalogueItems, listDietaryRequirements, listPackagesWithSelections } from "@/lib/queries";
import { QuoteBuilderShell } from "@/components/quote-builder/QuoteBuilderShell";
import { createEmptyDraft } from "@/components/quote-builder/state";
import type { Client } from "@/lib/types";

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await searchParams;

  const [catalogueItems, packages, dietaryOptions] = await Promise.all([
    listCatalogueItems(),
    listPackagesWithSelections(),
    listDietaryRequirements(),
  ]);

  let initialClient: Client | null = null;
  if (clientId) {
    const supabase = await createClient();
    const { data } = await supabase.from("clients").select("*").eq("id", clientId).maybeSingle();
    initialClient = (data as Client) ?? null;
  }

  const initialDraft = createEmptyDraft(initialClient);

  return (
    <QuoteBuilderShell
      initialDraft={initialDraft}
      catalogueItems={catalogueItems}
      packages={packages}
      dietaryOptions={dietaryOptions}
    />
  );
}
