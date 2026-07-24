import Link from "next/link";
import { listQuoteVersions } from "@/actions/versions";
import { formatAUD } from "@/lib/format";
import { Card } from "@/components/ui/Card";

export default async function ClientPdfPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const versions = await listQuoteVersions(id);

  if (versions.length === 0) {
    return (
      <Card>
        <p className="text-navy-dark/70">
          No version of this quote has been issued yet. Go back to the{" "}
          <Link href={`/quotes/${id}`} className="font-medium text-copper hover:underline">
            quote builder
          </Link>{" "}
          and click <strong>Issue Quote / PDF</strong>.
        </p>
      </Card>
    );
  }

  const latest = versions[0];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-navy-dark">Client Quote — PDF</h1>
        <a
          href={`/api/quotes/${id}/pdf?version=${latest.version_number}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-dark"
        >
          Open / Download / Print
        </a>
      </div>

      <Card className="mb-4">
        <h2 className="mb-2 text-sm font-semibold text-navy-dark">Issued Versions</h2>
        <ul className="divide-y divide-border-soft text-sm">
          {versions.map((v) => (
            <li key={v.id} className="flex items-center justify-between py-2">
              <span>
                Version {v.version_number} — {formatAUD(v.new_total_cents)}
                {v.reason_for_revision && <span className="text-navy-dark/60"> ({v.reason_for_revision})</span>}
              </span>
              <a
                href={`/api/quotes/${id}/pdf?version=${v.version_number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-copper hover:underline"
              >
                View
              </a>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-0">
        <iframe
          src={`/api/quotes/${id}/pdf?version=${latest.version_number}`}
          className="h-[80vh] w-full rounded-xl"
          title="Client Quote PDF"
        />
      </Card>
    </div>
  );
}
