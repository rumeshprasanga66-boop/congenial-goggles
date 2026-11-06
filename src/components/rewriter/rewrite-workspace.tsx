"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AlertCircle, Check, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { FieldHint, Label, Select, Textarea } from "@/components/ui/form";
import { countWords } from "@/lib/format";
import { REWRITE_ACTIONS, type RewriteAction } from "@/lib/ai/prompts";
import { TONES } from "@/lib/ai/options";
import type { ToneId } from "@/lib/ai/options";
import { GenerationError, postJson } from "@/components/studio/api";

/**
 * Rewrite workspace.
 *
 * Paste text, choose an improvement, and compare. The original is never
 * overwritten: the revision sits beside it and the user decides what to keep.
 */

interface RewriteResponse {
  text: string;
  original: string;
}

const MAX_TEXT_LENGTH = 12000;

export function RewriteWorkspace({
  brandVoices = [],
}: {
  brandVoices?: Array<{ id: string; name: string }>;
}) {
  const [original, setOriginal] = useState("");
  const [revision, setRevision] = useState<string | null>(null);
  const [action, setAction] = useState<RewriteAction>("improve");
  const [tone, setTone] = useState<ToneId>("natural");
  const [instructions, setInstructions] = useState("");
  const [brandVoiceId, setBrandVoiceId] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const revisionRef = useRef<string | null>(null);
  revisionRef.current = revision;

  const words = useMemo(() => countWords(original), [original]);
  const revisionWords = useMemo(() => (revision ? countWords(revision) : 0), [revision]);

  const run = useCallback(async () => {
    if (!original.trim()) {
      setError("Paste some text to rewrite.");
      return;
    }
    if (original.length > MAX_TEXT_LENGTH) {
      setError(
        `The text must be ${MAX_TEXT_LENGTH.toLocaleString("en-US")} characters or fewer.`,
      );
      return;
    }

    setRunning(true);
    setError(null);
    try {
      const response = await postJson<RewriteResponse>("/api/generate/rewrite", {
        text: original,
        action,
        tone: action === "tone" ? tone : undefined,
        instructions: instructions || undefined,
        brandVoiceId: brandVoiceId || undefined,
      });
      setRevision(response.text);
    } catch (caught) {
      if (caught instanceof GenerationError) {
        setError(caught.details.length > 0 ? caught.details.join(" ") : caught.message);
      } else {
        setError(caught instanceof Error ? caught.message : "The rewrite failed.");
      }
    } finally {
      setRunning(false);
    }
  }, [action, brandVoiceId, instructions, original, tone]);

  async function copyRevision() {
    if (!revisionRef.current) return;
    try {
      await navigator.clipboard.writeText(revisionRef.current);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to the clipboard.");
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="rewrite-action">Improvement</Label>
              <Select
                id="rewrite-action"
                value={action}
                onChange={(event) => setAction(event.target.value as RewriteAction)}
                className="mt-1.5"
              >
                {Object.entries(REWRITE_ACTIONS).map(([id, description]) => (
                  <option key={id} value={id}>
                    {id.charAt(0).toUpperCase() + id.slice(1)} — {description.split(".")[0]}
                  </option>
                ))}
              </Select>
            </div>

            {action === "tone" && (
              <div>
                <Label htmlFor="rewrite-tone">Target tone</Label>
                <Select
                  id="rewrite-tone"
                  value={tone}
                  onChange={(event) => setTone(event.target.value as ToneId)}
                  className="mt-1.5"
                >
                  {TONES.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="rewrite-voice">Brand voice</Label>
              <Select
                id="rewrite-voice"
                value={brandVoiceId}
                onChange={(event) => setBrandVoiceId(event.target.value)}
                className="mt-1.5"
              >
                <option value="">None</option>
                {brandVoices.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="rewrite-instructions">Additional instruction</Label>
            <Textarea
              id="rewrite-instructions"
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Optional. e.g. Keep the technical terms exactly as they are."
              className="mt-1.5"
            />
          </div>
        </CardBody>
      </Card>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-control border border-danger/25 bg-danger/5 px-3 py-2.5"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
          <p className="text-xs text-danger">{error}</p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-faint">
              Your text
            </h2>
            <span className="text-2xs text-muted">{words.toLocaleString("en-US")} words</span>
          </div>
          <Textarea
            value={original}
            onChange={(event) => setOriginal(event.target.value)}
            rows={18}
            maxLength={MAX_TEXT_LENGTH}
            placeholder="Paste the text you want to improve."
            aria-label="Original text"
            className="flex-1 rounded-none border-0 font-serif text-[15px] leading-7 focus:border-0"
          />
          <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
            <span className="text-2xs text-faint">
              {original.length.toLocaleString("en-US")} /{" "}
              {MAX_TEXT_LENGTH.toLocaleString("en-US")}
            </span>
            <Button size="sm" onClick={() => void run()} disabled={running || !original.trim()}>
              {running ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  Rewriting…
                </>
              ) : (
                "Rewrite"
              )}
            </Button>
          </div>
        </Card>

        <Card className="flex flex-col">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-faint">
              Revision
            </h2>
            {revision && (
              <span className="text-2xs text-muted">
                {revisionWords.toLocaleString("en-US")} words
              </span>
            )}
          </div>

          {revision ? (
            <>
              <Textarea
                value={revision}
                onChange={(event) => setRevision(event.target.value)}
                rows={18}
                aria-label="Revised text"
                className="flex-1 rounded-none border-0 font-serif text-[15px] leading-7 focus:border-0"
              />
              <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
                <span className="text-2xs text-muted">
                  {revisionWords === words
                    ? "Same length"
                    : `${revisionWords > words ? "+" : ""}${revisionWords - words} words`}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setRevision(null)}>
                    Discard
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => void copyRevision()}>
                    {copied ? (
                      <>
                        <Check className="size-3.5" aria-hidden="true" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" aria-hidden="true" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 py-16">
              <p className="text-center text-xs text-muted">
                The revision appears here. Your original text is never changed.
              </p>
            </div>
          )}
        </Card>
      </div>

      <FieldHint>
        Revisions are generated, not guaranteed improvements. Read before you use them.
      </FieldHint>
    </div>
  );
}
