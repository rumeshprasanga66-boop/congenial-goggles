import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocumentEditor } from "@/components/library/document-editor";
import { getDocumentById } from "@/lib/data";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const document = await getDocumentById(id);
  return {
    title: document ? document.title : "Document not found",
    description: "Edit and save this document.",
  };
}

export default async function DocumentPage({ params }: { params: Params }) {
  const { id } = await params;
  const document = await getDocumentById(id);
  if (!document) notFound();

  return <DocumentEditor document={document} />;
}
