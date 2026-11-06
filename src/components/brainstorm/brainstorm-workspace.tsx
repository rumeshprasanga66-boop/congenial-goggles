"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { AlertCircle, Lightbulb, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldHint, Input, Label, Select } from "@/components/ui/form";
import { BRAINSTORM_KINDS, type BrainstormKind } from "@/lib/ai/prompts";
import { GenerationError, postJson } from "@/components/studio/api";

/**
 * Brainstorm workspace.
 *
 * Generates a set of ideas around a subject. Each idea can be sent straight into
 * the studio as a topic, so the list is a starting point rather than a dead end.
 */

interface Idea {
  title: string;
  note: string;
}

interface BrainstormResponse {
  ideas: Idea[];
}

export function BrainstormWorkspace({
  brandVoices = [],
}: {
  brandVoices?: Array<{ id: string; name: string }>;
}) {
  const [subject, setSubject] = useState("");
  const [kind, setKind] = useState<BrainstormKind>("topics");
  const [count, setCount] = useState(10);
  const [brandVoiceId, setBrandVoiceId] = useState("");
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    if (!subject.trim()) {
      setError("Enter a subject to brainstorm around.");
      return;
    }

    setRunning(true);
    setError(null);
    try {
      const response = await postJson<BrainstormResponse>("/api/generate/brainstorm", {
        subject,
        kind,
        count,
        brandVoiceId: brandVoiceId || undefined,
      });
      setIdeas(response.ideas);
    } catch (caught) {
      if (caught instanceof GenerationError) {
        setError(caught.details.length > 0 ? caught.details.join(" ") : caught.message);
      } else {
        setError(caught instanceof Error ? caught.message : "The brainstorm failed.");
      }
    } finally {
      setRunning(false);
    }
  }, [brandVoiceId, count, kind, subject]);

  return (
    <div className="space-y-5">
      <Card>
        <CardBody className="space-y-4">
          <div>
            <Label htmlFor="brainstorm-subject">Subject</Label>
            <Input
              id="brainstorm-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              maxLength={300}
              placeholder="e.g. Reducing onboarding drop-off in a B2B product"
              className="mt-1.5"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="brainstorm-kind">Generate</Label>
              <Select
                id="brainstorm-kind"
                value={kind}
                onChange={(event) => setKind(event.target.value as BrainstormKind)}
                className="mt-1.5"
              >
                {Object.entries(BRAINSTORM_KINDS).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="brainstorm-count">How many</Label>
              <Input
                id="brainstorm-count"
                type="number"
                min={3}
                max={20}
                value={count}
                onChange={(event) => setCount(Number(event.target.value) || 10)}
                className="mt-1.5"
              />
              <FieldHint>Between 3 and 20.</FieldHint>
            </div>

            <div>
              <Label htmlFor="brainstorm-voice">Brand voice</Label>
              <Select
                id="brainstorm-voice"
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

          <div className="flex justify-end">
            <Button onClick={() => void run()} disabled={running || !subject.trim()}>
              {running ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  Thinking…
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5" aria-hidden="true" />
                  Generate ideas
                </>
              )}
            </Button>
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

      {ideas === null ? (
        <Card>
          <EmptyState
            icon={<Lightbulb className="size-5" aria-hidden="true" />}
            title="No ideas yet"
            description="Enter a subject above and generate a set of ideas. Each one can be sent into the studio as a starting topic."
          />
        </Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {ideas.map((idea, index) => (
            <li key={`${idea.title}-${index}`}>
              <Card className="flex h-full flex-col p-4">
                <h3 className="text-sm font-medium text-ink">{idea.title}</h3>
                {idea.note && (
                  <p className="mt-1 flex-1 text-xs leading-relaxed text-muted">{idea.note}</p>
                )}
                <Link
                  href={`/dashboard/writer?topic=${encodeURIComponent(idea.title)}`}
                  className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-control border border-line px-2.5 py-1.5 text-2xs font-medium text-muted transition-colors hover:bg-subtle hover:text-ink"
                >
                  Write about this
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
