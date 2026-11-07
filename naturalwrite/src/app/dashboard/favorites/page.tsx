import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { DocumentTable } from "@/components/library/document-table";
import { listFavoriteDocuments } from "@/lib/data";

export const metadata: Metadata = {
  title: "Favorites",
  description: "Documents you starred.",
};

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const documents = await listFavoriteDocuments();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Favorites"
        description="Quick access to the documents you return to most."
      />
      <Card className="overflow-hidden">
        <DocumentTable
          documents={documents}
          emptyTitle="No favourites yet"
          emptyDescription="Star a document from the library and it will appear here for quick access."
        />
      </Card>
    </div>
  );
}
