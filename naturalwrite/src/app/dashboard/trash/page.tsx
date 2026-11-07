import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { TrashList } from "@/components/library/trash-list";
import { listTrashedDocuments } from "@/lib/data";
import { TRASH_RETENTION_DAYS } from "@/lib/documents/query";

export const metadata: Metadata = {
  title: "Trash",
  description: "Restore or permanently delete.",
};

export const dynamic = "force-dynamic";

export default async function TrashPage() {
  const documents = await listTrashedDocuments();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trash"
        description={`Deleted documents stay recoverable here. Nothing is removed automatically yet, so this is a manual hold rather than a ${TRASH_RETENTION_DAYS}-day timer.`}
      />
      <Card className="overflow-hidden">
        {documents.length === 0 ? (
          <CardBody>
            <p className="py-6 text-center text-sm text-muted">
              Trash is empty. Documents you delete from the library will collect here.
            </p>
          </CardBody>
        ) : (
          <TrashList documents={documents} />
        )}
      </Card>
    </div>
  );
}
