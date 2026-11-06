"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { countWords } from "@/lib/format";
import { BriefForm } from "./brief-form";
import { OutlineEditor } from "./outline-editor";
import { SectionCard } from "./section-card";
import { Stepper } from "./stepper";
import { GenerationError, postJson } from "./api";
import {
  EMPTY_BRIEF,
  STUDIO_STEPS,
  sectionId,
  type StudioBrief,
  type StudioOutline,
  type StudioStep,
} from "./types";

/**
 * The writing studio.
 *
 * Three steps: describe the piece, review the outline, write and edit the draft.
 * The outline is generated first because structure is the cheapest thing to fix,
 * and prose is written one section at a time so the user sees progress and can
 * keep or discard each part.
 *
 * When no provider key is configured the first request returns 503 and the error
 * is shown in full. The studio never simulates a result.
 */

interface OutlineResponse {
  outline: {
    title: string;
    sections: Array<{ title: string; summary: string; wordTarget: number }>;
  };
}

interface SectionResponse {
  text: string;
}

export function WritingStudio() {
  const [step, setStep] = useState<StudioStep>("brief");
  const [brief, setBrief] = useState<StudioBrief>(EMPTY_BRIEF);
  const [outline, setOutline] = useState<StudioOutline | null>(null);
  const [briefErrors, setBriefErrors] = useState<string[]>([]);
  const [planning, setPlanning] = useState(false);
  const [writingAll, setWritingAll] = useState(false);

  // Keeps each generation request able to see the latest accepted text without
  // making the callbacks depend on the whole outline object.
  const outlineRef = useRef<StudioOutline | null>(null);
  outlineRef.current = outline;

  const wordTotal = useMemo(
    () =>
      outline?.sections.reduce(
        (sum, section) => sum + (section.text ? countWords(section.text) : 0),
        0,
      ) ?? 0,
    [outline],
  );

  const planOutline = useCallback(async () => {
    setBriefErrors([]);
    setPlanning(true);
    try {
      const response = await postJson<OutlineResponse>("/api/generate/outline", {
        topic: brief.topic,
        contentType: brief.contentType,
        tone: brief.tone,
        audience: brief.audience,
        requirements: brief.requirements,
        length: brief.length,
        customWords: brief.customWords,
      });

      setOutline({
        title: response.outline.title,
        sections: response.outline.sections.map((section) => ({
          id: sectionId(),
          title: section.title,
          summary: section.summary,
          wordTarget: section.wordTarget,
          text: null,
          status: "pending",
        })),
      });
      setStep("outline");
    } catch (error) {
      if (error instanceof GenerationError && error.details.length > 0) {
        setBriefErrors(error.details);
      } else {
        setBriefErrors([
          error instanceof Error ? error.message : "The outline could not be planned.",
        ]);
      }
    } finally {
      setPlanning(false);
    }
  }, [brief]);

  const updateSection = useCallback(
    (sectionIdValue: string, patch: Partial<StudioOutline["sections"][number]>) => {
      setOutline((current) =>
        current
          ? {
              ...current,
              sections: current.sections.map((section) =>
                section.id === sectionIdValue ? { ...section, ...patch } : section,
              ),
            }
          : current,
      );
    },
    [],
  );

  /**
   * Write one section. Prior accepted text is sent as context so later sections
   * stay consistent with earlier ones.
   */
  const writeSection = useCallback(
    async (targetId: string) => {
      const current = outlineRef.current;
      if (!current) return;

      const index = current.sections.findIndex((section) => section.id === targetId);
      if (index === -1) return;
      const section = current.sections[index];

      updateSection(targetId, { status: "writing", error: undefined });

      const priorContext = current.sections
        .slice(0, index)
        .filter((entry) => entry.text)
        .map((entry) => `${entry.title}\n${entry.text}`)
        .join("\n\n");

      try {
        const response = await postJson<SectionResponse>("/api/generate/section", {
          brief: {
            topic: brief.topic,
            contentType: brief.contentType,
            tone: brief.tone,
            audience: brief.audience,
            requirements: brief.requirements,
            length: brief.length,
            customWords: brief.customWords,
          },
          sectionTitle: section.title,
          sectionSummary: section.summary,
          sectionWordTarget: section.wordTarget,
          priorContext,
        });
        updateSection(targetId, { text: response.text, status: "ready" });
      } catch (error) {
        updateSection(targetId, {
          status: "error",
          error: error instanceof Error ? error.message : "This section failed to generate.",
        });
      }
    },
    [brief, updateSection],
  );

  /** Write every pending section in order, stopping at the first failure. */
  const writeAll = useCallback(async () => {
    const current = outlineRef.current;
    if (!current) return;

    setWritingAll(true);
    try {
      for (const section of current.sections) {
        const latest = outlineRef.current?.sections.find((entry) => entry.id === section.id);
        if (latest?.text) continue;
        await writeSection(section.id);
        const after = outlineRef.current?.sections.find((entry) => entry.id === section.id);
        if (after?.status === "error") break;
      }
    } finally {
      setWritingAll(false);
    }
  }, [writeSection]);

  const completedSteps = useMemo(() => {
    const completed: StudioStep[] = [];
    if (outline) completed.push("brief");
    if (outline?.sections.some((section) => section.text)) completed.push("outline");
    return completed;
  }, [outline]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Stepper
          steps={STUDIO_STEPS}
          currentId={step}
          completedIds={completedSteps}
          onStepClick={(id) => {
            if (id === "brief" || outline) setStep(id as StudioStep);
          }}
        />
        {outline && (
          <p className="text-xs text-muted">
            {outline.sections.length} sections · {wordTotal.toLocaleString("en-US")} words written
          </p>
        )}
      </div>

      {step === "brief" && (
        <Card>
          <CardBody className="sm:px-6 sm:py-5">
            <BriefForm
              brief={brief}
              onChange={setBrief}
              onSubmit={planOutline}
              submitting={planning}
              errors={briefErrors}
            />
          </CardBody>
        </Card>
      )}

      {step === "outline" && outline && (
        <Card>
          <CardBody className="sm:px-6 sm:py-5">
            <OutlineEditor
              outline={outline}
              onChange={setOutline}
              onBack={() => setStep("brief")}
              onGenerate={() => {
                setStep("draft");
                void writeAll();
              }}
              generating={writingAll}
            />
          </CardBody>
        </Card>
      )}

      {step === "draft" && outline && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate font-serif text-xl font-semibold tracking-tight text-ink">
                {outline.title}
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                Generated from your brief. Edit any section in place.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setStep("outline")}>
                Edit outline
              </Button>
              <Button
                size="sm"
                onClick={() => void writeAll()}
                disabled={writingAll || outline.sections.every((section) => section.text)}
              >
                {writingAll ? "Writing…" : "Write remaining sections"}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {outline.sections.map((section, index) => (
              <SectionCard
                key={section.id}
                section={section}
                index={index}
                disabled={writingAll}
                onTextChange={(text) =>
                  updateSection(section.id, { text, status: "ready" })
                }
                onGenerate={() => void writeSection(section.id)}
              />
            ))}
          </div>

          <div className="flex items-start gap-2.5 rounded-control border border-line bg-subtle px-3 py-2.5">
            <Info className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
            <p className="text-xs text-muted">
              Drafts are held in this browser tab only. Saving to your library arrives
              with document storage, so nothing here is persisted yet.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
