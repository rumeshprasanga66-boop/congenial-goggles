import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { ComingSoon } from "@/components/app/coming-soon";
import { PageHeader } from "@/components/app/page-header";

export const metadata: Metadata = {
  title: "Trash",
  description: "Restore or permanently delete.",
};

export default function TrashPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Trash"
        description="Deleted documents stay recoverable here before permanent removal."
      />
      <ComingSoon
        icon={Trash2}
        title="Trash needs document storage"
        description="Soft deletion uses a deleted_at timestamp so nothing is destroyed immediately. Restore and permanent delete both appear once the library exists."
        phase="Phase 3"
        requires={["The documents table with the deleted_at column"]}
      />
    </div>
  );
}
