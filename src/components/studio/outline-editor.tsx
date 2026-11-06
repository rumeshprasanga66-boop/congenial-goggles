"use client";

import { ArrowLeft, GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import { sectionId, type StudioOutline } from "./types";

/**
 * Outline review step. The outline is the cheapest place to correct structure,
 * so this step is editable before any prose is generated.
 */
export function OutlineEditor({
  outline,
  onChange,
  onBack,
  onGenerate,
  generating,
  disabled,
}: {
  outline: StudioOutline;
  onChange: (next: StudioOutline) => void;
  onBack: () => void;
  onGenerate: () => void;
  generating: boolean;
  disabled?: boolean;
}) {
  const totalTarget = outline.sections.reduce(
    (sum, section) => sum + section.wordTarget,
    0,
  );

  function updateSection(index: number, patch: Partial<StudioOutline["sections"][number]>) {
    const sections = outline.sections.map((section, position) =>
      position === index ? { ...section, ...patch } : section,
    );
    onChange({ ...outline, sections });
  }

  function removeSection(index: number) {
    onChange({
      ...outline,
      sections: outline.sections.filter((_, position) => position !== index),
    });
  }

  function addSection() {
    onChange({
      ...outline,
      sections: [
        ...outline.sections,
        {
          id: sectionId(),
          title: "New section",
          summary: "",
          wordTarget: 150,
          text: null,
          status: "pending",
        },
      ],
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <label
          htmlFor="outline-title"
          className="block text-xs font-medium text-ink"
        >
          Title
        </label>
        <Input
          id="outline-title"
          value={outline.title}
          onChange={(event) => onChange({ ...outline, title: event.target.value })}
          maxLength={200}
          disabled={disabled}
          className="mt-1.5 text-base font-semibold"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-ink">Sections</h3>
          <p className="text-xs text-muted">
            {outline.sections.length} section
            {outline.sections.length === 1 ? "" : "s"} · about {totalTarget.toLocaleString("en-US")} words
          </p>
        </div>

        <ul className="mt-2 space-y-2">
          {outline.sections.map((section, index) => (
            <li
              key={section.id}
              className="flex items-start gap-2 rounded-control border border-line bg-surface p-2.5"
            >
              <span className="mt-2 text-faint" aria-hidden="true">
                <GripVertical className="size-4" />
              </span>
              <span className="mt-1.5 w-5 shrink-0 text-center text-xs font-medium text-faint">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1 space-y-1.5">
                <label className="sr-only" htmlFor={`${section.id}-title`}>
                  Section {index + 1} title
                </label>
                <Input
                  id={`${section.id}-title`}
                  value={section.title}
                  onChange={(event) => updateSection(index, { title: event.target.value })}
                  maxLength={200}
                  disabled={disabled}
                  className="h-8 font-medium"
                />
                <label className="sr-only" htmlFor={`${section.id}-summary`}>
                  Section {index + 1} description
                </label>
                <Input
                  id={`${section.id}-summary`}
                  value={section.summary}
                  onChange={(event) => updateSection(index, { summary: event.target.value })}
                  maxLength={600}
                  disabled={disabled}
                  placeholder="What this section should cover"
                  className="h-8 text-xs"
                />
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <label className="sr-only" htmlFor={`${section.id}-words`}>
                  Section {index + 1} word target
                </label>
                <Input
                  id={`${section.id}-words`}
                  type="number"
                  min={40}
                  max={5000}
                  step={10}
                  value={section.wordTarget}
                  onChange={(event) =>
                    updateSection(index, {
                      wordTarget: Math.max(40, Number(event.target.value) || 40),
                    })
                  }
                  disabled={disabled}
                  className="h-8 w-20 text-xs"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSection(index)}
                  disabled={disabled || outline.sections.length <= 1}
                  aria-label={`Remove section ${index + 1}: ${section.title}`}
                  className="px-2"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={addSection}
          disabled={disabled || outline.sections.length >= 12}
          className={cn(
            "mt-2 inline-flex items-center gap-1.5 rounded-control px-2 py-1.5 text-xs font-medium text-muted transition-colors",
            "hover:bg-subtle hover:text-ink disabled:pointer-events-none disabled:opacity-50",
          )}
        >
          <Plus className="size-3.5" aria-hidden="true" />
          Add a section
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <Button onClick={onGenerate} disabled={generating || disabled}>
          {generating ? "Writing…" : "Write the draft"}
        </Button>
        <Button variant="ghost" onClick={onBack} disabled={generating}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to brief
        </Button>
        <p className="text-xs text-muted">
          Sections are written one at a time so you can review as they arrive.
        </p>
      </div>
    </div>
  );
}
