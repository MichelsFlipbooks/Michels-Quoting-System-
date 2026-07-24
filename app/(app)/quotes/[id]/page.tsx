import { notFound } from "next/navigation";
import {
  getQuoteForBuilder,
  listCatalogueItems,
  listDietaryRequirements,
  listPackagesWithSelections,
} from "@/lib/queries";
import { QuoteBuilderShell } from "@/components/quote-builder/QuoteBuilderShell";
import { draftFromExisting } from "@/components/quote-builder/state";

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [quoteData, catalogueItems, packages, dietaryOptions] = await Promise.all([
    getQuoteForBuilder(id),
    listCatalogueItems(),
    listPackagesWithSelections(),
    listDietaryRequirements(),
  ]);

  if (!quoteData) notFound();

  const initialDraft = draftFromExisting(
    quoteData.quote,
    quoteData.client,
    quoteData.lineItems,
    quoteData.dietaryRequirements,
    quoteData.timelineItems,
  );

  return (
    <QuoteBuilderShell
      initialDraft={initialDraft}
      catalogueItems={catalogueItems}
      packages={packages}
      dietaryOptions={dietaryOptions}
    />
  );
}
