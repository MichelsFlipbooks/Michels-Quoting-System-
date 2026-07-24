import { Card } from "@/components/ui/Card";

export default async function KitchenCopyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-navy-dark">Kitchen & Operations Copy</h1>
        <a
          href={`/api/quotes/${id}/kitchen-pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-dark"
        >
          Open / Download / Print
        </a>
      </div>

      <Card className="p-0">
        <iframe
          src={`/api/quotes/${id}/kitchen-pdf`}
          className="h-[85vh] w-full rounded-xl"
          title="Kitchen & Operations Copy"
        />
      </Card>
    </div>
  );
}
