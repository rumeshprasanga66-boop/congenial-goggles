"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldHint, Input, Label, Textarea } from "@/components/ui/form";
import { renderBrandVoice } from "@/lib/brand-voice/render";
import type { BrandVoiceRecord } from "@/lib/types";

type Draft = {
  name: string;
  description: string;
  tone: string;
  audience: string;
  wordsToUse: string;
  wordsToAvoid: string;
  instructions: string;
};

const EMPTY_DRAFT: Draft = {
  name: "",
  description: "",
  tone: "",
  audience: "",
  wordsToUse: "",
  wordsToAvoid: "",
  instructions: "",
};

function toDraft(voice: BrandVoiceRecord): Draft {
  return {
    name: voice.name,
    description: voice.description,
    tone: voice.tone,
    audience: voice.audience,
    wordsToUse: voice.wordsToUse.join(", "),
    wordsToAvoid: voice.wordsToAvoid.join(", "),
    instructions: voice.instructions,
  };
}

/**
 * Brand voice manager.
 *
 * A voice is only worth saving if it changes the output, so the form shows a
 * live preview of the exact guidance that will be sent to the model. An empty
 * voice is called out rather than silently doing nothing.
 */
export function BrandVoiceManager({ voices }: { voices: BrandVoiceRecord[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(voices.length === 0);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = renderBrandVoice({
    name: draft.name,
    description: draft.description,
    tone: draft.tone,
    audience: draft.audience,
    wordsToUse: draft.wordsToUse.split(/[,\n]/).map((word) => word.trim()).filter(Boolean),
    wordsToAvoid: draft.wordsToAvoid.split(/[,\n]/).map((word) => word.trim()).filter(Boolean),
    instructions: draft.instructions,
  });

  function startCreate() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setCreating(true);
    setError(null);
  }

  function startEdit(voice: BrandVoiceRecord) {
    setEditingId(voice.id);
    setDraft(toDraft(voice));
    setCreating(true);
    setError(null);
  }

  function close() {
    setCreating(false);
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setError(null);
  }

  async function submit() {
    if (!draft.name.trim()) {
      setError("Give the voice a name.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(
        editingId ? `/api/brand-voices/${editingId}` : "/api/brand-voices",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error ?? "The voice could not be saved.");
        return;
      }
      close();
      startTransition(() => router.refresh());
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/brand-voices/${id}`, { method: "DELETE" });
      if (!response.ok) {
        setError("The voice could not be deleted.");
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-control border border-danger/25 bg-danger/5 px-3 py-2.5 text-xs text-danger"
        >
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      {!creating && (
        <Button size="sm" onClick={startCreate}>
          <Plus className="size-3.5" aria-hidden="true" />
          New brand voice
        </Button>
      )}

      {creating && (
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">
              {editingId ? "Edit brand voice" : "New brand voice"}
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label="Close the form"
              className="rounded-control p-1.5 text-faint hover:bg-subtle hover:text-ink"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <div>
                <Label htmlFor="voice-name">Name</Label>
                <Input
                  id="voice-name"
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  maxLength={80}
                  placeholder="e.g. House editorial"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="voice-description">How it should sound</Label>
                <Textarea
                  id="voice-description"
                  value={draft.description}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                  rows={2}
                  maxLength={400}
                  placeholder="Plain and direct. Short sentences. No filler."
                  className="mt-1.5"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="voice-tone">Tone</Label>
                  <Input
                    id="voice-tone"
                    value={draft.tone}
                    onChange={(event) => setDraft({ ...draft, tone: event.target.value })}
                    maxLength={80}
                    placeholder="Confident"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="voice-audience">Audience</Label>
                  <Input
                    id="voice-audience"
                    value={draft.audience}
                    onChange={(event) => setDraft({ ...draft, audience: event.target.value })}
                    maxLength={80}
                    placeholder="Engineers"
                    className="mt-1.5"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="voice-use">Words to prefer</Label>
                <Input
                  id="voice-use"
                  value={draft.wordsToUse}
                  onChange={(event) => setDraft({ ...draft, wordsToUse: event.target.value })}
                  placeholder="ship, loop, concrete"
                  className="mt-1.5"
                />
                <FieldHint>Comma separated. Up to 40 words.</FieldHint>
              </div>
              <div>
                <Label htmlFor="voice-avoid">Words to avoid</Label>
                <Input
                  id="voice-avoid"
                  value={draft.wordsToAvoid}
                  onChange={(event) => setDraft({ ...draft, wordsToAvoid: event.target.value })}
                  placeholder="delve, leverage, synergy"
                  className="mt-1.5"
                />
                <FieldHint>Comma separated. Up to 40 words.</FieldHint>
              </div>
              <div>
                <Label htmlFor="voice-instructions">Extra instructions</Label>
                <Textarea
                  id="voice-instructions"
                  value={draft.instructions}
                  onChange={(event) => setDraft({ ...draft, instructions: event.target.value })}
                  rows={3}
                  maxLength={2000}
                  placeholder="Never use exclamation marks. Avoid rhetorical questions."
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-ink">What the model will be told</p>
              <pre className="mt-2 whitespace-pre-wrap rounded-control border border-line bg-subtle p-3 text-xs leading-relaxed text-muted">
                {preview || "Nothing yet. Fill in a field to add guidance."}
              </pre>
              {preview === "" && (
                <p className="mt-2 text-xs text-caution">
                  A voice with no guidance changes nothing. Add at least one field.
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2">
            <Button size="sm" onClick={() => void submit()} disabled={busy || pending}>
              {editingId ? "Save changes" : "Create voice"}
            </Button>
            <Button variant="ghost" size="sm" onClick={close} disabled={busy}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {voices.length === 0 && !creating ? (
        <Card className="p-8 text-center">
          <p className="text-sm font-medium text-ink">No brand voices yet</p>
          <p className="mx-auto mt-1 max-w-md text-xs text-muted">
            A brand voice is reusable guidance applied to generation. Create one and
            it becomes available in the studio, the rewriter and brainstorm.
          </p>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {voices.map((voice) => {
            const guidance = renderBrandVoice(voice);
            return (
              <li key={voice.id}>
                <Card className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-ink">{voice.name}</h3>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => startEdit(voice)}
                        aria-label={`Edit ${voice.name}`}
                        className="rounded-control p-1.5 text-faint hover:bg-subtle hover:text-ink"
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(voice.id)}
                        disabled={busy || pending}
                        aria-label={`Delete ${voice.name}`}
                        className="rounded-control p-1.5 text-faint hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {voice.description && (
                    <p className="mt-1.5 text-xs leading-relaxed text-muted">
                      {voice.description}
                    </p>
                  )}

                  {guidance ? (
                    <pre className="mt-3 flex-1 whitespace-pre-wrap rounded-control border border-line bg-subtle p-2.5 text-2xs leading-relaxed text-muted">
                      {guidance}
                    </pre>
                  ) : (
                    <p className="mt-3 flex-1 text-xs text-caution">
                      This voice has no guidance, so it changes nothing. Edit it to add
                      some.
                    </p>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
