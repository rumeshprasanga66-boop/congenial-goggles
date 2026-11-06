import type { Metadata } from "next";
import { Star } from "lucide-react";
import { ComingSoon } from "@/components/app/coming-soon";
import { PageHeader } from "@/components/app/page-header";

export const metadata: Metadata = {
  title: "Favorites",
  description: "Documents you starred.",
};

export default function FavoritesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Favorites"
        description="Quick access to the documents you return to most."
      />
      <ComingSoon
        icon={Star}
        title="Favorites need document storage"
        description="Starring a document only means something once documents are saved. This view will filter your library by the favorite flag."
        phase="Phase 3"
        requires={["The documents table with the is_favorite column"]}
      />
    </div>
  );
}
